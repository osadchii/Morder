import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface CompanyModel extends Base {
}

export class CompanyModel extends TimeStamps {

  @prop()
  shopName: string;

  @prop()
  companyName: string;

  @prop()
  url: string;

  @prop()
  inn: string;

  @prop()
  kpp: string;
}
