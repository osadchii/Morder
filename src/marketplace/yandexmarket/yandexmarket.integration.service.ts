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
      let saved = 0;
      for (const [articul, sku] of map) {
        await this.setYandexMarketSku(articul, sku);
        this.logger.log(`Saved ${++saved} yandex.market skus`);
      }
      this.logger.log(`Saved all yandex.market skus`);
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

  private async sendPricesFromQueue() {
    const settings = await this.marketplaceModel.find({
      active: true,
      updatePricesByApi: true,
    });

    for (const setting of settings) {
      const prices = await this.queuedPricesBySettings(setting);
      this.logger.log(
        `Got ${prices.length} for ${setting.name} to send to yandex.market`,
      );

      if (prices.length === 0) {
        continue;
      }

      const service = new YandexMarketIntegration(setting, this.httpService);
      await service.updatePrices(prices);
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

  private async setYandexMarketSku(articul: string, sku: number) {
    return this.productModel
      .findOneAndUpdate(
        {
          articul: articul,
          $or: [{ yandexMarketSku: { $ne: sku } }, { yandexMarketSku: null }],
        },
        {
          yandexMarketSku: sku,
        },
        {
          useFindAndModify: false,
        },
      )
      .exec();
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

  private async updatedYandexMarketPrices(
    settings: YandexMarketModel,
  ): Promise<UpdatedPrice[]> {
    const { specialPriceName } = settings;
    let fromDate = new Date(2020, 1, 1);

    if (settings.lastPriceUpdate) {
      fromDate = settings.lastPriceUpdate;
    }

    this.logger.log(fromDate);
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
