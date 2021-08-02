class Category {
  '@id': number;
  '@parentId'?: number;
  '#text': string;
}

class Categories {
  category: Category[];

  constructor() {
    this.category = [];
  }
}

class Outlet {
  '@id': number;
  '@instock': number;

  constructor(id: number, stock: number) {
    this['@id'] = id;
    this['@instock'] = stock;
  }
}

export class Outlets {
  outlet: Outlet[];

  constructor(id: number, stock: number) {
    this.outlet = [
      new Outlet(id, stock),
    ];
  }
}

export class Param {
  '@name': string;
  '#text': string | number;

  constructor(name: string, value: string | number) {
    this['@name'] = name;
    this['#text'] = value;
  }
}

export class Offer {
  '@id': string;
  '@available': boolean;
  name: string;
  price: number;
  categoryId: number;
  barcode?: string;
  vat: number;
  description?: string;
  vendor?: string;
  vendorCode?: string;
  picture?: string;
  outlets: Outlets;
  param?: Param[];
}

class Offers {
  offer: Offer[];

  constructor() {
    this.offer = [];
  }
}

class ShipmentOption {
  '@days': number;
  '@order-before': number;

  constructor(days: number, orderBefore: number) {
    this['@days'] = days;
    this['@order-before'] = orderBefore;
  }
}

export class ShipmentOptions {
  option: ShipmentOption[];

  constructor(days: number, orderBefore: number) {
    this.option = [
      new ShipmentOption(days, orderBefore),
    ];
  }
}

class Shop {
  name: string;
  company: string;
  url: string;
  categories: Categories;
  offers: Offers;
  'shipment-options': ShipmentOptions;

  constructor() {
    this.categories = new Categories();
    this.offers = new Offers();
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

export class SberMegaMarketFeedModel {
  yml_catalog: YmlCatalog;

  constructor() {
    this.yml_catalog = new YmlCatalog();
  }
}
