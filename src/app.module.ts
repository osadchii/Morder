import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypegooseModule } from 'nestjs-typegoose';
import { getMongoConfig } from './configs/mongo.config';
import { CompanyModule } from './company/company.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SberMegaMarketModule } from './sbermegamarket/sbermegamarket.module';
import { YandexMarketModule } from './yandexmarket/yandexmarket.module';
import { OzonModule } from './ozon/ozon.module';
import { MesoModule } from './meso/meso.module';
import { WildberriesModule } from './wildberries/wildberries.module';
import { AliexpressModule } from './aliexpress/aliexpress.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypegooseModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: getMongoConfig,
    }),
    ScheduleModule.forRoot(),
    ProductModule,
    CategoryModule,
    CompanyModule,
    SberMegaMarketModule,
    YandexMarketModule,
    OzonModule,
    MesoModule,
    WildberriesModule,
    AliexpressModule,
    OrderModule,
  ],
})
export class AppModule {
}
