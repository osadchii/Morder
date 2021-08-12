import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { CompanyModel } from '../../company/company.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryModel } from '../../category/category.model';
import { ProductModel } from '../../product/product.model';
import { SberMegaMarketModel } from './sbermegamarket.model';
import { Interval } from '@nestjs/schedule';
import { SberMegaMarketFeedBuilder } from './sbermegamarket.feed.builder';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { path } from 'app-root-path';
import { MarketplaceService } from '../marketplace.service';

@Injectable()
export class SberMegaMarketFeedService extends MarketplaceService {

  private readonly logger = new Logger(SberMegaMarketFeedService.name);

  constructor(
    @InjectModel(SberMegaMarketModel) private readonly sberMegaMarketModel: ModelType<SberMegaMarketModel>,
    @InjectModel(CompanyModel) protected readonly companyModel: ModelType<CompanyModel>,
    @InjectModel(CategoryModel) protected readonly categoryModel: ModelType<CategoryModel>,
    @InjectModel(ProductModel) protected readonly productModel: ModelType<ProductModel>,
    protected readonly configService: ConfigService) {
    super(companyModel, categoryModel, productModel, configService);
  }

  @Interval(10000)
  async generateSberMegaMarketFeeds() {

    const settings = await this.settingsToGenerate();

    for (const item of settings) {
      await this.generateFeed(item);
    }

  }

  private async generateFeed(marketModel: SberMegaMarketModel) {

    const { _id, name } = marketModel;

    this.logger.log(`Start of ${name} feed generation.`);
    this.logger.log(`Receiving ${name} data.`);

    const company = await this.companyInfo();
    const categories = await this.categoryInfo(marketModel);
    const products = await this.productInfo(marketModel);

    this.logger.log(`Building ${name} feed.`);

    const feedBuilder = new SberMegaMarketFeedBuilder(marketModel);

    feedBuilder.setCompany(company);
    categories.forEach((item) => feedBuilder.addCategory(item));
    products.forEach((item) => feedBuilder.addProduct(item));

    const feed = feedBuilder.build();

    this.logger.log(`Saving ${name} feed file.`);

    await this.saveXmlFile(feed, _id.toHexString());
    await this.setLastFeedGeneration(_id);

    this.logger.log(`End of ${name} feed generation.`);

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
