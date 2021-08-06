import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';
import { MarketplaceModel } from '../marketplace/marketplace.model';
import { ProductType } from '../product/product.model';

export interface SberMegaMarketModel extends Base {

}


export class SberMegaMarketModel extends TimeStamps implements MarketplaceModel {

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
  feedGenerationInterval: number;

  @prop()
  lastFeedGeneration?: Date;

  @prop()
  outletId: number;

  @prop()
  orderBefore: number;

  @prop()
  shippingDays: number;

  @prop({ _id: false, type: () => [String], enum: ProductType })
  productTypes: ProductType[];

}
