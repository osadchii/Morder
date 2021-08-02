import { Vat } from '../product/product.model';

export class MarketplaceProductCharacteristic {
  name: string;
  value: string;
}

class MarketplaceSettings {
  nullifyStock: boolean;
  ignoreRestrictions: boolean;
}

export class MarketplaceProductModel {
  articul: string;
  name: string;
  calculatedPrice: number;
  stock: number;
  categoryCode: string;
  barcode: string;
  vat: Vat;
  brand?: string;
  countryOfOrigin?: string;
  weight?: number;
  height?: number;
  length?: number;
  width?: number;
  image?: string;
  vendor?: string;
  vendorCode?: string;
  description?: string;
  concreteMarketplaceSettings?: MarketplaceSettings;
  characteristics?: MarketplaceProductCharacteristic[];
}
