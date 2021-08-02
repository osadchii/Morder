import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryModel } from '../category/category.model';
import { ProductModel } from '../product/product.model';
import { MarketplaceCategoryModel } from './marketplace.category.model';
import { MarketplaceProductModel } from './marketplace.product.model';
import { Types } from 'mongoose';

export class MarketplaceEntityModelExtension {

  constructor(
    private readonly categoryModel: ModelType<CategoryModel>,
    private readonly productModel: ModelType<ProductModel>) {
  }

  getCategoryData(marketplaceId: Types.ObjectId): Promise<MarketplaceCategoryModel[]> {
    return this.categoryModel
      .aggregate()
      .match({
        isDeleted: false,
      })
      .addFields({
        blocked: {
          $function: {
            body: MarketplaceEntityModelExtension.blockedCategoryFunctionText(),
            args: ['$marketplaceSettings', marketplaceId],
            lang: 'js',
          },
        },
      })
      .project({
        name: 1,
        erpCode: 1,
        parentCode: 1,
        blocked: 1,
      }).exec();
  }

  getProductData(marketplaceId: Types.ObjectId, specialPriceName: string): Promise<MarketplaceProductModel[]> {
    return this.productModel
      .aggregate()
      .match({
        isDeleted: false,
        categoryCode: { $exists: true },
      })
      .addFields({
        concreteMarketplaceSettings: {
          $function: {
            body: MarketplaceEntityModelExtension.sberMegaMarketFunctionText(),
            args: ['$marketplaceSettings', marketplaceId],
            lang: 'js',
          },
        },
        calculatedPrice: {
          $function: {
            body: MarketplaceEntityModelExtension.calculatedPriceFunctionText(),
            args: ['$specialPrices', specialPriceName, '$price'],
            lang: 'js'
          },
        },
      })
      .project({
        articul: 1,
        name: 1,
        calculatedPrice: 1,
        stock: 1,
        categoryCode: 1,
        barcode: 1,
        vat: 1,
        brand: 1,
        countryOfOrigin: 1,
        weight: 1,
        height: 1,
        length: 1,
        width: 1,
        image: 1,
        vendor: 1,
        vendorCode: 1,
        description: 1,
        concreteMarketplaceSettings: 1,
        characteristics: 1,
      }).exec();
  }

  private static blockedCategoryFunctionText(): string {
    return `function(marketplaceSettings, settingsId) {
    if (!marketplaceSettings) {
      return false;
    }
    for (const settings of marketplaceSettings) {
      if (settings.marketplaceId == settingsId
        && settings.blocked) {
        return true;
      }
    }
    return false;
  }`;
  }

  private static calculatedPriceFunctionText(): string {
    return `function(specialPrices, specialPriceName, defaultPrice) {
    let price = defaultPrice;
    if (specialPrices) {
      for (const specialPrice of specialPrices) {
        if (specialPrice.priceName == specialPriceName) {
          price = specialPrice.price;
          break;
        }
      }
    }
    return price;
  }`;
  }

  private static sberMegaMarketFunctionText(): string {
    return `function(marketplaceSettings, settingsId) {
    if (marketplaceSettings) {
      for (const settings of marketplaceSettings) {
        if (settings.marketplaceId == settingsId) {
          return {
            nullifyStock: settings.nullifyStock,
            ignoreRestrictions: settings.ignoreRestrictions,
          };
        }
      }
    }
    return undefined;
  }`;
  }

}
