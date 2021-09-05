import { ProductType, Vat } from '../product/product.model';

export class MarketplaceProductCharacteristic {
  name: string;
  value: string;
}

class MarketplaceSettings {
  nullifyStock: boolean;
  ignoreRestrictions: boolean;
  identifier?: string;
}

export class MarketplaceProductModel {
  articul: string;
  name: string;
  calculatedPrice: number;
  stock: number;
  categoryCode: string;
  barcode: string;
  vat: Vat;
  productType: ProductType;
  brand?: string;
  countryOfOrigin?: string;
  weight?: number;
  height?: number;
  length?: number;
  width?: number;
  picture?: string;
  vendor?: string;
  vendorCode?: string;
  description?: string;
  concreteMarketplaceSettings?: MarketplaceSettings;
  characteristics?: MarketplaceProductCharacteristic[];
}
