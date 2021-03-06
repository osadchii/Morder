import { prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { MarketplaceModel } from '../marketplace.model';
import { ProductType } from '../../product/product.model';

export interface MesoModel extends Base {
}

export class MesoModel extends TimeStamps implements MarketplaceModel {

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
  login: string;

  @prop()
  password: string;

  @prop({ _id: false, type: () => [String], enum: ProductType })
  productTypes: ProductType[];

  @prop()
  catalogSendInterval: number;

  @prop()
  lastCatalogSend?: Date;
}
