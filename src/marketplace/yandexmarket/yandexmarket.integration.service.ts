import { Injectable } from '@nestjs/common';
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
import { YandexMarketSendPriceQueueModel } from './yandexmarket.sendprice.queue.model';
import { YandexMarketSkuUpdater } from './integration-task/yandexmarket-sku-updater';
import { YandexMarketPriceUpdater } from './integration-task/yandexmarket-price-updater';
import { YandexMarketHiddenProductsUpdater } from './integration-task/yandexmarket-hidden-products-updater';

@Injectable()
export class YandexMarketIntegrationService extends MarketplaceService {
  constructor(
    @InjectModel(YandexMarketModel)
    private readonly marketplaceModel: ModelType<YandexMarketModel>,
    @InjectModel(YandexMarketSendPriceQueueModel)
    private readonly sendPriceQueue: ModelType<YandexMarketSendPriceQueueModel>,
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

  @Interval(60000)
  async updateYandexMarketSkus() {
    const updater = new YandexMarketSkuUpdater(
      this.marketplaceModel,
      this.productModel,
      this.httpService,
    );
    await updater.updateYandexMarketSkus();
  }

  @Interval(60000)
  async updateYandexPricesQueue() {
    const updater = new YandexMarketPriceUpdater(
      this.marketplaceModel,
      this.productModel,
      this.sendPriceQueue,
      this.httpService,
    );
    await updater.updatePriceQueues();
  }

  @Interval(90000)
  async sendPricesToYandexMarket() {
    const updater = new YandexMarketPriceUpdater(
      this.marketplaceModel,
      this.productModel,
      this.sendPriceQueue,
      this.httpService,
    );
    await updater.sendQueuedPrices();
  }

  @Interval(60000)
  async updateHiddenProducts() {
    const updater = new YandexMarketHiddenProductsUpdater(
      this.marketplaceModel,
      this.categoryModel,
      this.productModel,
      this.httpService,
    );
    await updater.updateHiddenProducts();
  }
}
