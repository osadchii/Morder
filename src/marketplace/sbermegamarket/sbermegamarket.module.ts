import { Module } from '@nestjs/common';
import { SberMegaMarketController } from './sbermegamarket.controller';
import { SberMegaMarketService } from './sbermegamarket.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { SberMegaMarketModel } from './sbermegamarket.model';
import { SberMegaMarketFeedService } from './sbermegamarket.feed.service';
import { CompanyModel } from '../../company/company.model';
import { CategoryModel } from '../../category/category.model';
import { ProductModel } from '../../product/product.model';

@Module({
  controllers: [SberMegaMarketController],
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: SberMegaMarketModel,
        schemaOptions: {
          collection: 'SberMegaMarket',
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
    ])
  ],
  providers: [
    SberMegaMarketService,
    SberMegaMarketFeedService,
  ],
})
export class SberMegaMarketModule {
}
