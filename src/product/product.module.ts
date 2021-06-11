import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { ProductModel } from './product.model';

@Module({
  controllers: [ProductController],
  imports: [
    TypegooseModule.forFeature([
      { typegooseClass: ProductModel,
        schemaOptions: {
          collection: 'Product'
        }},
    ]),
  ],
  providers: [ProductService]
})
export class ProductModule {}
