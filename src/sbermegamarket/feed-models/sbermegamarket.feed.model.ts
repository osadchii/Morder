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
  outlets: Outlet[];

  constructor(id: number, stock: number) {
    this.outlets = [
      new Outlet(id, stock),
    ];
  }
}

export class Offer {
  '@id': string;
  '@available': boolean;
  name: string;
  price: number;
  categoryId: number;
  barcode?: string;
  picture?: string;
  outlets: Outlets;
}

class Offers {
  offer: Offer[];

  constructor() {
    this.offer = [];
  }
}

class Shop {
  name: string;
  company: string;
  url: string;
  categories: Categories;
  offers: Offers;

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
