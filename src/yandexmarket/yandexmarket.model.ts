import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface YandexMarketModel extends Base {
}

export class YandexMarketModel extends TimeStamps {

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
  lastFeedGeneration?: Date;

  @prop()
  defaultHeight?: number;

  @prop()
  defaultLength?: number;

  @prop()
  defaultWidth?: number;

  @prop()
  defaultWeight?: number;

  @prop()
  defaultVendorCode?: string;
}
