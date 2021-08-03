export class YandexMarketFeedModel {
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
  categories: Categories;
  offers: Offers;

  constructor() {
    this.categories = new Categories();
    this.offers = new Offers();
  }
}

class Categories {
  category: Category[];

  constructor() {
    this.category = [];
  }
}

class Category {
  '@id': number;
  '@parentId'?: number;
  '#text': string;
}

class Offers {
  offer: Offer[];

  constructor() {
    this.offer = [];
  }
}

export class Offer {
  '@id': string;
  'shop-sku': string;
  name: string;
  price: number;
  count: number;
  country_of_origin: string;
  categoryId: number;
  vat: string;
  weight: number;
  currencyId: string;
  availability: Availability;
  barcode?: string;
  description?: string;
  manufacturer?: string;
  dimensions?: string;
  vendor?: string;
  vendorCode?: string;
  url?: string;
}

export enum Availability {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELISTED = 'DELISTED'
}
