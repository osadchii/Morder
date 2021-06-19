import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export const enum MarketplaceType {
  SberMegaMarket = 'SberMegaMarket',
  Ozon = 'Ozon',
  YandexMarket = 'YandexMarket',
  Wildberries = 'Wildberries'
}

export interface MarketplaceModel extends Base {
}

export class MarketplaceModel extends TimeStamps {

  @prop()
  name: string;

  @prop()
  type: MarketplaceType;

  @prop()
  active: boolean;

  @prop()
  nullifyStocks: boolean;
}