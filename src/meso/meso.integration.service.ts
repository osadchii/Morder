import { MarketplaceService } from '../marketplace/marketplace.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CompanyModel } from '../company/company.model';
import { CategoryModel } from '../category/category.model';
import { ProductModel } from '../product/product.model';
import { ConfigService } from '@nestjs/config';
import { MesoModel } from './meso.model';
import { Interval } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { MesoCatalogBuilder } from './meso.catalog.builder';
import { MesoIntegration } from './meso.integration';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MesoIntegrationService extends MarketplaceService {

  private readonly logger = new Logger(MesoIntegrationService.name);

  constructor(
    @InjectModel(MesoModel) private readonly marketplaceModel: ModelType<MesoModel>,
    @InjectModel(CompanyModel) protected readonly companyModel: ModelType<CompanyModel>,
    @InjectModel(CategoryModel) protected readonly categoryModel: ModelType<CategoryModel>,
    @InjectModel(ProductModel) protected readonly productModel: ModelType<ProductModel>,
    protected readonly configService: ConfigService,
    protected readonly httpService: HttpService) {
    super(companyModel, categoryModel, productModel, configService);
  }

  @Interval(10000)
  async generateSberMegaMarketFeeds() {

    const settings = await this.settingsToGenerate();

    for (const item of settings) {
      await this.generateFeed(item);
    }

  }

  private async generateFeed(marketModel: MesoModel) {

    const { _id, name } = marketModel;

    this.logger.log(`Start of ${name} catalog generation.`);
    this.logger.log(`Receiving ${name} data.`);

    const categories = await this.categoryInfo(marketModel);
    const products = await this.productInfo(marketModel);

    this.logger.log(`Building ${name} catalog.`);

    const catalogBuilder = new MesoCatalogBuilder(marketModel);

    categories.forEach((item) => catalogBuilder.addCategory(item));
    products.forEach((item) => catalogBuilder.addProduct(item));

    const catalog = catalogBuilder.build();

    this.logger.log(`Sending ${name} catalog.`);

    const integration = new MesoIntegration(marketModel, this.httpService);
    const result = await integration.sendCatalog(catalog);

    if (!result) {
      this.logger.error(`Catalog ${name} was not sent due to errors.`);
    }

    this.logger.log(`Saving ${name} catalog file.`);

    await this.saveJsonFile(catalog, _id.toHexString());

    if (result) {
      await this.setLastCatalogSent(_id);
    }

    this.logger.log(`End of ${name} catalog generation.`);

  }

  private async setLastCatalogSent(feedId: Types.ObjectId) {
    return this.marketplaceModel.findByIdAndUpdate(feedId, {
      lastCatalogSend: new Date(),
    }, {
      useFindAndModify: false,
    }).exec();
  }

  private async settingsToGenerate(): Promise<MesoModel[]> {

    const result: MesoModel[] = [];
    const settings = await this.marketplaceModel.find({
      active: true,
    }).exec();

    const currentDate = new Date();

    settings.forEach((item) => {
      if (item.lastCatalogSend) {
        const differenceTime = currentDate.getTime() - item.lastCatalogSend.getTime();
        const maximalDifferenceTime = item.catalogSendInterval * 1000 * 60;
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
