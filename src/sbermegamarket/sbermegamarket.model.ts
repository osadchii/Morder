import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface SberMegaMarketModel extends Base {

}

export class SberMegaMarketModel extends TimeStamps {

  @prop()
  name: string;

  @prop()
  active: boolean;

  @prop()
  nullifyStocks: boolean;

  @prop()
  specialPriceName?: string;

  @prop()
  feedGenerationInterval: number;

  @prop()
  minimalPrice: number;

  @prop()
  outletId: number;

  @prop()
  lastFeedGeneration?: Date;

  @prop()
  orderBefore: number;

  @prop()
  shippingDays: number;

}
