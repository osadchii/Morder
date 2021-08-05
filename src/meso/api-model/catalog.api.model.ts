export class MesoProduct {
  Code: string;
  InternalCode: string;
  Price: number;
  ProductName: string;
  RemainsCount: number;
  NdsPercent: number;
}

export class MesoProducts {
  Products: MesoProduct[];
}
