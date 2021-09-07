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
import { YandexMarketSendPriceQueueModel } from './yandexmarket.sendprice.queue.model';
import { YandexMarketSkuUpdater } from './integration-task/yandexmarket-sku-updater';
import { YandexMarketPriceUpdater } from './integration-task/yandexmarket-price-updater';
import { YandexMarketHiddenProductsUpdater } from './integration-task/yandexmarket-hidden-products-updater';

@Injectable()
export class YandexMarketIntegrationService extends MarketplaceService {
  private readonly logger = new Logger(YandexMarketIntegrationService.name);

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

  @Interval(30000)
  async updateHiddenProducts() {
    const updater = new YandexMarketHiddenProductsUpdater(
      this.marketplaceModel,
      this.categoryModel,
      this.productModel,
      this.httpService,
    );
    await updater.updateHiddenProducts();
    // const settings = await this.activeSettings();
    // const sendLimit = 5;
    //
    // for (const setting of settings) {
    //   this.logger.log(`Start updating hidden products for ${setting.name}`);
    //
    //   const products = await this.actualProductsHiddenFlag(setting);
    //   this.logger.log(
    //     `Got ${products.length} products to update hidden products for ${setting.name}`,
    //   );
    //   const service = new YandexMarketIntegration(setting, this.httpService);
    //
    //   const hiddenProducts = await service.getYandexMarketHiddenProducts();
    //
    //   this.logger.log(
    //     `Got ${hiddenProducts.length} hidden products of ${setting.name}`,
    //   );
    //
    //   const toHide = [];
    //   const toShow = [];
    //
    //   products.forEach(({ yandexMarketSku, articul, available }) => {
    //     const hidden = hiddenProducts.find((element) => element === articul);
    //     if (hidden && available) {
    //       toShow.push(yandexMarketSku);
    //     }
    //     if (!hidden && !available) {
    //       toHide.push(yandexMarketSku);
    //     }
    //   });
    //   this.logger.log(
    //     `Need to hide ${toHide.length} products for ${setting.name}`,
    //   );
    //   this.logger.log(
    //     `Need to show ${toShow.length} products for ${setting.name}`,
    //   );
    //
    //   if (toHide.length > 0) {
    //     await service.hideProducts(toHide.slice(0, sendLimit));
    //   }
    //
    //   if (toShow.length > 0) {
    //     await service.showProducts(toShow.slice(0, sendLimit));
    //   }
    // }
  }

  private async activeSettings() {
    return this.marketplaceModel
      .find({
        active: true,
      })
      .exec();
  }

  private async actualProductsHiddenFlag(
    settings: YandexMarketModel,
  ): Promise<
    { articul: string; yandexMarketSku: number; available: boolean }[]
  > {
    const result: {
      articul: string;
      yandexMarketSku: number;
      available: boolean;
    }[] = [];

    const categories = await this.categoryInfo(settings);
    const products = await this.productInfo(settings);

    this.logger.log(`Got ${products.length} products with yandex market sku`);

    const categoryInfo = new Map<string, boolean>();
    categories.forEach((item) => categoryInfo.set(item.erpCode, item.blocked));

    products.forEach((product) => {
      if (
        !product.concreteMarketplaceSettings ||
        !product.concreteMarketplaceSettings.identifier
      ) {
        return;
      }
      let available = true;
      const productInfo = {
        articul: product.articul,
        yandexMarketSku: Number.parseInt(
          product.concreteMarketplaceSettings.identifier,
        ),
      };

      if (!categoryInfo.has(product.categoryCode)) {
        result.push({
          ...productInfo,
          available: false,
        });
        return;
      }

      if (!product.calculatedPrice) {
        result.push({
          ...productInfo,
          available: false,
        });
        return;
      }

      const blocked = categoryInfo.get(product.categoryCode);
      const { minimalPrice, nullifyStocks } = settings;
      let ignoreRestrictions = false;
      let nullifyProductStocks = false;

      if (product.concreteMarketplaceSettings) {
        const marketplaceSettings = product.concreteMarketplaceSettings;
        ignoreRestrictions = marketplaceSettings.ignoreRestrictions;
        nullifyProductStocks = marketplaceSettings.nullifyStock;
      }

      if (blocked && !ignoreRestrictions) {
        available = false;
      }

      if (
        minimalPrice > 0 &&
        minimalPrice > product.calculatedPrice &&
        !ignoreRestrictions
      ) {
        available = false;
      }

      if (nullifyProductStocks || nullifyStocks) {
        product.stock = 0;
      }

      if (product.stock === 0) {
        available = false;
      }

      result.push({
        ...productInfo,
        available: available,
      });
    });

    return result;
  }
}
