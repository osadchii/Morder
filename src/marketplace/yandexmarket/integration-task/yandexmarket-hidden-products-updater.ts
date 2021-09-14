import { Logger } from '@nestjs/common';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { YandexMarketModel } from '../yandexmarket.model';
import { ProductModel, ProductType } from '../../../product/product.model';
import { HttpService } from '@nestjs/axios';
import { CategoryModel } from '../../../category/category.model';
import { MarketplaceService } from '../../marketplace.service';
import { YandexMarketIntegration } from '../yandexmarket.integration';

export class YandexMarketHiddenProductsUpdater {
  private readonly logger = new Logger(YandexMarketHiddenProductsUpdater.name);

  constructor(
    private readonly marketplaceModel: ModelType<YandexMarketModel>,
    private readonly categoryModel: ModelType<CategoryModel>,
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

  private async updateHiddenProductsBySetting(setting: YandexMarketModel) {
    const productsAvailability = await this.productsAvailabilityBySetting(
      setting,
    );
    const availableCount = productsAvailability.filter(
      (item) => item.available,
    ).length;

    this.logger.log(
      `Received ${productsAvailability.length} products availability flag. Available for ${setting.name}: ${availableCount}`,
    );

    const integration = new YandexMarketIntegration(setting, this.httpService);
    let currentlyHidden = [];

    try {
      currentlyHidden = await integration.getYandexMarketHiddenProducts();
    } catch (error) {
      if (error.hasOwnProperty('response')) {
        const { response } = error;
        const { status, statusText, data } = response;
        this.logger.error(
          `Can't get hidden products from yandex.market.
        \nStatus: ${status}
        \nStatus text: ${statusText}
        \nData: ${JSON.stringify(data)}`,
        );
      } else {
        this.logger.error(
          `Can't get hidden products from yandex.market.
        \nError: ${error.toString()}`,
        );
      }
      return;
    }

    const toHide: number[] = [];
    const toShow: number[] = [];

    for (const productAvailability of productsAvailability) {
      const { articul, yandexMarketSku, available } = productAvailability;
      const hidden = currentlyHidden.find(
        (hiddenArticul) => hiddenArticul === articul,
      );

      if (hidden && available) {
        const alreadyInArray = toShow.find(
          (element) => element === yandexMarketSku,
        );
        if (alreadyInArray) {
          continue;
        }
        toShow.push(yandexMarketSku);
      }

      if (!hidden && !available) {
        const alreadyInArray = toHide.find(
          (element) => element === yandexMarketSku,
        );
        if (alreadyInArray) {
          continue;
        }
        toHide.push(yandexMarketSku);
      }
    }

    if (toShow.length > 0) {
      this.logger.log(
        `Need to show ${toShow.length} products for ${setting.name}`,
      );
      for (const yandexSku of toShow) {
        await integration.showProducts([yandexSku]).catch((error) => {
          const { response } = error;
          const { status, statusText } = response;
          this.logger.error(
            `Can't show yandex.market skus.\nStatus: ${status}\nStatus text: ${statusText}`,
          );
        });
      }
    }

    if (toHide.length > 0) {
      this.logger.log(
        `Need to hide ${toHide.length} products for ${setting.name}`,
      );
      for (const yandexSku of toHide) {
        await integration.hideProducts([yandexSku]).catch((error) => {
          const { response } = error;
          const { status, statusText, data } = response;

          if (data.errors && data.errors.length === 1) {
            const message = data.errors[0].message as string;
            if (
              message.indexOf('Unable to find mapping for marketSku') !== -1
            ) {
              this.logger.log(message);
              return;
            }
          }
          this.logger.error(
            `Can't hide yandex.market skus.\nStatus: ${status}\nStatus text: ${statusText}\nData: ${JSON.stringify(
              data,
            )}`,
          );
        });
      }
    }
  }

  private async productsAvailabilityBySetting(setting: YandexMarketModel) {
    const blockedCategoryCodes = await this.blockedCategoryCodesBySetting(
      setting,
    );

    type ProductProject = {
      articul: string;
      yandexMarketSku: string;
      calculatedPrice: number;
      ignoreRestrictions: boolean;
      nullifyStock: boolean;
      isDeleted: boolean;
      categoryCode: string;
      productType: ProductType;
    };

    type ResultItem = {
      yandexMarketSku: number;
      articul: string;
      available: boolean;
    };

    const products = (await this.productModel
      .aggregate()
      .match({
        marketplaceSettings: {
          $elemMatch: {
            marketplaceId: setting._id,
            identifier: { $exists: true },
          },
        },
      })
      .addFields({
        concreteMarketplaceSettings: {
          $function: {
            body: MarketplaceService.MarketplaceSettingsFunctionText(),
            args: ['$marketplaceSettings', setting._id],
            lang: 'js',
          },
        },
        calculatedPrice: {
          $function: {
            body: MarketplaceService.CalculatedPriceFunctionText(),
            args: ['$specialPrices', setting.specialPriceName, '$price'],
            lang: 'js',
          },
        },
      })
      .addFields({
        yandexMarketSku: '$concreteMarketplaceSettings.identifier',
        ignoreRestrictions: '$concreteMarketplaceSettings.ignoreRestrictions',
        nullifyStock: '$concreteMarketplaceSettings.nullifyStock',
      })
      .project({
        articul: 1,
        isDeleted: 1,
        yandexMarketSku: 1,
        calculatedPrice: 1,
        ignoreRestrictions: 1,
        nullifyStock: 1,
        categoryCode: 1,
        productType: 1,
      })
      .exec()) as ProductProject[];

    const result: ResultItem[] = [];

    products.forEach((item) => {
      const sku = Number.parseInt(item.yandexMarketSku);
      const resultItem: ResultItem = {
        yandexMarketSku: sku,
        articul: item.articul,
        available: true,
      };

      // If set nullify stocks products always not available
      if (setting.nullifyStocks) {
        result.push({
          ...resultItem,
          available: false,
        });
        return;
      }

      // Deleted products always not available
      if (item.isDeleted) {
        result.push({
          ...resultItem,
          available: false,
        });
        return;
      }

      // Product with wrong product type always not available
      const productType = setting.productTypes.find(
        (elem) => elem === item.productType,
      );

      if (!productType) {
        result.push({
          ...resultItem,
          available: false,
        });
        return;
      }

      // Products with ignore restrictions flag always available
      if (item.ignoreRestrictions) {
        result.push(resultItem);
        return;
      }

      // Product with low price or nullify stock flag always not available
      if (item.calculatedPrice < setting.minimalPrice || item.nullifyStock) {
        result.push({
          ...resultItem,
          available: false,
        });
        return;
      }

      // Products in blocked categories not available
      const blockedCategory = blockedCategoryCodes.find(
        (code) => code === item.categoryCode,
      );

      if (blockedCategory) {
        result.push({
          ...resultItem,
          available: false,
        });
        return;
      }

      result.push(resultItem);
    });

    return result;
  }

  private async blockedCategoryCodesBySetting(
    setting: YandexMarketModel,
  ): Promise<string[]> {
    const categories = await this.categoryModel
      .find(
        {
          $or: [
            {
              isDeleted: true,
            },
            {
              marketplaceSettings: {
                $elemMatch: {
                  marketplaceId: setting._id,
                  blocked: true,
                },
              },
            },
          ],
        },
        {
          erpCode: 1,
        },
      )
      .exec();

    return categories.map((item) => item.erpCode);
  }

  private async activeSettings() {
    return this.marketplaceModel
      .find({
        active: true,
      })
      .exec();
  }
}
