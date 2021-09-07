import { Logger } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { YandexMarketModel } from '../yandexmarket.model';
import { ProductModel } from '../../../product/product.model';
import { HttpService } from '@nestjs/axios';
import { YandexMarketSendPriceQueueModel } from '../yandexmarket.sendprice.queue.model';
import { UpdatedPrice } from '../integration-model/yandexmarket-updated-price.model';
import { MarketplaceService } from '../../marketplace.service';

export class YandexMarketPriceUpdater {
  private readonly logger = new Logger(YandexMarketPriceUpdater.name);

  constructor(
    private readonly marketplaceModel: ModelType<YandexMarketModel>,
    private readonly productModel: ModelType<ProductModel>,
    private readonly sendPriceQueue: ModelType<YandexMarketSendPriceQueueModel>,
    private readonly httpService: HttpService,
  ) {}

  async updatePriceQueues() {
    const settings = await this.settingsToUpdatePrices();

    for (const setting of settings) {
      this.logger.log(`Start updating ${setting.name} send price queue`);
      await this.updatePriceQueueBySetting(setting);
      this.logger.log(`End updating ${setting.name} send price queue`);
    }
  }

  private async updatePriceQueueBySetting(setting: YandexMarketModel) {
    const date = new Date();
    const updatedPrices = await this.updatedPricesBySetting(setting);

    this.logger.log(
      `Received ${updatedPrices.length} updated prices for ${setting.name}`,
    );

    for (const updatedPrice of updatedPrices) {
      await this.saveUpdatedPriceToQueue(setting, updatedPrice);
    }

    await this.setLastUpdatePrices(setting, date);
  }

  private async saveUpdatedPriceToQueue(
    setting: YandexMarketModel,
    updatedPrice: UpdatedPrice,
  ) {
    return this.sendPriceQueue.create({
      marketplaceId: setting._id,
      marketSku: Number.parseInt(updatedPrice.yandexMarketSku),
      price: updatedPrice.calculatedPrice,
    });
  }

  private async setLastUpdatePrices(setting: YandexMarketModel, date: Date) {
    return this.marketplaceModel
      .findByIdAndUpdate(
        setting._id,
        {
          lastPriceUpdate: date,
        },
        {
          useFindAndModify: false,
        },
      )
      .exec();
  }

  private async updatedPricesBySetting(
    setting: YandexMarketModel,
  ): Promise<UpdatedPrice[]> {
    const { specialPriceName, _id } = setting;

    let fromDate = new Date(2020, 1, 1);

    if (setting.lastPriceUpdate) {
      fromDate = setting.lastPriceUpdate;
    }

    return this.productModel
      .aggregate()
      .match({
        isDeleted: false,
        priceUpdatedAt: { $gte: fromDate },
        marketplaceSettings: {
          $elemMatch: {
            marketplaceId: _id,
          },
        },
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
}
