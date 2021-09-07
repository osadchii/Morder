import { Logger } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { YandexMarketModel } from '../yandexmarket.model';
import { ProductModel } from '../../../product/product.model';
import { HttpService } from '@nestjs/axios';

export class YandexMarketHiddenProductsUpdater {
  private readonly logger = new Logger(YandexMarketHiddenProductsUpdater.name);

  constructor(
    private readonly marketplaceModel: ModelType<YandexMarketModel>,
    private readonly productModel: ModelType<ProductModel>,
    private readonly httpService: HttpService,
  ) {}

  async updateHiddenProducts() {
    const settings = await this.activeSettings();

    for (const setting of settings) {
      const { name } = setting;
      this.logger.log(`Start updating hidden products ${name}`);
      await this.updateHiddenProductsBySetting(setting);
      this.logger.log(`End updating hidden products ${name}`);
    }
  }

  private async updateHiddenProductsBySetting(setting: YandexMarketModel) {}

  private async activeSettings() {
    return this.marketplaceModel
      .find({
        active: true,
      })
      .exec();
  }
}
