import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { CompanyModel } from './company.model';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { CompanyDto } from './dto/company.dto';

@Injectable()
export class CompanyService {

  constructor(
    @InjectModel(CompanyModel)
    private readonly companyModel: ModelType<CompanyModel>) {
  }

  async get() {
    return this.companyModel.findOne({},
      CompanyService.defaultProjection()).exec();
  }

  async createOrUpdate(dto: CompanyDto) {
    return this.companyModel.findOneAndUpdate({},
      dto,
      {
        upsert: true,
        useFindAndModify: false,
        new: true,
        projection: CompanyService.defaultProjection(),
      }).exec();
  }

  private static defaultProjection() {
    return {
      __v: 0,
      updatedAt: 0,
      createdAt: 0,
    };
  }
}
