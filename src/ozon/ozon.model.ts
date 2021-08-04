import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface OzonModel extends Base {

}

export class OzonModel extends TimeStamps {

  @prop()
  name: string;

  @prop()
  active: boolean;

  @prop()
  nullifyStocks: boolean;

  @prop()
  specialPriceName?: string;

  @prop()
  minimalPrice: number;

}
