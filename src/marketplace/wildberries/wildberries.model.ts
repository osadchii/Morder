import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';
import { MarketplaceModel } from '../marketplace.model';
import { ProductType } from '../../product/product.model';

export interface WildberriesModel extends Base {

}

export class WildberriesModel extends TimeStamps implements MarketplaceModel {
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

  @prop({ _id: false, type: () => [String], enum: ProductType })
  productTypes: ProductType[];
}
