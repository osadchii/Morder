import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { ProductModel } from './product.model';
import { ProductDto } from './dto/product.dto';
import { SetStockDto } from './dto/set-stock.dto';
import { SetPriceDto } from './dto/set-price.dto';
import { SetSpecialPriceDto } from './dto/set-special-price.dto';
import { ConfigService } from '@nestjs/config';
import {
  FILE_IS_NOT_IMAGE,
  PRODUCT_NOT_FOUND_ERROR,
} from './product.constants';
import { createReadStream } from 'fs';
import { ProductImageHelper } from './product.image';
import { GetProductsDto } from './dto/get-products.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductModel)
    private readonly productModel: ModelType<ProductModel>,
    private readonly configService: ConfigService,
  ) {}

  // Base actions

  async getById(id: string) {
    return this.productModel
      .findById(id, {
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      })
      .exec();
  }

  async getByErpCode(erpCode: string) {
    return this.productModel.findOne({ erpCode }).exec();
  }

  async getProductsWithOffsetLimit(dto: GetProductsDto) {
    const { limit, offset } = dto;

    interface FilterInterface {
      isDeleted: boolean;
      categoryCode?: string;
    }

    const filter: FilterInterface = {
      isDeleted: false,
    };

    if (typeof dto.categoryCode !== 'undefined') {
      filter.categoryCode = dto.categoryCode;
    }

    const products = await this.productModel
      .aggregate()
      .match(filter)
      .sort({ _id: 1 })
      .skip(offset)
      .limit(limit)
      .project({
        characteristics: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      })
      .exec();

    const total = await this.productModel.find(filter).countDocuments().exec();

    return {
      items: products,
      count: total,
    };
  }

  async createOrUpdate(dto: ProductDto) {
    const { erpCode } = dto;
    return this.productModel
      .findOneAndUpdate({ erpCode }, dto, {
        upsert: true,
        new: true,
        useFindAndModify: false,
        projection: {
          __v: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      })
      .catch((error) => ProductService.CatchNotUniqueValueError(error));
  }

  async deleteById(id: string) {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  // Stock actions

  async updateStock({ erpCode, stock }: SetStockDto) {
    return this.productModel
      .findOneAndUpdate(
        {
          erpCode,
        },
        {
          stock,
        },
        {
          new: true,
          useFindAndModify: false,
          projection: {
            _id: 1,
            articul: 1,
            erpCode: 1,
            stock: 1,
          },
        },
      )
      .exec();
  }

  async getStocks(articuls?: string[]) {
    interface matchType {
      isDeleted: boolean;
      stock: { $exists: boolean };
      articul?: { $in: string[] };
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
    return this.productModel
      .aggregate()
      .match(match)
      .sort({
        articul: 1,
      })
      .project({
        _id: 0,
        articul: 1,
        erpCode: 1,
        stock: 1,
      })
      .exec();
  }

  // Price actions

  async updateBasePrice({ erpCode, price }: SetPriceDto) {
    return this.productModel
      .findOneAndUpdate(
        {
          erpCode,
        },
        {
          price,
        },
        {
          new: true,
          useFindAndModify: false,
          projection: {
            _id: 1,
            articul: 1,
            erpCode: 1,
            price: 1,
          },
        },
      )
      .exec();
  }

  async updateSpecialPrice({ erpCode, priceName, price }: SetSpecialPriceDto) {
    const product = await this.productModel.findOne(
      { erpCode },
      {
        specialPrices: 1,
      },
    );

    if (!product) {
      return product;
    }

    const dtoPriceName = priceName.trim().toLowerCase();

    let updated = false;
    for (let row of product.specialPrices) {
      if (row.priceName === dtoPriceName) {
        row.price = price;
        updated = true;
        break;
      }
    }

    if (!updated) {
      product.specialPrices.push({
        priceName: dtoPriceName,
        price: price,
      });
    }

    return this.productModel
      .findOneAndUpdate(
        {
          erpCode,
        },
        {
          specialPrices: product.specialPrices,
        },
        {
          new: true,
          useFindAndModify: false,
          projection: {
            _id: 1,
            articul: 1,
            erpCode: 1,
            specialPrices: 1,
          },
        },
      )
      .exec();
  }

  // Images

  async uploadImage(erpCode: string, file: Express.Multer.File) {
    const { mimetype } = file;
    if (!ProductImageHelper.IsImageMimeType(mimetype)) {
      throw new HttpException(FILE_IS_NOT_IMAGE, 400);
    }

    const productExists = await this.productModel.exists({
      erpCode,
    });

    if (!productExists) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }

    const filePath = ProductImageHelper.ImagePath(this.configService);
    await ProductImageHelper.SaveFile(filePath, erpCode, file.buffer);

    return this.productModel.findOneAndUpdate(
      { erpCode },
      { image: erpCode },
      {
        new: true,
        useFindAndModify: false,
        projection: {
          erpCode: 1,
          image: 1,
        },
      },
    );
  }

  async getImage(erpCode: string) {
    const product = await this.productModel.findOne(
      { erpCode },
      {
        image: 1,
      },
    );

    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }

    let fullFileName = 'content/picture/no-image.png';
    if (product.image) {
      const imagePath = ProductImageHelper.ImagePath(this.configService);
      fullFileName = ProductImageHelper.FullFileName(imagePath, product.image);
    }

    return createReadStream(fullFileName);
  }

  // Error handlers

  static CatchNotUniqueValueError(error) {
    if (error.code != 11000) throw error;

    let messages: string[] = [];

    for (let key in error.keyValue) {
      if (error.keyValue.hasOwnProperty(key)) {
        messages.push(
          `Value \'${error.keyValue[key]}\' is not unique for \'${key}\' field`,
        );
      }
    }
    throw new HttpException(messages.join('\n'), 422);
  }
}
