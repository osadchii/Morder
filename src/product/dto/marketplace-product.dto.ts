interface MarketplaceProductCharacteristic {
  key: string;
  value: string;
}

export interface MarketplaceProductDto {

  erpCode: string;

  name: string;

  articul: string;

  brand?: string;

  categoryCode?: string;

  nullifyStock: boolean;

  ignoreRestrictions: boolean;

  countryOfOrigin: string;

  isDeleted: boolean;

  barcode: string;

  stock?: number;

  calculatedPrice: number;

  image?: string;

  weight?: number;

  height?: number;

  length?: number;

  width?: number;

  description?: string;

  characteristics?: MarketplaceProductCharacteristic[];
}