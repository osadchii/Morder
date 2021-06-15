import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { CategoryModel } from './category.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CategoryDto } from './dto/category.dto';
import { ServiceErrorHandler } from '../errorHandlers/service-error-handler';

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
    if (dto.isDeleted === null) {
      dto.isDeleted = false;
    }
    const { erpCode } = dto;
    const id = await this.categoryModel.findOne({
      erpCode,
    }, { _id: 1 });

    if (!id) {
      return this.categoryModel.create(dto)
        .catch((error) => ServiceErrorHandler.catchNotUniqueValueError(error));
    }

    return this.categoryModel.findByIdAndUpdate(id, dto, {
      new: true,
      useFindAndModify: false,
    }).exec();
  }

  async deleteById(id: string) {
    return this.categoryModel.findByIdAndDelete(id).exec()
      .catch((error) => ServiceErrorHandler.catchNotUniqueValueError(error));
  }
}
