import { Injectable, Logger } from '@nestjs/common';
import { MarketplaceService } from '../marketplace.service';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CompanyModel } from '../../company/company.model';
import { CategoryModel } from '../../category/category.model';
import { ProductModel } from '../../product/product.model';
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
      await this.setYandexMarketSkus(map);
      this.logger.log(`Updated all yandex.market skus`);
    }
  }

  @Interval(60000)
  async updateYandexPricesQueue() {
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
    await this.sendPricesFromQueue();
  }

  @Interval(120000)
  async updateHiddenProducts() {
    const settings = await this.activeSettings();

    for (const setting of settings) {
      this.logger.log(`Start updating hidden products for ${setting.name}`);

      const products = await this.actualProductsHiddenFlag(setting);
      this.logger.log(
        `Got ${products.size} products to update hidden products for ${setting.name}`,
      );
      const service = new YandexMarketIntegration(setting, this.httpService);

      const hiddenProducts = await service.getYandexMarketHiddenProducts();

      const toHide = [];
      const toShow = [];

      products.forEach((available, yandexMarketSku) => {
        const hidden = hiddenProducts.find(
          (element) => element === yandexMarketSku,
        );
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
        await service.hideProducts(toHide);
      }

      if (toShow.length > 0) {
        await service.showProducts(toShow);
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

      this.logger.log(`Deleting ${setting.name} prices from queue`);
      await service.updatePrices(prices);
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

  private async setYandexMarketSkus(skus: Map<string, number>) {
    const start = new Date().getTime();
    const productsToUpdate = (await this.productModel
      .aggregate()
      .match({
        articul: { $in: [...skus.keys()] },
      })
      .addFields({
        needToUpdate: {
          $function: {
            body: `function(articul, yandexMarketSku, skus) {
                    let needToUpdate = false;
                    const marketSku = skus[articul];
                    if (marketSku && yandexMarketSku !== marketSku) {
                      needToUpdate = true;
                    }
                    return needToUpdate;
                  }`,
            args: ['$articul', '$yandexMarketSku', skus],
            lang: 'js',
          },
        },
      })
      .match({
        needToUpdate: true,
      })
      .project({
        _id: 1,
        articul: 1,
      })
      .exec()) as { _id: Types.ObjectId; articul: string }[];
    const end = new Date().getTime();

    this.logger.warn(
      `Getting products to update Yandex.Market sku elapsed: ${end - start} ms`,
    );

    this.logger.log(
      `Need to update ${productsToUpdate.length} yandex.market skus in products`,
    );
    let updated = 0;

    for (const { _id, articul } of productsToUpdate) {
      const sku = skus.get(articul);
      await this.productModel.findByIdAndUpdate(
        _id,
        {
          yandexMarketSku: sku,
        },
        {
          useFindAndModify: false,
        },
      );
      this.logger.log(`Updated ${++updated} yandex.market skus`);
    }
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
  ): Promise<Map<number, boolean>> {
    const result = new Map<number, boolean>();

    const categories = await this.categoryInfo(settings);
    const products = await this.productInfo(settings, {
      yandexMarketSku: { $exists: true },
    });

    this.logger.log(`Got ${products.length} with yandex market sku`);

    const categoryInfo = new Map<string, boolean>();
    categories.forEach((item) => categoryInfo.set(item.erpCode, item.blocked));

    products.forEach((product) => {
      if (!categoryInfo.has(product.categoryCode)) {
        result.set(product.yandexMarketSku, false);
        return;
      }

      if (!product.calculatedPrice) {
        result.set(product.yandexMarketSku, false);
        return;
      }

      const blocked = categoryInfo.get(product.categoryCode);
      const { minimalPrice, nullifyStocks } = settings;

      let available = true;
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

      result.set(product.yandexMarketSku, available);
    });

    return result;
  }

  private async updatedYandexMarketPrices(
    settings: YandexMarketModel,
  ): Promise<UpdatedPrice[]> {
    const { specialPriceName } = settings;
    let fromDate = new Date(2020, 1, 1);

    if (settings.lastPriceUpdate) {
      fromDate = settings.lastPriceUpdate;
    }

    return this.productModel
      .aggregate()
      .match({
        yandexMarketSku: { $exists: true },
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
        marketSku: updatedPrice.yandexMarketSku,
        price: updatedPrice.calculatedPrice,
      });
    }
  }
}
