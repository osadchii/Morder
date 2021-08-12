import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { AliexpressModel } from './aliexpress.model';
import { AliexpressDto } from './dto/aliexpress.dto';

@Injectable()
export class AliexpressService {

  constructor(
    @InjectModel(AliexpressModel)
    private readonly marketplaceModel: ModelType<AliexpressModel>) {
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

  async create(dto: AliexpressDto) {
    return this.marketplaceModel.create(
      dto,
    );
  }

  async update(id: string, dto: AliexpressDto) {
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
