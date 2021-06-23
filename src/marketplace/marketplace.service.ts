import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { MarketplaceModel } from './marketplace.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { MarketplaceDto } from './dto/marketplace.dto';

@Injectable()
export class MarketplaceService {

  constructor(
    @InjectModel(MarketplaceModel)
    private readonly marketplaceModel: ModelType<MarketplaceModel>) {
  }

  async getAll() {
    return this
      .marketplaceModel.find({}).exec();
  }

  async getById(id: string) {
    return this
      .marketplaceModel.find({ id }).exec();
  }

  async create(dto: MarketplaceDto) {
    return this
      .marketplaceModel.create(dto);
  }

  async update(id: string, dto: MarketplaceDto) {
    return this.marketplaceModel
      .findByIdAndUpdate(id, dto, {
        new: true,
      }).exec();
  }

  async updateSentStocksAndPricesAt(id: string) {
    return this.marketplaceModel
      .findByIdAndUpdate(id, {
        sentStocksAndPricesAt: new Date
      }, {
        useFindAndModify: false
      }).exec();
  }

  async delete(id: string) {
    return this.marketplaceModel
      .findByIdAndDelete(id).exec();
  }
}
