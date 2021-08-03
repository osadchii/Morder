import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryModel } from '../category/category.model';
import { ProductModel } from '../product/product.model';
import { Interval } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { MarketplaceEntityModelExtension } from '../marketplace/marketplace.entitymodel.extension';
import { MarketplaceCategoryModel } from '../marketplace/marketplace.category.model';
import { MarketplaceProductModel } from '../marketplace/marketplace.product.model';
import { ConfigService } from '@nestjs/config';
import { path } from 'app-root-path';
import { ensureDir, writeFile } from 'fs-extra';
import { YandexMarketModel } from './yandexmarket.model';
import { YandexMarketFeedBuilder } from './yandexmarket.feed.builder';
import { YandexMarketFeedModel } from './feed-models/yandexmarket.feed.model';

@Injectable()
export class YandexMarketFeedService {

  private readonly logger = new Logger(YandexMarketFeedService.name);

  constructor(
    @InjectModel(YandexMarketModel) private readonly yandexMarketModel: ModelType<YandexMarketModel>,
    @InjectModel(CategoryModel) private readonly categoryModel: ModelType<CategoryModel>,
    @InjectModel(ProductModel) private readonly productModel: ModelType<ProductModel>,
    private readonly configService: ConfigService) {
  }

  @Interval(10000)
  async generateSberMegaMarketFeeds() {

    const settings = await this.settingsToGenerate();

    for (const item of settings) {
      await this.generateFeed(item);
    }

  }

  private async generateFeed(marketModel: YandexMarketModel) {

    this.logger.log(`Start of ${marketModel.name} feed generation.`);
    this.logger.log(`Receiving ${marketModel.name} data.`);

    const categories = await this.categoryInfo(marketModel);
    const products = await this.productInfo(marketModel);

    this.logger.log(`Building ${marketModel.name} feed.`);

    const feedBuilder = new YandexMarketFeedBuilder(marketModel);

    categories.forEach((item) => feedBuilder.addCategory(item));
    products.forEach((item) => feedBuilder.addProduct(item));

    const feed = feedBuilder.build();

    this.logger.log(`Saving ${marketModel.name} feed file.`);

    await this.saveFeedFile(feed, marketModel._id.toHexString());

    await this.setLastFeedGeneration(marketModel._id);

    this.logger.log(`End of ${marketModel.name} feed generation.`);

  }

  private categoryInfo({ _id }: YandexMarketModel): Promise<MarketplaceCategoryModel[]> {
    const marketplaceExtension = new MarketplaceEntityModelExtension(
      this.categoryModel, this.productModel, this.configService);
    return marketplaceExtension.getCategoryData(_id);
  }

  private productInfo({ _id, specialPriceName }: YandexMarketModel): Promise<MarketplaceProductModel[]> {
    const marketplaceExtension = new MarketplaceEntityModelExtension(
      this.categoryModel, this.productModel, this.configService);
    return marketplaceExtension.getProductData(_id, specialPriceName);
  }

  private async saveFeedFile(feed: YandexMarketFeedModel, feedName: string) {
    const feedPath = `${path}/${this.configService.get('FEEDS_PATH')}`;
    const feedFullName = `${feedPath}/${feedName}.xml`;

    await ensureDir(feedPath);

    const xmlBuilder = require('xmlbuilder');
    const xml = xmlBuilder.create(feed).end({ pretty: true });
    await writeFile(feedFullName, xml);
  }

  private async setLastFeedGeneration(feedId: Types.ObjectId) {
    return this.yandexMarketModel.findByIdAndUpdate(feedId, {
      lastFeedGeneration: new Date(),
    }, {
      useFindAndModify: false,
    }).exec();
  }

  private async settingsToGenerate(): Promise<YandexMarketModel[]> {

    const result: YandexMarketModel[] = [];
    const settings = await this.yandexMarketModel.find({
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
