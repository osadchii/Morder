import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypegooseModule } from 'nestjs-typegoose';
import { getMongoConfig } from './configs/mongo.config';
import { CompanyModule } from './company/company.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskService } from './task/task.service';
import { TaskModule } from './task/task.module';
import { SberMegaMarketModule } from './sbermegamarket/sbermegamarket.module';
import { YandexMarketModule } from './yandexmarket/yandexmarket.module';
import { OzonModule } from './ozon/ozon.module';
import { MesoModule } from './meso/meso.module';
import { WildberriesModule } from './wildberries/wildberries.module';
import { AliexpressModule } from './aliexpress/aliexpress.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.dev.env'
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
    TaskModule,
    SberMegaMarketModule,
    YandexMarketModule,
    OzonModule,
    MesoModule,
    WildberriesModule,
    AliexpressModule,
  ],
  controllers: [AppController],
  providers: [AppService, TaskService],
})
export class AppModule {
}
