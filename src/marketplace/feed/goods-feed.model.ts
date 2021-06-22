interface Category {
  '@id': number;
  '@parent'?: number;
  '#text': string;
}

interface Categories {
  category: Category[]
}

interface Shop {
  categories: Categories
}

interface YmlCatalog {
  '@date': string;
  shop: Shop;
}

export interface GoodsFeedModel {
  yml_catalog: YmlCatalog
}