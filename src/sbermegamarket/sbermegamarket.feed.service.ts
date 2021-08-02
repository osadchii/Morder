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
import { MarketplaceEntityModelExtension } from '../marketplace/marketplace.entitymodel.extension';
import { MarketplaceCategoryModel } from '../marketplace/marketplace.category.model';
import { MarketplaceProductModel } from '../marketplace/marketplace.product.model';

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

    const feed = feedBuilder.build();

    const xmlBuilder = require('xmlbuilder');
    const xml = xmlBuilder.create(feed).end({ pretty: true });
    console.log(xml);
    await this.setLastFeedGeneration(sberMegaMarketSettings._id);

  }

  private companyInfo(): Promise<CompanyModel> {
    return this.companyModel.findOne().exec();
  }

  private categoryInfo({ _id }: SberMegaMarketModel): Promise<MarketplaceCategoryModel[]> {
    const marketplaceExtension = new MarketplaceEntityModelExtension(
      this.categoryModel, this.productModel);
    return marketplaceExtension.getCategoryData(_id);
  }

  private productInfo({ _id, specialPriceName }: SberMegaMarketModel): Promise<MarketplaceProductModel[]> {
    const marketplaceExtension = new MarketplaceEntityModelExtension(
      this.categoryModel, this.productModel);
    return marketplaceExtension.getProductData(_id, specialPriceName);
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

}
