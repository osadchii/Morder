import { YandexMarketModel } from '../yandexmarket.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import {
  ProductMarketplaceSettings,
  ProductModel,
} from '../../../product/product.model';
import { YandexMarketIntegration } from '../yandexmarket.integration';
import { Types } from 'mongoose';

export class YandexMarketSkuUpdater {
  private readonly logger = new Logger(YandexMarketSkuUpdater.name);

  constructor(
    private readonly marketplaceModel: ModelType<YandexMarketModel>,
    private readonly productModel: ModelType<ProductModel>,
    private readonly httpService: HttpService,
  ) {}

  async updateYandexMarketSkus() {
    const settings = await this.settingsToUpdateSkus();

    for (const setting of settings) {
      await this.updateYandexMarketSkusBySetting(setting);
    }
  }

  private async updateYandexMarketSkusBySetting(setting: YandexMarketModel) {
    await this.setLastUpdateMarketSkus(setting);

    const integration = new YandexMarketIntegration(setting, this.httpService);
    const yandexSkus = await integration.getYandexMarketSkus();

    if (yandexSkus.size === 0) {
      return;
    }

    await this.setYandexMarketSkus(setting, yandexSkus);
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

  private async settingsToUpdateSkus() {
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
}
