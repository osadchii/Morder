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
import { Types } from 'mongoose';

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

  @Interval(60000)
  async updateYandexMarketSkus() {
    const settings = await this.settingsToUpdateMarketSkus();

    this.logger.log(
      `Got ${settings.length} yandex.market settings to update market skus`,
    );

    for (const item of settings) {
      this.logger.log(`Start ${item.name} yandex.market getting skus`);

      const service = new YandexMarketIntegration(item, this.httpService);
      const map = await service.getYandexMarketSkus();

      this.logger.log(`Got ${map.size} yandex.market total skus`);
      for (const item of map) {
        await this.setYandexMarketSku(item[0], item[1]);
      }

      await this.setLastUpdateMarketSkus(item._id);
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
      {
        useFindAndModify: false,
      },
    );
  }

  private async setLastUpdateMarketSkus(feedId: Types.ObjectId) {
    return this.marketplaceModel
      .findByIdAndUpdate(
        feedId,
        {
          lastUpdateMarketSkus: new Date(),
        },
        {
          useFindAndModify: false,
        },
      )
      .exec();
  }

  private async settingsToUpdateMarketSkus() {
    const settings = await this.marketplaceModel.find({
      active: true,
      updateMarketSkus: true,
    });

    const currentDate = new Date();

    return settings.filter((item) => {
      if (item.lastUpdateMarketSkus) {
        const differenceTime =
          currentDate.getTime() - item.lastUpdateMarketSkus.getTime();
        const maximalDifferenceTime = item.updateMarketSkusInterval * 1000 * 60;
        return differenceTime > maximalDifferenceTime;
      } else {
        return true;
      }
    });
  }
}
