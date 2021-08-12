import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { WildberriesModel } from './wildberries.model';
import { WildberriesDto } from './dto/wildberries.dto';

@Injectable()
export class WildberriesService {

  constructor(
    @InjectModel(WildberriesModel)
    private readonly marketplaceModel: ModelType<WildberriesModel>) {
  }

  async getById(id: string) {
    return this.marketplaceModel.findById(id, {
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
    }).exec();
  }

  async get() {
    return this.marketplaceModel.find().exec();
  }

  async create(dto: WildberriesDto) {
    return this.marketplaceModel.create(
      dto,
    );
  }

  async update(id: string, dto: WildberriesDto) {
    return this.marketplaceModel.findByIdAndUpdate(id,
      dto, {
        new: true,
        useFindAndModify: false,
        projection: {
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        },
      }).exec();
  }

  async deleteById(id: string) {
    return this.marketplaceModel.findByIdAndDelete(id).exec();
  }
}
