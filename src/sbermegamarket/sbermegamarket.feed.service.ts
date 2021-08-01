import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { CompanyModel } from '../company/company.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryModel } from '../category/category.model';
import { ProductModel } from '../product/product.model';
import { SberMegaMarketModel } from './sbermegamarket.model';
import { Interval } from '@nestjs/schedule';
import { SberMegaMarketFeedBuilder } from './sbermegamarket.feed.builder';
import { Types } from 'mongoose';
import { SberMegaMarketFeedCategoryModel } from './sbermegamarket.feed.category.model';
import { SberMegaMarketFeedProductModel } from './sbermegamarket.feed.product.model';

@Injectable()
export class SberMegaMarketFeedService {

  constructor(
    @InjectModel(SberMegaMarketModel) private readonly sberMegaMarketModel: ModelType<SberMegaMarketModel>,
    @InjectModel(CompanyModel) private readonly companyModel: ModelType<CompanyModel>,
    @InjectModel(CategoryModel) private readonly categoryModel: ModelType<CategoryModel>,
    @InjectModel(ProductModel) private readonly productModel: ModelType<ProductModel>) {
  }

  @Interval(10000)
  async generateSberMegaMarketFeeds() {

    const settings = await this.settingsToGenerate();

    for (const item of settings) {
      await this.generateFeed(item);
    }

  }

  private async generateFeed(sberMegaMarketSettings: SberMegaMarketModel) {

    const company = await this.companyInfo();
    const categories = await this.categoryInfo(sberMegaMarketSettings);
    const products = await this.productInfo(sberMegaMarketSettings);

    const feedBuilder = new SberMegaMarketFeedBuilder(sberMegaMarketSettings);

    feedBuilder.setCompany(company);
    categories.forEach((item) => feedBuilder.addCategory(item));
    products.forEach((item) => feedBuilder.addProduct(item));

    const xmlBuilder = require('xmlbuilder');
    const xml = xmlBuilder.create(feedBuilder.build()).end({ pretty: true });
    console.log(xml);
    await this.setLastFeedGeneration(sberMegaMarketSettings._id);

  }

  private companyInfo(): Promise<CompanyModel> {
    return this.companyModel.findOne().exec();
  }

  private categoryInfo({ _id }: SberMegaMarketModel): Promise<SberMegaMarketFeedCategoryModel[]> {
    return this.categoryModel
      .aggregate()
      .match({
        isDeleted: false,
      })
      .addFields({
        blocked: {
          $function: {
            body: SberMegaMarketFeedService.blockedCategoryFunctionText(),
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

  private productInfo({ _id, specialPriceName }: SberMegaMarketModel): Promise<SberMegaMarketFeedProductModel[]> {
    return this.productModel
      .aggregate()
      .match({
        isDeleted: false,
        categoryCode: { $exists: true },
      })
      .addFields({
        sberMegaMarketSettings: {
          $function: {
            body: SberMegaMarketFeedService.sberMegaMarketFunctionText(),
            args: ['$marketplaceSettings', _id],
            lang: 'js',
          },
        },
        calculatedPrice: {
          $function: {
            body: SberMegaMarketFeedService.calculatedPriceFunctionText(),
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
        brand: 1,
        countryOfOrigin: 1,
        weight: 1,
        height: 1,
        length: 1,
        width: 1,
        image: 1,
        description: 1,
        sberMegaMarketSettings: 1,
        characteristics: 1,
      }).exec();
  }

  private async setLastFeedGeneration(feedId: Types.ObjectId) {
    return this.sberMegaMarketModel.findByIdAndUpdate(feedId, {
      lastFeedGeneration: new Date(),
    }, {
      useFindAndModify: false,
    }).exec();
  }

  private async settingsToGenerate(): Promise<SberMegaMarketModel[]> {

    const result: SberMegaMarketModel[] = [];
    const settings = await this.sberMegaMarketModel.find({
      active: true,
    }).exec();

    const currentDate = new Date();

    settings.forEach((item) => {
      if (item.lastFeedGeneration) {
        const differenceTime = currentDate.getTime() - item.lastFeedGeneration.getTime();
        const maximalDifferenceTime = item.feedGenerationInterval * 1000 * 60;
        if (differenceTime > maximalDifferenceTime) {
          result.push(item);
        }
      } else {
        result.push(item);
      }
    });

    return result;

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
