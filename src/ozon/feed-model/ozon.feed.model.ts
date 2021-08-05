export class OzonFeedModel {
  yml_catalog: YmlCatalog;

  constructor() {
    this.yml_catalog = new YmlCatalog();
  }
}

class YmlCatalog {
  shop: Shop;
  '@date': string;

  constructor() {
    this.shop = new Shop();
    this['@date'] = '';
  }
}

class Shop {
  offers: Offers;

  constructor() {
    this.offers = new Offers();
  }
}

class Offers {
  offer: Offer[];

  constructor() {
    this.offer = [];
  }
}

export class Offer {
  '@id': string;
  price: number;
  outlets: Outlets;
}

export class Outlets {
  outlet: Outlet[];

  constructor(warehouseName: string, inStock: number) {
    this.outlet = [
      new Outlet(warehouseName, inStock),
    ];
  }
}

class Outlet {
  '@instock': number;
  '@warehouse_name': string;

  constructor(warehouseName: string, inStock: number) {
    this['@instock'] = inStock;
    this['@warehouse_name'] = warehouseName;
  }
}

