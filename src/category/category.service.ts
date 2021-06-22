import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { CategoryModel } from './category.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryDto } from './dto/category.dto';
import { ServiceErrorHandler } from '../errorHandlers/service-error-handler';
import { MarketplaceCategoryDto } from './dto/marketplace-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(CategoryModel)
    private readonly categoryModel: ModelType<CategoryModel>,
  ) {
  }

  async getAll() {
    return this.categoryModel.find({}).exec();
  }

  async getById(id: string) {
    return this.categoryModel.findById(id).exec();
  }

  async getByErpCode(erpCode: string) {
    return this.categoryModel.findOne({
      erpCode,
    }).exec();
  }

  async createOrUpdate(dto: CategoryDto) {
    const { erpCode } = dto;
    return this.categoryModel.findOneAndUpdate({ erpCode }, dto, {
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
    return this.categoryModel.findByIdAndDelete(id).exec()
      .catch((error) => ServiceErrorHandler.catchNotUniqueValueError(error));
  }

  async getMarketplaceCategories(marketplaceId: string): Promise<MarketplaceCategoryDto[]> {
    return this.categoryModel.aggregate()
      .sort({
        _parentCode: 1
      })
      .addFields({
        blocked: {
          $function: {
            body: `function (marketplaceSettings, marketplaceId) {
                    let blocked = false;
                    if (marketplaceSettings) {
                      marketplaceSettings.forEach((item) => {
                        if (item.marketplaceId == marketplaceId && item.blocked) {
                          blocked = true;
                        }
                      })
                    }
                    return blocked;
                  }`,
            args: ['$marketplaceSettings', marketplaceId],
            lang: 'js'
          }
        }
      })
      .project({
        marketplaceSettings: 0,
        createdAt: 0,
        updatedAt: 0,
        _id: 0,
        __v: 0
      })
      .exec();
  }
}
