import { Module } from '@nestjs/common';
import { CompanyModule } from '../company/company.module';
import { CategoryModule } from '../category/category.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [CompanyModule,
    CategoryModule,
    ProductModule,
  ],
})
export class TaskModule {
}
