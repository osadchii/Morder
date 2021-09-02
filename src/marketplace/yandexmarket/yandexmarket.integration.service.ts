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

interface UpdatedPrice {
  yandexMarketSku: number;
  calculatedPrice: number;
  updatedAt: Date;
}

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

    for (const item of settings) {
      this.logger.log(`Start ${item.name} yandex.market getting skus`);

      const service = new YandexMarketIntegration(item, this.httpService);
      const map = await service.getYandexMarketSkus();

      this.logger.log(`Got ${map.size} yandex.market total skus`);
      for (const item of map) {
        await this.setYandexMarketSku(item[0], item[1]);
      }

      this.logger.log(`Save ${item.name} last update market skus`);
      await this.setLastUpdateMarketSkus(item);
    }
  }

  @Interval(10000)
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

  private async setYandexMarketSku(articul: string, sku: number) {
    return this.productModel.findOneAndUpdate(
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
    );
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
