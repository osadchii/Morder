interface Category {
  '@id': number;
  '@parent'?: number;
  '#text': string;
}

interface Categories {
  category: Category[]
}

interface Outlet {
  '@id': number;
  '@instock': number;
}

interface Outlets {
  outlet: Outlet[];
}

interface OfferParam {
  '@name': string;
  '#text': string;
}

export interface Offer {
  '@id': string;
  '@available': boolean;
  name: string;
  vendor?: string;
  categoryId: number;
  price: number;
  barcode: string;
  description?: string;
  outlets: Outlets;
  param: OfferParam[];
}

interface Offers {
  offer: Offer[];
}

interface Shop {
  name?: string;
  company?: string;
  url?: string;
  categories: Categories;
  offers: Offers;
}

interface YmlCatalog {
  '@date': string;
  shop: Shop;
}

export interface SberMegaMarketFeed {
  yml_catalog: YmlCatalog;
}