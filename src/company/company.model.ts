import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface CompanyModel extends Base {
}

export class CompanyModel extends TimeStamps {

  @prop()
  name: string;

  @prop()
  url: string;

  @prop()
  inn: string;

  @prop()
  kpp: string;
}