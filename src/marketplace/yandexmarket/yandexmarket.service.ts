import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { YandexMarketModel } from './yandexmarket.model';
import { YandexMarketDto } from './dto/yandexmarket.dto';

@Injectable()
export class YandexMarketService {

  constructor(
    @InjectModel(YandexMarketModel)
    private readonly yandexMarketModel: ModelType<YandexMarketModel>) {
  }

  async getById(id: string) {
    return this.yandexMarketModel.findById(id, {
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
    }).exec();
  }

  async get() {
    return this.yandexMarketModel.find().exec();
  }

  async create(dto: YandexMarketDto) {
    return this.yandexMarketModel.create(
      dto
    );
  }

  async update(id: string, dto: YandexMarketDto) {
    return this.yandexMarketModel.findByIdAndUpdate(id,
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
    return this.yandexMarketModel.findByIdAndDelete(id).exec();
  }
}
