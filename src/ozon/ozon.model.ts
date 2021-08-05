import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';
import { MarketplaceModel } from '../marketplace/marketplace.model';

export interface OzonModel extends Base {

}

export class OzonModel extends TimeStamps implements MarketplaceModel {

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

  @prop()
  warehouseName: string;

  @prop()
  updateStocksByAPI: boolean;

  @prop()
  updatePricesByAPI: boolean;

  @prop()
  feedGenerationInterval: number;

  @prop()
  lastFeedGeneration?: Date;

}
