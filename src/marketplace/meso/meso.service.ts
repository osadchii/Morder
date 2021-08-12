import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { MesoModel } from './meso.model';
import { MesoDto } from './dto/meso.dto';

@Injectable()
export class MesoService {

  constructor(
    @InjectModel(MesoModel)
    private readonly marketplaceModel: ModelType<MesoModel>) {
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

  async create(dto: MesoDto) {
    return this.marketplaceModel.create(
      dto,
    );
  }

  async update(id: string, dto: MesoDto) {
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
