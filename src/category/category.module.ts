import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { TypegooseModule } from 'nestjs-typegoose';
import { CategoryModel } from './category.model';
import { CategoryService } from './category.service';

@Module({
  controllers: [CategoryController],
  imports: [
    TypegooseModule.forFeature([
      { typegooseClass: CategoryModel,
      schemaOptions: {
        collection: 'Category'
      }},
    ]),
  ],
  providers: [CategoryService],
  exports: [CategoryService]
})
export class CategoryModule {
}
