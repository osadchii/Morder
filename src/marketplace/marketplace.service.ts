import { path } from 'app-root-path';
import { ensureDir, writeFile } from 'fs-extra';
import { ConfigService } from '@nestjs/config';
import { CompanyModel } from '../company/company.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryModel } from '../category/category.model';
import { ProductModel } from '../product/product.model';
import { MarketplaceModel } from './marketplace.model';
import { MarketplaceCategoryModel } from './marketplace.category.model';
import { MarketplaceProductModel } from './marketplace.product.model';
import { ProductImageHelper } from '../product/product.image';

export abstract class MarketplaceService {

  protected constructor(
    protected readonly companyModel: ModelType<CompanyModel>,
    protected readonly categoryModel: ModelType<CategoryModel>,
    protected readonly productModel: ModelType<ProductModel>,
    protected readonly configService: ConfigService) {
  }

  protected async saveXmlFile(feed: object, fileName: string) {

    const feedPath = `${path}/${this.configService.get('FEEDS_PATH')}`;
    const feedFullName = `${feedPath}/${fileName}.xml`;

    await ensureDir(feedPath);

    const xmlBuilder = require('xmlbuilder');
    const xml = xmlBuilder.create(feed).end({ pretty: true });

    return writeFile(feedFullName, xml);

  }

  protected companyInfo(): Promise<CompanyModel> {
    return this.companyModel.findOne().exec();
  }

  protected categoryInfo({_id}: MarketplaceModel): Promise<MarketplaceCategoryModel[]> {
    return this.categoryModel
      .aggregate()
      .match({
        isDeleted: false,
      })
      .addFields({
        blocked: {
          $function: {
            body: MarketplaceService.BlockerCategoryFunctionText(),
            args: ['$marketplaceSettings', _id],
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

  protected productInfo({_id, specialPriceName, productTypes}: MarketplaceModel): Promise<MarketplaceProductModel[]> {

    return this.productModel
      .aggregate()
      .match({
        isDeleted: false,
        categoryCode: { $exists: true },
        productType: { $in: productTypes },
      })
      .addFields({
        concreteMarketplaceSettings: {
          $function: {
            body: MarketplaceService.MarketplaceSettingsFunctionText(),
            args: ['$marketplaceSettings', _id],
            lang: 'js',
          },
        },
        calculatedPrice: {
          $function: {
            body: MarketplaceService.CalculatedPriceFunctionText(),
            args: ['$specialPrices', specialPriceName, '$price'],
            lang: 'js',
          },
        },
        picture: {
          $function: {
            body: MarketplaceService.PictureFunctionText(),
            args: ['$image', ProductImageHelper.ImageBaseUrl(this.configService)],
            lang: 'js',
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
        productType: 1,
        brand: 1,
        countryOfOrigin: 1,
        weight: 1,
        height: 1,
        length: 1,
        width: 1,
        picture: 1,
        vendor: 1,
        vendorCode: 1,
        description: 1,
        concreteMarketplaceSettings: 1,
        characteristics: 1,
      }).exec();

  }

  private static PictureFunctionText(): string {
    return `function(image, imageBase) {
    if (!image) {
      return undefined;
    }
    return imageBase + image;
  }`;
  }

  private static BlockerCategoryFunctionText(): string {
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

  private static CalculatedPriceFunctionText(): string {
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

  private static MarketplaceSettingsFunctionText(): string {
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
