import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export enum MarketplaceType {
  SberMegaMarket = 'SberMegaMarket',
  YandexMarketFBS = 'YandexMarketFBS',
  Wildberries = 'Wildberries',
  Ozon = 'Ozon',
  Meso = 'Meso',
  Aliexpress = 'Aliexpress'
}

export interface MarketplaceModel extends Base {
}

export class MarketplaceModel extends TimeStamps {

  @prop({ required: true })
  name: string;

  @prop({ required: true, enum: MarketplaceType })
  type: MarketplaceType;

  @prop()
  active: boolean;

  @prop()
  nullifyStocks: boolean;

  @prop()
  sentStocksAndPricesAt?: Date;

  @prop()
  sendStocksAndPriceEveryMinutes: number;

  @prop()
  warehouseId: number;
}