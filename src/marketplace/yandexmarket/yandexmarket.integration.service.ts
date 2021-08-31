import { Injectable, Logger } from '@nestjs/common';
import { MarketplaceService } from '../marketplace.service';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CompanyModel } from '../../company/company.model';
import { CategoryModel } from '../../category/category.model';
import { ProductModel } from '../../product/product.model';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { YandexMarketModel } from './yandexmarket.model';
import { Interval } from '@nestjs/schedule';
import { YandexMarketIntegration } from './yandexmarket.integration';

@Injectable()
export class YandexMarketIntegrationService extends MarketplaceService {
  private readonly logger = new Logger(YandexMarketIntegrationService.name);
  constructor(
    @InjectModel(YandexMarketModel)
    private readonly marketplaceModel: ModelType<YandexMarketModel>,
    @InjectModel(CompanyModel)
    protected readonly companyModel: ModelType<CompanyModel>,
    @InjectModel(CategoryModel)
    protected readonly categoryModel: ModelType<CategoryModel>,
    @InjectModel(ProductModel)
    protected readonly productModel: ModelType<ProductModel>,
    protected readonly configService: ConfigService,
    protected readonly httpService: HttpService,
  ) {
    super(companyModel, categoryModel, productModel, configService);
  }

  @Interval(10000)
  async updateYandexMarketSkus() {
    const settings = await this.activeSettings();

    this.logger.log(`Got ${settings.length} yandex.market active settings`);

    for (const item of settings) {
      this.logger.log(`Start ${item.name} yandex.market getting skus`);
      const service = new YandexMarketIntegration(item, this.httpService);
      const map = await service.getYandexMarketSkus();
      for (const item of map) {
        await this.setYandexMarketSku(item[0], item[1]);
      }
    }
  }

  private async setYandexMarketSku(articul: string, sku: number) {
    return this.productModel.findOneAndUpdate(
      {
        articul: articul,
      },
      {
        yandexMarketSku: sku,
      },
    );
  }

  private async activeSettings() {
    return this.marketplaceModel.find({ active: true }).exec();
  }
}
