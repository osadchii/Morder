class SberMegaMarketFeedProductCharacteristic {
  name: string;
  value: string;
}

class SberMegaMarketSettings {
  nullifyStock: boolean;
  ignoreRestrictions: boolean;
}

export class SberMegaMarketFeedProductModel {
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
  sberMegaMarketSettings?: SberMegaMarketSettings;
  characteristics?: SberMegaMarketFeedProductCharacteristic[];
}
