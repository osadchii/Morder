import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { CategoryModel } from './category.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryDto } from './dto/category.dto';
import { GetByParentCategoryDto } from './dto/getbyparent.category.dto';

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

  async deleteById(id: string) {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }
}
