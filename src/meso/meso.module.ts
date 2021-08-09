import { Module } from '@nestjs/common';
import { MesoService } from './meso.service';
import { MesoController } from './meso.controller';
import { TypegooseModule } from 'nestjs-typegoose';
import { MesoModel } from './meso.model';
import { HttpModule } from '@nestjs/axios';
import { getHttpConfig } from '../configs/http.config';
import { MesoIntegrationService } from './meso.integration.service';
import { CompanyModel } from '../company/company.model';
import { CategoryModel } from '../category/category.model';
import { ProductModel } from '../product/product.model';

@Module({
  providers: [MesoService, MesoIntegrationService],
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: MesoModel,
        schemaOptions: {
          collection: 'meso',
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
  controllers: [MesoController],
})
export class MesoModule {
}
