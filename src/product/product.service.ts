import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { ProductModel } from './product.model';
import { ProductDto } from './dto/product.dto';
import { ServiceErrorHandler } from '../errorHandlers/service-error-handler';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductModel)
    private readonly productModel: ModelType<ProductModel>,
  ) {
  }

  async getById(id: string) {
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
    const { erpCode } = dto;
    const product = await this.productModel.findOne({
      erpCode,
    }, { _id: 1 });

    if (!product) {
      return this.productModel.create(dto)
        .catch((error) => ServiceErrorHandler.catchNotUniqueValueError(error));
    }

    return this.productModel.findByIdAndUpdate(product._id, dto, {
      new: true,
      useFindAndModify: false,
    }).exec()
      .catch((error) => ServiceErrorHandler.catchNotUniqueValueError(error));
  }

  async deleteById(id: string) {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  async updateStock(erpCode: string, stock: number) {
    return this.productModel.findOneAndUpdate({
        erpCode,
      },
      {
        stock,
      },
      {
        new: true,
        useFindAndModify: false,
      }).exec();
  }

  async getStocks(articuls?: string[]) {
    interface matchType {
      isDeleted: boolean;
      stock: { $exists: boolean },
      articul?: { $in: string[] }
    }

    let match: matchType = {
      isDeleted: false,
      stock: { $exists: true },
    };
    if (articuls) {
      match.articul = {
        $in: articuls.map((value) => {
          return value.trim();
        }),
      };
    }
    return this.productModel.aggregate()
      .match(match)
      .project({
        _id: 0,
        articul: 1,
        stock: 1,
      }).exec();
  }

}
