import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { SberMegaMarketModel } from './sbermegamarket.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { SberMegaMarketDto } from './dto/sbermegamarket.dto';

@Injectable()
export class SberMegaMarketService {

  constructor(
    @InjectModel(SberMegaMarketModel)
    private readonly sberMegaMargetModel: ModelType<SberMegaMarketModel>) {
  }

  async getById(id: string) {
    return this.sberMegaMargetModel.findById(id, {
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
    }).exec();
  }

  async get() {
    return this.sberMegaMargetModel.find().exec();
  }

  async create(dto: SberMegaMarketDto) {
    return this.sberMegaMargetModel.create(
      dto
    );
  }

  async update(id: string, dto: SberMegaMarketDto) {
    return this.sberMegaMargetModel.findByIdAndUpdate(id,
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
    return this.sberMegaMargetModel.findByIdAndDelete(id).exec();
  }
}
