import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypegooseModule } from 'nestjs-typegoose';
import { getMongoConfig } from './infrastructure/configs/mongo.config';
import { CompanyModule } from './company/company.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SberMegaMarketModule } from './marketplace/sbermegamarket/sbermegamarket.module';
import { YandexMarketModule } from './marketplace/yandexmarket/yandexmarket.module';
import { OzonModule } from './marketplace/ozon/ozon.module';
import { MesoModule } from './marketplace/meso/meso.module';
import { WildberriesModule } from './marketplace/wildberries/wildberries.module';
import { AliexpressModule } from './marketplace/aliexpress/aliexpress.module';
import { OrderModule } from './order/order.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'feeds'),
      serveRoot: '/static/feeds/',
    }),
  ],
})
export class AppModule {}
