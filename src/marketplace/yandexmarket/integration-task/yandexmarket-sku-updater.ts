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
      const { name } = setting;
      this.logger.log(`Start updating ${name} SKUs`);
      await this.updateYandexMarketSkusBySetting(setting);
      this.logger.log(`End updating ${name} SKUs`);
    }
  }

  async resetYandexMarketSku(setting: YandexMarketModel, sku: string) {
    const products = await this.productModel
      .find({
        marketplaceSettings: {
          $elemMatch: {
            marketplaceId: setting._id,
            identifier: sku,
          },
        },
      })
      .exec();

    for (const product of products) {
      await this.setYandexMarketSku(product, setting);
    }
  }

  async setYandexMarketSku(
    product: ProductModel,
    setting: YandexMarketModel,
    yandexSku?: string,
  ): Promise<boolean> {
    let hasSet = false;
    let needSave = false;

    if (!product.marketplaceSettings) {
      product.marketplaceSettings = [];
    }

    for (const marketplaceSetting of product.marketplaceSettings) {
      const isDesired = marketplaceSetting.marketplaceId.equals(setting._id);

      if (isDesired) {
        const skuAlreadySet =
          marketplaceSetting.identifier &&
          marketplaceSetting.identifier === yandexSku;

        if (!skuAlreadySet) {
          if (yandexSku) {
            marketplaceSetting.identifier = yandexSku;
          } else {
            marketplaceSetting.identifier = undefined;
          }
          needSave = true;
        } else {
          hasSet = true;
        }
      }
    }

    if (!hasSet && yandexSku) {
      product.marketplaceSettings.push({
        marketplaceId: setting._id,
        ignoreRestrictions: false,
        nullifyStock: false,
        identifier: yandexSku,
      });

      needSave = true;
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
    }

    return needSave;
  }

  private async updateYandexMarketSkusBySetting(setting: YandexMarketModel) {
    await this.setLastUpdateMarketSkus(setting);

    const integration = new YandexMarketIntegration(setting, this.httpService);
    const yandexSkus = await integration
      .getYandexMarketSkus()
      .catch((error) => {
        const { response } = error;
        const { status, statusText, data } = response;
        this.logger.error(
          `Can't get yandex.market skus.\nStatus code: ${status}\nStatus text: ${statusText}\nData: ${JSON.stringify(
            data,
          )}`,
        );
      });

    if (!yandexSkus) {
      return;
    }

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
    const products = await this.productToUpdateSkus(setting, [
      ...yandexSkus.keys(),
    ]);

    this.logger.log(
      `Received ${products.length} products to update Yandex.Market SKUs for ${setting.name}`,
    );

    let updated = 0;

    for (const product of products) {
      const { articul } = product;
      let sku = undefined;

      if (yandexSkus.has(articul)) {
        sku = yandexSkus.get(articul).toString();
      }
      const saved = await this.setYandexMarketSku(product, setting, sku);

      if (saved) {
        updated++;
      }
    }

    this.logger.log(`Updated ${updated} SKUs in products for ${setting.name}`);
  }

  private async productToUpdateSkus(
    setting: YandexMarketModel,
    articuls: string[],
  ) {
    return this.productModel
      .find(
        {
          $or: [
            {
              articul: { $in: articuls },
              isDeleted: false,
            },
            {
              marketplaceSettings: {
                $elemMatch: {
                  marketplaceId: setting._id,
                  identifier: { $exists: true },
                },
              },
            },
          ],
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
