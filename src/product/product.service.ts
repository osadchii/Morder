import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { ProductModel } from './product.model';
import { ProductDto } from './dto/product.dto';
import { SetStockDto } from './dto/set-stock.dto';
import { MarketplaceProductDto } from './dto/marketplace-product.dto';
import { SetPriceDto } from './dto/set-price.dto';
import { SetSpecialPriceDto } from './dto/set-special-price.dto';
import { MarketplaceModel } from '../marketplace/marketplace.model';
import { ConfigService } from '@nestjs/config';
import { FILE_IS_NOT_IMAGE, IMAGE_NOT_FOUND_ERROR, PRODUCT_NOT_FOUND_ERROR } from './product.constants';
import { createReadStream } from 'fs';
import { ProductImageHelper } from './product.image';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductModel)
    private readonly productModel: ModelType<ProductModel>,
    private readonly configService: ConfigService,
  ) {
  }

  // Base actions

  async getById(id: string) {
    return this.productModel.findById(id, {
      stock: 0,
      price: 0,
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
    }).exec();
  }

  async getByErpCode(erpCode: string) {
    return this.productModel
      .findOne({ erpCode }).exec();
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
      ProductService.catchNotUniqueValueError(error));
  }

  async deleteById(id: string) {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  // Stock actions

  async updateStock({ erpCode, stock }: SetStockDto) {
    return this.productModel
      .findOneAndUpdate({
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
        erpCode: 1,
        stock: 1,
      }).exec();
  }

  // Price actions

  async updateBasePrice({ erpCode, price }: SetPriceDto) {
    return this.productModel
      .findOneAndUpdate({
        erpCode,
      }, {
        price,
      }, {
        new: true,
        useFindAndModify: false,
        projection: {
          _id: 1,
          articul: 1,
          erpCode: 1,
          price: 1,
        },
      }).exec();
  }

  async updateSpecialPrice({ erpCode, priceName, price }: SetSpecialPriceDto) {
    const product = await this.productModel
      .findOne({ erpCode },
        {
          specialPrices: 1,
        });

    if (!product) {
      return product;
    }

    const dtoPriceName = priceName.trim().toLowerCase();

    let updated = false;
    for (let row of product.specialPrices) {
      //const priceName = row.priceName.trim().toLowerCase();
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
      .findOneAndUpdate({
        erpCode,
      }, {
        specialPrices: product.specialPrices,
      }, {
        new: true,
        useFindAndModify: false,
        projection: {
          _id: 1,
          articul: 1,
          erpCode: 1,
          specialPrices: 1,
        },
      }).exec();
  }

  // Images

  async uploadImage(erpCode: string, file: Express.Multer.File) {
    const { mimetype } = file;
    if (!ProductImageHelper.isImageMimeType(mimetype)) {
      throw new HttpException(FILE_IS_NOT_IMAGE, 400);
    }

    const productExists = await this.productModel
      .exists({
        erpCode
      });

    if (!productExists) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }

    const filePath = ProductImageHelper.imagePath(this.configService);
    await ProductImageHelper.saveFile(filePath, erpCode, file.buffer);

    return this.productModel
      .findOneAndUpdate({ erpCode },
        { image: erpCode }, {
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

    const product = await this.productModel
      .findOne({ erpCode },
        {
          image: 1,
        });

    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }

    if (!product.image) {
      throw new NotFoundException(IMAGE_NOT_FOUND_ERROR);
    }
    const imagePath = ProductImageHelper.imagePath(this.configService);
    const fullFileName = ProductImageHelper.fullFileName(imagePath, product.image);

    return createReadStream(fullFileName);
  }

  // Marketplace actions

  async getMarketplaceProducts({ _id, specialPriceName }: MarketplaceModel):
    Promise<MarketplaceProductDto[]> {
    return this.productModel.aggregate()
      .match({
        categoryCode: { $exists: true },
      })
      .addFields({
        nullifyStock: {
          $function: {
            body: `function(marketplaceSettings, marketplaceId) {
                    let nullify = false;
                    if (marketplaceSettings) {
                      marketplaceSettings.forEach((item) => {
                        if (item.marketplaceId == marketplaceId && item.nullifyStock) {
                          nullify = true;
                        }
                      });
                    }
                    return nullify;
                  }`,
            args: ['$marketplaceSettings', _id],
            lang: 'js',
          },
        },
        ignoreRestrictions: {
          $function: {
            body: `function(marketplaceSettings, marketplaceId) {
                    let ignore = false;
                    if (marketplaceSettings) {
                      marketplaceSettings.forEach((item) => {
                        if (item.marketplaceId == marketplaceId && item.ignoreRestrictions) {
                          ignore = true;
                        }
                      });
                    }
                    return ignore;
                  }`,
            args: ['$marketplaceSettings', _id],
            lang: 'js',
          },
        },
        calculatedPrice: {
          $function: {
            body: `function(specialPrices, basePrice, specialPriceName) {
                    let price = basePrice;
                    if (specialPrices) {
                      specialPrices.forEach((row) => {
                        if (row.priceName === specialPriceName)
                          price = row.price;
                      });
                    }
                    return price;
                  }`,
            args: ['$specialPrices', '$price', specialPriceName],
            lang: 'js',
          },
        },
      })
      .project({
        marketplaceSettings: 0,
        price: 0,
        specialPrices: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
        _id: 0
      }).exec();
  }

  // Error handlers

  static catchNotUniqueValueError(error) {
    if (error.code != 11000)
      throw error;

    let messages: string[] = [];

    for (let key in error.keyValue) {
      if (error.keyValue.hasOwnProperty(key)) {
        messages.push(`Value \'${error.keyValue[key]}\' is not unique for \'${key}\' field`);
      }
    }
    throw new HttpException(messages.join('\n'), 422);
  }

}
