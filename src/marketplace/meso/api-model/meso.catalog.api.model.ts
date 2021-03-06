export class MesoProduct {
  Code: string;
  InternalCode: string;
  Price: number;
  ProductName: string;
  RemainsCount: number;
  NdsPercent: number;
}

export class MesoCatalogApiModel {
  Products: MesoProduct[];
  constructor() {
    this.Products = [];
  }
}
