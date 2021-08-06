import { Types } from 'mongoose';
import { ProductType } from '../product/product.model';

export interface MarketplaceModel {
  _id: Types.ObjectId;
  name: string;
  active: boolean;
  nullifyStocks: boolean;
  specialPriceName?: string;
  minimalPrice: number;
  productTypes: ProductType[];
}
