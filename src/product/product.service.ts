import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import { SetMarketplaceSettingsProductDto } from './dto/setmarketplacesettings.product.dto';
import { Types } from 'mongoose';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

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
      $or?: [
        { articul: RegExp },
        { name: RegExp },
        { brand: RegExp },
        { barcode: RegExp },
      ];
    }

    const filter: FilterInterface = {
      isDeleted: false,
    };

    if (typeof dto.categoryCode !== 'undefined') {
      filter.categoryCode = dto.categoryCode;
    }

    if (typeof dto.text !== 'undefined') {
      const regExp = new RegExp(dto.text, 'gi');
      filter.$or = [
        { articul: regExp },
        { name: regExp },
        { brand: regExp },
        { barcode: regExp },
      ];
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
    const { erpCode, articul, name } = dto;
    this.logger.log(
      `Updated product (${articul}) ${name} with code: ${erpCode}`,
    );
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
    this.logger.log(`Deleted product with id: ${id}`);
    return this.productModel.findByIdAndDelete(id).exec();
  }

  // Stock actions

  async updateStock({ erpCode, stock }: SetStockDto) {
    this.logger.log(`Updated ${erpCode} stock to ${stock}`);
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
    this.logger.log(`Updated ${erpCode} base price to ${price}`);
    return this.productModel
      .findOneAndUpdate(
        {
          erpCode,
        },
        {
          price,
          priceUpdatedAt: new Date(),
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
          priceUpdatedAt: new Date(),
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

  async getSpecialPriceNames(): Promise<string> {
    const priceNames = await this.productModel
      .aggregate()
      .match({
        specialPrices: { $exists: true },
      })
      .unwind('$specialPrices')
      .addFields({
        priceName: '$specialPrices.priceName',
      })
      .project({
        priceName: 1,
      })
      .group({
        _id: null,
        priceNames: { $addToSet: '$priceName' },
      })
      .exec();

    return priceNames.priceNames;
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

  // Marketplace settings

  async setMarketplaceSettings(dto: SetMarketplaceSettingsProductDto) {
    const product = await this.productModel
      .findOne({
        erpCode: dto.erpCode,
      })
      .exec();

    let updated = false;

    if (!product.marketplaceSettings) {
      product.marketplaceSettings = [];
    }

    for (const setting of product.marketplaceSettings) {
      if (setting.marketplaceId.equals(dto.marketplaceId)) {
        setting.nullifyStock = dto.nullifyStock ?? setting.nullifyStock;
        setting.ignoreRestrictions =
          dto.ignoreRestrictions ?? setting.ignoreRestrictions;
        updated = true;
      }
    }

    if (!updated) {
      product.marketplaceSettings.push({
        marketplaceId: new Types.ObjectId(dto.marketplaceId),
        nullifyStock: dto.nullifyStock ?? false,
        ignoreRestrictions: dto.ignoreRestrictions ?? false,
      });
    }

    await product.save();
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
