class MarketplaceProductCharacteristic {
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
  brand?: string;
  countryOfOrigin?: string;
  weight?: number;
  height?: number;
  length?: number;
  width?: number;
  image?: string;
  description?: string;
  concreteMarketplaceSettings?: MarketplaceSettings;
  characteristics?: MarketplaceProductCharacteristic[];
}
