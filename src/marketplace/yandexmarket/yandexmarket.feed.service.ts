import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryModel } from '../../category/category.model';
import { ProductModel } from '../../product/product.model';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { path } from 'app-root-path';
import { YandexMarketModel } from './yandexmarket.model';
import { YandexMarketFeedBuilder } from './yandexmarket.feed.builder';
import { MarketplaceService } from '../marketplace.service';
import { CompanyModel } from '../../company/company.model';

@Injectable()
export class YandexMarketFeedService extends MarketplaceService {
  private readonly logger = new Logger(YandexMarketFeedService.name);

  constructor(
    @InjectModel(YandexMarketModel)
    private readonly yandexMarketModel: ModelType<YandexMarketModel>,
    @InjectModel(CompanyModel)
    protected readonly companyModel: ModelType<CompanyModel>,
    @InjectModel(CategoryModel)
    protected readonly categoryModel: ModelType<CategoryModel>,
    @InjectModel(ProductModel)
    protected readonly productModel: ModelType<ProductModel>,
    protected readonly configService: ConfigService,
  ) {
    super(companyModel, categoryModel, productModel, configService);
  }

  async generateYandexMarketFeeds() {
    const settings = await this.settingsToGenerate();

    for (const item of settings) {
      await this.generateFeed(item);
    }
  }

  private async generateFeed(marketModel: YandexMarketModel) {
    const { _id, name } = marketModel;

    this.logger.log(`Start of ${name} feed generation.`);
    this.logger.log(`Receiving ${name} data.`);

    const categories = await this.categoryInfo(marketModel);
    const products = await this.productInfo(marketModel);

    this.logger.log(`Building ${name} feed.`);

    const feedBuilder = new YandexMarketFeedBuilder(marketModel);

    categories.forEach((item) => feedBuilder.addCategory(item));
    products.forEach((item) => feedBuilder.addProduct(item));

    const feed = feedBuilder.build();

    this.logger.log(`Saving ${name} feed file.`);

    await this.saveXmlFile(feed, _id.toHexString());

    await this.setLastFeedGeneration(_id);

    this.logger.log(`End of ${name} feed generation.`);
  }

  private async setLastFeedGeneration(feedId: Types.ObjectId) {
    return this.yandexMarketModel
      .findByIdAndUpdate(
        feedId,
        {
          lastFeedGeneration: new Date(),
        },
        {
          useFindAndModify: false,
        },
      )
      .exec();
  }

  private async settingsToGenerate(): Promise<YandexMarketModel[]> {
    const result: YandexMarketModel[] = [];
    const settings = await this.yandexMarketModel
      .find({
        active: true,
      })
      .exec();

    const currentDate = new Date();

    settings.forEach((item) => {
      if (item.lastFeedGeneration) {
        const differenceTime =
          currentDate.getTime() - item.lastFeedGeneration.getTime();
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
