import { Logger } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { YandexMarketModel } from '../yandexmarket.model';
import { ProductModel } from '../../../product/product.model';
import { HttpService } from '@nestjs/axios';
import { YandexMarketSendPriceQueueModel } from '../yandexmarket.sendprice.queue.model';
import { UpdatedPrice } from '../integration-model/yandexmarket-updated-price.model';
import { MarketplaceService } from '../../marketplace.service';
import { YandexMarketIntegration } from '../yandexmarket.integration';

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

  async sendQueuedPrices() {
    const settings = await this.settingsToUpdatePrices();

    for (const setting of settings) {
      this.logger.log(`Start sending ${setting.name} queued prices`);
      await this.sendQueuedPricesBySetting(setting);
      this.logger.log(`End sending ${setting.name} queued prices`);
    }
  }

  private async sendQueuedPricesBySetting(setting: YandexMarketModel) {
    const prices = await this.queuedPricesBySettings(setting);

    this.logger.log(
      `Received ${prices.length} queued prices for ${setting.name}`,
    );

    if (prices.length === 0) {
      return;
    }

    const service = new YandexMarketIntegration(setting, this.httpService);

    try {
      await service.updatePrices(prices);
      await this.deletePricesFromSendQueue(prices);
      this.logger.log(
        `Deleted ${prices.length} for ${setting.name} from queue`,
      );
    } catch (error) {
      const { response } = error;
      const { status, statusText, data } = response;
      this.logger.error(
        `Can't send prices to yandex.market.\nStatus: ${status}\nStatus text: ${statusText}.\nData: ${data.toString()}`,
      );
    }
  }

  private async deletePricesFromSendQueue(
    prices: YandexMarketSendPriceQueueModel[],
  ) {
    for (const price of prices) {
      await this.sendPriceQueue.findByIdAndDelete(price._id);
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

  private async queuedPricesBySettings(setting: YandexMarketModel) {
    return this.sendPriceQueue
      .find({
        marketplaceId: setting._id,
      })
      .sort({ updatedAt: 1 })
      .limit(50)
      .exec();
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
