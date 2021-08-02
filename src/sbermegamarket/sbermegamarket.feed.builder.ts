import { SberMegaMarketDto } from './dto/sbermegamarket.dto';
import { CompanyModel } from '../company/company.model';
import { Offer, Outlets, SberMegaMarketFeedModel } from './feed-models/sbermegamarket.feed.model';
import { format } from 'date-fns';
import { MarketplaceProductModel } from '../marketplace/marketplace.product.model';
import { MarketplaceCategoryModel } from '../marketplace/marketplace.category.model';

interface ShortCategoryInformation {
  id: number;
  blocked: boolean;
}

export class SberMegaMarketFeedBuilder {
  private company: CompanyModel;
  private categories: MarketplaceCategoryModel[] = [];
  private products: MarketplaceProductModel[] = [];
  private categoryNumberMap = new Map<string, ShortCategoryInformation>();
  private readonly feed: SberMegaMarketFeedModel = new SberMegaMarketFeedModel();

  constructor(private readonly settings: SberMegaMarketDto) {
    this.feed.yml_catalog['@date'] = format(new Date(), 'yyyy-MM-dd HH:mm');
  }

  setCompany(company: CompanyModel) {
    this.company = company;
  }

  addProduct(product: MarketplaceProductModel) {
    this.products.push(product);
  }

  addCategory(category: MarketplaceCategoryModel) {
    this.categories.push(category);

    const categoryNumber = this.categoryNumberMap.size + 1;
    this.categoryNumberMap.set(
      category.erpCode,
      {
        id: categoryNumber,
        blocked: category.blocked,
      },
    );
  }

  build(): SberMegaMarketFeedModel {

    this.completeCompanyInformation();
    this.completeCategoryInformation();
    this.completeProductInformation();

    return this.feed;
  }

  private completeCompanyInformation() {

    const { shop } = this.feed.yml_catalog;

    shop.company = this.company.companyName;
    shop.url = this.company.url;
    shop.name = this.company.shopName;

  }

  private completeCategoryInformation() {

    const { category } = this.feed.yml_catalog.shop.categories;

    this.categories.forEach((item) => {

      let parentNumber: number = undefined;

      if (!this.categoryNumberMap.has(item.erpCode)) {
        return;
      }

      const { id } = this.categoryNumberMap.get(item.erpCode);
      const categoryNumber = id;

      if (item.parentCode && this.categoryNumberMap.has(item.parentCode)) {
        const { id } = this.categoryNumberMap.get(item.parentCode);
        parentNumber = id;
      }

      category.push({
        '#text': item.name,
        '@id': categoryNumber,
        '@parentId': parentNumber,
      });

    });

  }

  private completeProductInformation() {
    this.products.forEach((item) =>
      this.addProductToFeed(item));
  }

  private addProductToFeed(product: MarketplaceProductModel) {

    const { offer } = this.feed.yml_catalog.shop.offers;

    if (!this.categoryNumberMap.has(product.categoryCode)) {
      return;
    }

    if (!product.calculatedPrice) {
      return;
    }

    let available = true;
    let ignoreRestrictions = false;
    const { minimalPrice, outletId } = this.settings;

    if (product.concreteMarketplaceSettings) {
      ignoreRestrictions = product.concreteMarketplaceSettings.ignoreRestrictions;
    }

    const { id, blocked } = this.categoryNumberMap.get(product.categoryCode);

    if (blocked && !ignoreRestrictions) {
      available = false;
    }

    if (minimalPrice > 0 && minimalPrice > product.calculatedPrice && !ignoreRestrictions) {
      available = false;
    }

    if (product.stock === 0) {
      available = false;
    }

    const stock = available ? product.stock : 0;

    const outlets = new Outlets(outletId, stock);

    const newOffer: Offer = {
      '@id': product.articul,
      '@available': available,
      name: product.name,
      categoryId: id,
      price: product.calculatedPrice,
      barcode: product.barcode,
      outlets: outlets,
    };

    offer.push(newOffer);

  }
}
