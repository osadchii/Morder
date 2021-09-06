import { Injectable, Logger } from '@nestjs/common';
import { MarketplaceService } from '../marketplace.service';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CompanyModel } from '../../company/company.model';
import { CategoryModel } from '../../category/category.model';
import {
  ProductMarketplaceSettings,
  ProductModel,
} from '../../product/product.model';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { YandexMarketModel } from './yandexmarket.model';
import { Interval } from '@nestjs/schedule';
import { YandexMarketIntegration } from './yandexmarket.integration';
import { YandexMarketSendPriceQueueModel } from './yandexmarket.sendprice.queue.model';
import { UpdatedPrice } from './integration-model/yandexmarket-updated-price.model';
import { Types } from 'mongoose';

@Injectable()
export class YandexMarketIntegrationService extends MarketplaceService {
  private readonly logger = new Logger(YandexMarketIntegrationService.name);

  constructor(
    @InjectModel(YandexMarketModel)
    private readonly marketplaceModel: ModelType<YandexMarketModel>,
    @InjectModel(YandexMarketSendPriceQueueModel)
    private readonly sendPriceQueue: ModelType<YandexMarketSendPriceQueueModel>,
    @InjectModel(CompanyModel)
    protected readonly companyModel: ModelType<CompanyModel>,
    @InjectModel(CategoryModel)
    protected readonly categoryModel: ModelType<CategoryModel>,
    @InjectModel(ProductModel)
    protected readonly productModel: ModelType<ProductModel>,
    protected readonly configService: ConfigService,
    protected readonly httpService: HttpService,
  ) {
    super(companyModel, categoryModel, productModel, configService);
  }

  @Interval(60000)
  async updateYandexMarketSkus() {
    const settings = await this.settingsToUpdateMarketSkus();

    this.logger.log(
      `Got ${settings.length} yandex.market settings to update market skus`,
    );

    for (const setting of settings) {
      this.logger.log(`Save ${setting.name} last update market skus`);
      await this.setLastUpdateMarketSkus(setting);

      this.logger.log(`Start ${setting.name} yandex.market getting skus`);

      const service = new YandexMarketIntegration(setting, this.httpService);
      const map = await service.getYandexMarketSkus();

      this.logger.log(`Saving ${map.size} yandex.market skus`);
      await this.setYandexMarketSkus(setting, map);
      this.logger.log(`Updated all yandex.market skus`);
    }
  }

  @Interval(60000)
  async updateYandexPricesQueue() {
    return;
    const settings = await this.settingsToUpdatePrices();

    this.logger.log(
      `Got ${settings.length} yandex.market settings to update prices`,
    );

    for (const setting of settings) {
      const now = new Date();
      const prices = await this.updatedYandexMarketPrices(setting);

      this.logger.log(
        `Got ${prices.length} prices to update in ${setting.name}`,
      );

      await this.saveUpdatedPricesToQueue(setting, prices);
      await this.setLastUpdatePrices(setting, now);
    }
  }

  @Interval(90000)
  async sendPricesToYandexMarket() {
    return;
    await this.sendPricesFromQueue();
  }

  @Interval(30000)
  async updateHiddenProducts() {
    return;
    const settings = await this.activeSettings();
    const sendLimit = 5;

    for (const setting of settings) {
      this.logger.log(`Start updating hidden products for ${setting.name}`);

      const products = await this.actualProductsHiddenFlag(setting);
      this.logger.log(
        `Got ${products.length} products to update hidden products for ${setting.name}`,
      );
      const service = new YandexMarketIntegration(setting, this.httpService);

      const hiddenProducts = await service.getYandexMarketHiddenProducts();

      this.logger.log(
        `Got ${hiddenProducts.length} hidden products of ${setting.name}`,
      );

      const toHide = [];
      const toShow = [];

      products.forEach(({ yandexMarketSku, articul, available }) => {
        const hidden = hiddenProducts.find((element) => element === articul);
        if (hidden && available) {
          toShow.push(yandexMarketSku);
        }
        if (!hidden && !available) {
          toHide.push(yandexMarketSku);
        }
      });
      this.logger.log(
        `Need to hide ${toHide.length} products for ${setting.name}`,
      );
      this.logger.log(
        `Need to show ${toShow.length} products for ${setting.name}`,
      );

      if (toHide.length > 0) {
        await service.hideProducts(toHide.slice(0, sendLimit));
      }

      if (toShow.length > 0) {
        await service.showProducts(toShow.slice(0, sendLimit));
      }
    }
  }

  private async sendPricesFromQueue() {
    const settings = await this.marketplaceModel.find({
      active: true,
      updatePricesByApi: true,
    });

    for (const setting of settings) {
      const prices = await this.queuedPricesBySettings(setting);
      this.logger.log(
        `Got ${prices.length} prices for ${setting.name} to send to yandex.market`,
      );

      if (prices.length === 0) {
        continue;
      }

      this.logger.log(`Sending ${setting.name} prices`);

      const service = new YandexMarketIntegration(setting, this.httpService);
      await service.updatePrices(prices);

      this.logger.log(`Deleting ${setting.name} prices from queue`);
      await this.deletePricesFromSendQueue(prices);
    }
  }

  private async deletePricesFromSendQueue(
    prices: YandexMarketSendPriceQueueModel[],
  ) {
    for (const price of prices) {
      await this.sendPriceQueue.findByIdAndDelete(price._id);
    }
  }

  private async queuedPricesBySettings({ _id }: YandexMarketModel) {
    return this.sendPriceQueue
      .find({
        marketplaceId: _id,
      })
      .sort({ updatedAt: 1 })
      .limit(50)
      .exec();
  }

  private async setYandexMarketSkus(
    { _id, name }: YandexMarketModel,
    skus: Map<string, number>,
  ) {
    const productsToUpdate = await this.productModel
      .find(
        {
          articul: { $in: [...skus.keys()] },
        },
        {
          _id: 1,
          articul: 1,
          marketplaceSettings: 1,
        },
      )
      .exec();

    this.logger.log(
      `Need to update ${productsToUpdate.length} yandex.market skus in products for ${name}`,
    );
    let errors = 0;
    let updated = 0;

    for (const product of productsToUpdate) {
      const sku = skus.get(product.articul);
      if (typeof sku === 'undefined') {
        this.logger.log(`Sku for ${product.articul} not found`);
        continue;
      }
      try {
        const result = await this.setYandexMarketSku(product, _id, sku);
        if (result) {
          updated++;
        }
      } catch (error) {
        this.logger.error(
          `Error while saving yandex market sku for ${product.articul} with identifier: ${sku}.\n${error.stack}`,
        );
        errors++;
      }
    }

    this.logger.log(`Errors while saving ym skus: ${errors}`);
    this.logger.log(`Updated ym skus: ${updated}`);
  }

  private async setYandexMarketSku(
    product: ProductModel,
    marketplaceId: Types.ObjectId,
    sku: number,
  ): Promise<boolean> {
    if (!product.marketplaceSettings) {
      product.marketplaceSettings = [];
    }

    const { marketplaceSettings } = product;
    const newSettings: ProductMarketplaceSettings[] = [];
    const mId = marketplaceId.toHexString();
    const identifier = sku.toString();
    let needUpdate = false;

    for (const currentSetting of marketplaceSettings) {
      let alreadyInNew = false;

      for (const newSetting of newSettings) {
        if (
          newSetting.marketplaceId.toHexString() ==
          currentSetting.marketplaceId.toHexString()
        ) {
          alreadyInNew = true;
          break;
        }
      }

      if (alreadyInNew) {
        needUpdate = true;
        this.logger.log(`SKU: ${identifier}. Zero branch`);
        continue;
      }

      if (
        (currentSetting.marketplaceId.toHexString() == mId &&
          currentSetting.identifier == identifier) ||
        currentSetting.marketplaceId.toHexString() != mId
      ) {
        newSettings.push({
          ...currentSetting,
        });
        this.logger.log(
          `SKU: ${identifier}. First branch.
          \nCurrent MP ID: ${currentSetting.marketplaceId}. MP ID: ${mId}
          \nCurrent ID: ${currentSetting.identifier}. ID: ${identifier}`,
        );
      } else {
        newSettings.push({
          ...currentSetting,
          identifier: identifier,
        });
        this.logger.log(`SKU: ${identifier}. Second branch`);
        needUpdate = true;
      }
    }

    await this.productModel
      .findByIdAndUpdate(
        product._id,
        {
          marketplaceSettings: newSettings,
        },
        {
          useFindAndModify: false,
        },
      )
      .exec();

    return needUpdate;
  }

  private async setLastUpdateMarketSkus({ _id }: YandexMarketModel) {
    return this.marketplaceModel
      .findByIdAndUpdate(
        _id,
        {
          lastUpdateMarketSkus: new Date(),
        },
        {
          useFindAndModify: false,
        },
      )
      .exec();
  }

  private async setLastUpdatePrices({ _id }: YandexMarketModel, date: Date) {
    return this.marketplaceModel
      .findByIdAndUpdate(
        _id,
        {
          lastPriceUpdate: date,
        },
        {
          useFindAndModify: false,
        },
      )
      .exec();
  }

  private async settingsToUpdateMarketSkus() {
    const settings = await this.marketplaceModel
      .find({
        active: true,
        updateMarketSkus: true,
      })
      .exec();

    const result: YandexMarketModel[] = [];

    const currentDate = new Date();

    settings.forEach((item) => {
      if (item.lastUpdateMarketSkus) {
        const differenceTime =
          currentDate.getTime() - item.lastUpdateMarketSkus.getTime();
        const maximalDifferenceTime = item.updateMarketSkusInterval * 1000 * 60;
        if (differenceTime > maximalDifferenceTime) {
          result.push(item);
        }
      } else {
        result.push(item);
      }
    });

    return result;
  }

  private async settingsToUpdatePrices() {
    return this.marketplaceModel
      .find({
        active: true,
        updatePricesByApi: true,
        $or: [
          { lastPriceUpdate: { $lt: new Date() } },
          { lastPriceUpdate: null },
        ],
      })
      .exec();
  }

  private async activeSettings() {
    return this.marketplaceModel
      .find({
        active: true,
      })
      .exec();
  }

  private async actualProductsHiddenFlag(
    settings: YandexMarketModel,
  ): Promise<
    { articul: string; yandexMarketSku: number; available: boolean }[]
  > {
    const result: {
      articul: string;
      yandexMarketSku: number;
      available: boolean;
    }[] = [];

    const categories = await this.categoryInfo(settings);
    const products = await this.productInfo(settings);

    this.logger.log(`Got ${products.length} products with yandex market sku`);

    const categoryInfo = new Map<string, boolean>();
    categories.forEach((item) => categoryInfo.set(item.erpCode, item.blocked));

    products.forEach((product) => {
      if (
        !product.concreteMarketplaceSettings ||
        !product.concreteMarketplaceSettings.identifier
      ) {
        return;
      }
      let available = true;
      const productInfo = {
        articul: product.articul,
        yandexMarketSku: Number.parseInt(
          product.concreteMarketplaceSettings.identifier,
        ),
      };

      if (!categoryInfo.has(product.categoryCode)) {
        result.push({
          ...productInfo,
          available: false,
        });
        return;
      }

      if (!product.calculatedPrice) {
        result.push({
          ...productInfo,
          available: false,
        });
        return;
      }

      const blocked = categoryInfo.get(product.categoryCode);
      const { minimalPrice, nullifyStocks } = settings;
      let ignoreRestrictions = false;
      let nullifyProductStocks = false;

      if (product.concreteMarketplaceSettings) {
        const marketplaceSettings = product.concreteMarketplaceSettings;
        ignoreRestrictions = marketplaceSettings.ignoreRestrictions;
        nullifyProductStocks = marketplaceSettings.nullifyStock;
      }

      if (blocked && !ignoreRestrictions) {
        available = false;
      }

      if (
        minimalPrice > 0 &&
        minimalPrice > product.calculatedPrice &&
        !ignoreRestrictions
      ) {
        available = false;
      }

      if (nullifyProductStocks || nullifyStocks) {
        product.stock = 0;
      }

      if (product.stock === 0) {
        available = false;
      }

      result.push({
        ...productInfo,
        available: available,
      });
    });

    return result;
  }

  private async updatedYandexMarketPrices(
    settings: YandexMarketModel,
  ): Promise<UpdatedPrice[]> {
    const { specialPriceName, _id } = settings;
    let fromDate = new Date(2020, 1, 1);

    if (settings.lastPriceUpdate) {
      fromDate = settings.lastPriceUpdate;
    }

    return this.productModel
      .aggregate()
      .match({
        isDeleted: false,
        priceUpdatedAt: { $gte: fromDate },
      })
      .sort({ priceUpdatedAt: 1 })
      .addFields({
        calculatedPrice: {
          $function: {
            body: MarketplaceService.CalculatedPriceFunctionText(),
            args: ['$specialPrices', specialPriceName, '$price'],
            lang: 'js',
          },
        },
        concreteMarketplaceSettings: {
          $function: {
            body: MarketplaceService.MarketplaceSettingsFunctionText(),
            args: ['$marketplaceSettings', _id],
            lang: 'js',
          },
        },
      })
      .addFields({
        yandexMarketSku: '$concreteMarketplaceSettings.identifier',
      })
      .match({
        yandexMarketSku: { $exists: true },
      })
      .project({
        yandexMarketSku: 1,
        calculatedPrice: 1,
        priceUpdatedAt: 1,
      })
      .exec();
  }

  private async saveUpdatedPricesToQueue(
    { _id }: YandexMarketModel,
    updatedPrices: UpdatedPrice[],
  ) {
    for (const updatedPrice of updatedPrices) {
      await this.sendPriceQueue.create({
        marketplaceId: _id,
        marketSku: Number.parseInt(updatedPrice.yandexMarketSku),
        price: updatedPrice.calculatedPrice,
      });
    }
  }
}
