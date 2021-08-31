import { Module } from '@nestjs/common';
import { YandexMarketController } from './yandexmarket.controller';
import { YandexMarketService } from './yandexmarket.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { CompanyModel } from '../../company/company.model';
import { CategoryModel } from '../../category/category.model';
import { ProductModel } from '../../product/product.model';
import { YandexMarketModel } from './yandexmarket.model';
import { YandexMarketFeedService } from './yandexmarket.feed.service';
import { HttpModule } from '@nestjs/axios';
import { getHttpConfig } from '../../infrastructure/configs/http.config';

@Module({
  controllers: [YandexMarketController],
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: YandexMarketModel,
        schemaOptions: {
          collection: 'YandexMarket',
        },
      },
    ]),
    TypegooseModule.forFeature([
      {
        typegooseClass: CompanyModel,
        schemaOptions: {
          collection: 'Company',
        },
      },
    ]),
    TypegooseModule.forFeature([
      {
        typegooseClass: CategoryModel,
        schemaOptions: {
          collection: 'Category',
        },
      },
    ]),
    TypegooseModule.forFeature([
      {
        typegooseClass: ProductModel,
        schemaOptions: {
          collection: 'Product',
        },
      },
    ]),
    HttpModule.registerAsync({
      useFactory: getHttpConfig,
    }),
  ],
  providers: [YandexMarketService, YandexMarketFeedService],
})
export class YandexMarketModule {}
