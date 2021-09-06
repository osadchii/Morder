import { YandexMarketModel } from '../yandexmarket.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { ProductModel } from '../../../product/product.model';
import { YandexMarketIntegration } from '../yandexmarket.integration';

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
      this.logger.log(`Start updating ${setting.name} SKUs`);
      await this.updateYandexMarketSkusBySetting(setting);
    }
  }

  private async updateYandexMarketSkusBySetting(setting: YandexMarketModel) {
    await this.setLastUpdateMarketSkus(setting);

    const integration = new YandexMarketIntegration(setting, this.httpService);
    const yandexSkus = await integration.getYandexMarketSkus();

    this.logger.log(
      `Received ${yandexSkus.size} Yandex.Market SKUs for ${setting.name}`,
    );

    if (yandexSkus.size === 0) {
      return;
    }

    await this.setYandexMarketSkus(setting, yandexSkus);
  }

  private async setYandexMarketSkus(
    setting: YandexMarketModel,
    yandexSkus: Map<string, number>,
  ) {
    const products = await this.productsByArticuls([...yandexSkus.keys()]);

    this.logger.log(
      `Received ${products.length} products to update Yandex.Market SKUs for ${setting.name}`,
    );

    for (const product of products) {
      const { articul } = product;

      if (!yandexSkus.has(articul)) {
        this.logger.warn(
          `Can't find Yandex.Market SKU for articul ${articul} for ${setting.name}`,
        );
        continue;
      }

      const sku = yandexSkus.get(articul).toString();
      await this.setYandexMarketSku(product, setting, sku);
    }
  }

  private async setYandexMarketSku(
    product: ProductModel,
    setting: YandexMarketModel,
    yandexSku: string,
  ) {
    const settingId = setting._id.toHexString();

    let hasSet = false;
    let needSave = false;
    let branch = 0;

    if (!product.marketplaceSettings) {
      product.marketplaceSettings = [];
    }

    for (const marketplaceSetting of product.marketplaceSettings) {
      const marketplaceId = marketplaceSetting.marketplaceId.toHexString();
      const isDesired = marketplaceId === settingId;

      if (isDesired) {
        const skuAlreadySet =
          marketplaceSetting.identifier &&
          marketplaceSetting.identifier === yandexSku;

        if (!skuAlreadySet) {
          marketplaceSetting.identifier = yandexSku;
          needSave = true;
          hasSet = true;

          branch = 1;
        }
      }
    }

    if (!hasSet) {
      product.marketplaceSettings.push({
        marketplaceId: setting._id,
        ignoreRestrictions: false,
        nullifyStock: false,
        identifier: yandexSku,
      });

      hasSet = true;
      needSave = true;

      branch = 2;
    }

    if (needSave) {
      await this.productModel
        .findByIdAndUpdate(
          product._id,
          {
            marketplaceSettings: product.marketplaceSettings,
          },
          {
            useFindAndModify: false,
          },
        )
        .exec();
      this.logger.log(
        `Updated ${product.articul}. The identifier ${
          hasSet ? `was set in branch ${branch}` : "wasn't set"
        }`,
      );
    }
  }

  private async productsByArticuls(articuls: string[]) {
    return this.productModel
      .find(
        {
          articul: { $in: articuls },
          isDeleted: false,
        },
        {
          _id: 1,
          articul: 1,
          marketplaceSettings: 1,
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
