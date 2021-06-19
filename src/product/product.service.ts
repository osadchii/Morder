import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { ProductModel } from './product.model';
import { ProductDto } from './dto/product.dto';
import { ServiceErrorHandler } from '../errorHandlers/service-error-handler';
import { SetStockDto } from './dto/set-stock.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductModel)
    private readonly productModel: ModelType<ProductModel>,
  ) {
  }

  async getById(id: string) {
    return this.productModel.findById(id, {
      stock: 0,
      price: 0,
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
    }).exec();
  }

  async getProductsWithOffsetLimit(offset: number, limit: number) {
    return this.productModel.aggregate()
      .sort({ _id: 1 })
      .limit(limit)
      .skip(offset)
      .project({
        stock: 0,
        price: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      })
      .exec();
  }

  async createOrUpdate(dto: ProductDto) {
    const { erpCode } = dto;
    return this.productModel.findOneAndUpdate({ erpCode }, dto, {
      upsert: true,
      new: true,
      useFindAndModify: false,
      projection: {
        __v: 0,
        updatedAt: 0,
        createdAt: 0,
      },
    }).catch((error) =>
      ServiceErrorHandler.catchNotUniqueValueError(error));
  }

  async deleteById(id: string) {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  async updateStock({ erpCode, stock }: SetStockDto) {
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
      .sort({
        articul: 1,
      })
      .project({
        _id: 0,
        articul: 1,
        stock: 1,
      }).exec();
  }

}
