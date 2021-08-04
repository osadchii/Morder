import { prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export interface MesoModel extends Base {
}

export class MesoModel extends TimeStamps {

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
