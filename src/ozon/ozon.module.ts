import { Module } from '@nestjs/common';
import { OzonController } from './ozon.controller';
import { OzonService } from './ozon.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { OzonModel } from './ozon.model';
import { OzonFeedService } from './ozon.feed.service';
import { CategoryModel } from '../category/category.model';
import { ProductModel } from '../product/product.model';
import { CompanyModel } from '../company/company.model';

@Module({
  controllers: [OzonController],
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: OzonModel,
        schemaOptions: {
          collection: 'Ozon',
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
  ],
  providers: [OzonService, OzonFeedService],
})
export class OzonModule {
}
