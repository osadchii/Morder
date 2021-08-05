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
import { OzonFeedModel } from './feed-model/ozon.feed.model';
import { OzonFeedBuilder } from './ozon.feed.builder';
import { OzonModel } from './ozon.model';

@Injectable()
export class OzonFeedService {

  private readonly logger = new Logger(OzonFeedService.name);

  constructor(
    @InjectModel(OzonModel) private readonly marketplaceModel: ModelType<OzonModel>,
    @InjectModel(CategoryModel) private readonly categoryModel: ModelType<CategoryModel>,
    @InjectModel(ProductModel) private readonly productModel: ModelType<ProductModel>,
    private readonly configService: ConfigService) {
  }

  @Interval(10000)
  async generateSberMegaMarketFeeds() {

    const settings = await this.settingsToGenerate();

    for (const item of settings) {
      if (!item.updatePricesByAPI || !item.updateStocksByAPI) {
        await this.generateFeed(item);
      }
    }

  }

  private async generateFeed(marketModel: OzonModel) {

    this.logger.log(`Start of ${marketModel.name} feed generation.`);
    this.logger.log(`Receiving ${marketModel.name} data.`);

    const categories = await this.categoryInfo(marketModel);
    const products = await this.productInfo(marketModel);

    this.logger.log(`Building ${marketModel.name} feed.`);

    const feedBuilder = new OzonFeedBuilder(marketModel);

    categories.forEach((item) => feedBuilder.addCategory(item));
    products.forEach((item) => feedBuilder.addProduct(item));

    const feed = feedBuilder.build();

    this.logger.log(`Saving ${marketModel.name} feed file.`);

    await this.saveFeedFile(feed, marketModel._id.toHexString());
    await this.setLastFeedGeneration(marketModel._id);

    this.logger.log(`End of ${marketModel.name} feed generation.`);

  }

  private categoryInfo(marketplace: OzonModel): Promise<MarketplaceCategoryModel[]> {
    const marketplaceExtension = new MarketplaceEntityModelExtension(
      this.categoryModel, this.productModel, this.configService);
    return marketplaceExtension.getCategoryData(marketplace);
  }

  private productInfo(marketplace: OzonModel): Promise<MarketplaceProductModel[]> {
    const marketplaceExtension = new MarketplaceEntityModelExtension(
      this.categoryModel, this.productModel, this.configService);
    return marketplaceExtension.getProductData(marketplace);
  }

  private async saveFeedFile(feed: OzonFeedModel, fileName: string) {
    const feedPath = `${path}/${this.configService.get('FEEDS_PATH')}`;
    const feedFullName = `${feedPath}/${fileName}.xml`;

    await ensureDir(feedPath);

    const xmlBuilder = require('xmlbuilder');
    const xml = xmlBuilder.create(feed).end({ pretty: true });
    return writeFile(feedFullName, xml);
  }

  private async setLastFeedGeneration(feedId: Types.ObjectId) {
    return this.marketplaceModel.findByIdAndUpdate(feedId, {
      lastFeedGeneration: new Date(),
    }, {
      useFindAndModify: false,
    }).exec();
  }

  private async settingsToGenerate(): Promise<OzonModel[]> {

    const result: OzonModel[] = [];
    const settings = await this.marketplaceModel.find({
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
