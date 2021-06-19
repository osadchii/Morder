import { Module } from '@nestjs/common';
import { CompanyModule } from '../company/company.module';
import { CategoryModule } from '../category/category.module';
import { ProductModule } from '../product/product.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';

@Module({
  imports: [CompanyModule,
    CategoryModule,
    ProductModule,
    MarketplaceModule],
})
export class TaskModule {
}
