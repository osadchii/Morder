import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { CategoryModel } from './category.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryDto } from './dto/category.dto';
import { GetByParentCategoryDto } from './dto/getbyparent.category.dto';
import { SetMarketplaceBlockingCategoryDto } from './dto/setmarketplacesettings.category.dto';
import { Types } from 'mongoose';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(CategoryModel)
    private readonly categoryModel: ModelType<CategoryModel>,
  ) {}

  async getAll() {
    return this.categoryModel.find({}).exec();
  }

  async getById(id: string) {
    return this.categoryModel.findById(id).exec();
  }

  async getByParentCode({ parentCode }: GetByParentCategoryDto) {
    return this.categoryModel
      .find({
        parentCode: parentCode,
      })
      .exec();
  }

  async getByErpCode(erpCode: string) {
    return this.categoryModel
      .findOne({
        erpCode,
      })
      .exec();
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
    });
  }

  async setMarketplaceSettings(dto: SetMarketplaceBlockingCategoryDto) {
    if (dto.nested) {
      return this.setMarketplaceSettingsNested(dto);
    } else {
      return this.setMarketplaceSettingsDirectly(dto);
    }
  }

  private async setMarketplaceSettingsDirectly(
    dto: SetMarketplaceBlockingCategoryDto,
  ) {
    const category = await this.categoryModel.findOne({
      erpCode: dto.erpCode,
    });

    this.setMarketplaceBlockedValue(category, dto.marketplaceId, dto.blocked);

    await category.save();
  }

  private async setMarketplaceSettingsNested(
    dto: SetMarketplaceBlockingCategoryDto,
  ) {
    const dbEntry = await this.categoryModel
      .aggregate()
      .match({
        erpCode: dto.erpCode,
      })
      .graphLookup({
        from: 'Category',
        startWith: '$erpCode',
        connectFromField: 'erpCode',
        connectToField: 'parentCode',
        as: 'children',
      })
      .exec();

    const category = dbEntry[0] as CategoryModel & {
      children: CategoryModel[];
    };
    const categories: CategoryModel[] = [];

    categories.push(category);
    category.children.forEach((item) => {
      categories.push(item);
    });

    for (const item of categories) {
      this.setMarketplaceBlockedValue(item, dto.marketplaceId, dto.blocked);
      await this.categoryModel.findByIdAndUpdate(item._id, item).exec();
    }
  }

  private setMarketplaceBlockedValue(
    category: CategoryModel,
    marketplaceId: string,
    value: boolean,
  ) {
    let found = false;
    const marketplaceObjectId = new Types.ObjectId(marketplaceId);
    if (category.marketplaceSettings) {
      category.marketplaceSettings.forEach((item) => {
        if (item.marketplaceId.equals(marketplaceId)) {
          found = true;
          item.blocked = value;
        }
      });
    } else {
      category.marketplaceSettings = [];
    }
    if (found) {
      return;
    }
    category.marketplaceSettings.push({
      marketplaceId: marketplaceObjectId,
      blocked: value,
    });
  }

  async deleteById(id: string) {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }
}
