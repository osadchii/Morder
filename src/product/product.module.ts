import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { ProductModel } from './product.model';
import { CategoryModule } from '../category/category.module';

@Module({
  controllers: [ProductController],
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: ProductModel,
        schemaOptions: {
          collection: 'Product',
        },
      },
    ]),
    CategoryModule,
  ],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {
}
