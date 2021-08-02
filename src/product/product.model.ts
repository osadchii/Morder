import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

export enum Vat {
  VAT_20 = 'VAT_20',
  VAT_20_120 = 'VAT_20_120',
  VAT_10 = 'VAT_10',
  VAT_10_110 = 'VAT_10_110',
  VAT_0 = 'VAT_0',
  NO_VAT = 'NO_VAT'
}

class SpecialPrice {

  @prop({ lowercase: true, trim: true })
  priceName: string;

  @prop()
  price: number;
}

class ProductCharacteristic {

  @prop()
  name: string;

  @prop()
  value: string;

}

class ProductMarketplaceSettings {

  @prop()
  marketplaceId: Types.ObjectId;

  @prop()
  nullifyStock: boolean;

  @prop()
  ignoreRestrictions: boolean;

}

export interface ProductModel extends Base {
}

export class ProductModel extends TimeStamps {

  @prop()
  name: string;

  @prop({ unique: true })
  articul: string;

  @prop({ unique: true })
  erpCode: string;

  @prop()
  brand?: string;

  @prop()
  categoryCode?: string;

  @prop()
  isDeleted: boolean;

  @prop()
  countryOfOrigin?: string;

  @prop({ unique: true })
  barcode: string;

  @prop({ enum: Vat })
  vat: Vat;

  @prop()
  stock?: number;

  @prop()
  price?: number;

  @prop()
  weight?: number;

  @prop()
  height?: number;

  @prop()
  length?: number;

  @prop()
  width?: number;

  @prop()
  image?: string;

  @prop()
  vendor?: string;

  @prop()
  vendorCode?: string;

  @prop()
  description?: string;

  @prop({ type: () => [ProductCharacteristic], _id: false })
  characteristics?: ProductCharacteristic[];

  @prop({ type: () => [ProductMarketplaceSettings], _id: false })
  marketplaceSettings?: ProductMarketplaceSettings[];

  @prop({ type: () => [SpecialPrice], _id: false })
  specialPrices?: SpecialPrice[];

}
