import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { OzonModel } from './ozon.model';
import { OzonDto } from './dto/ozon.dto';

@Injectable()
export class OzonService {

  constructor(
    @InjectModel(OzonModel)
    private readonly marketplaceModel: ModelType<OzonModel>) {
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

  async create(dto: OzonDto) {
    return this.marketplaceModel.create(
      dto,
    );
  }

  async update(id: string, dto: OzonDto) {
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
