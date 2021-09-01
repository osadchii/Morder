import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';
import { MarketplaceModel } from '../marketplace.model';
import { ProductType } from '../../product/product.model';

export interface YandexMarketModel extends Base {}

export class YandexMarketModel extends TimeStamps implements MarketplaceModel {
  @prop()
  name: string;

  @prop()
  active: boolean;

  @prop()
  nullifyStocks: boolean;

  @prop()
  campaignId: string;

  @prop()
  authToken: string;

  @prop()
  clientId: string;

  @prop()
  specialPriceName?: string;

  @prop()
  updateMarketSkus: boolean;

  @prop()
  updateMarketSkusInterval: number;

  @prop()
  lastUpdateMarketSkus?: Date;

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

  @prop({ _id: false, type: () => [String], enum: ProductType })
  productTypes: ProductType[];
}
