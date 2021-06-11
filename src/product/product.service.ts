import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { ProductModel } from './product.model';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductModel)
    private readonly productModel: ModelType<ProductModel>,
  ) {
  }

  async getById(id: string){
    return this.productModel.findById(id).exec();
  }

  async getProductsWithOffsetLimit(offset: number, limit: number) {
    return this.productModel.aggregate()
      .sort({ _id: 1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }

  async createOrUpdate(dto: ProductDto) {
    if (dto.isDeleted === null) {
      dto.isDeleted = false;
    }
    const { erpCode } = dto;
    const id = await this.productModel.findOne({
      erpCode,
    }, { _id: 1 });

    if (!id) {
      return this.productModel.create(dto);
    }

    return this.productModel.findByIdAndUpdate(id, dto, {
      new: true,
      useFindAndModify: false,
    }).exec();
  }
}
