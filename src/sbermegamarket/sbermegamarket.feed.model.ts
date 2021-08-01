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

class Offer {
  '@id': string;
  '@available': boolean;
  name: string;
  price: number;
  categoryId: number;
  picture?: string;
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
