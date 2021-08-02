import { SberMegaMarketDto } from './dto/sbermegamarket.dto';
import { CompanyModel } from '../company/company.model';
import {
  Offer,
  Outlets,
  Param,
  SberMegaMarketFeedModel,
  ShipmentOptions,
} from './feed-models/sbermegamarket.feed.model';
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

    const { yml_catalog } = this.feed;
    const { shippingDays, orderBefore } = this.settings;

    yml_catalog['@date'] = format(new Date(), 'yyyy-MM-dd HH:mm');
    yml_catalog.shop['shipment-options'] = new ShipmentOptions(shippingDays, orderBefore);

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
      this.addProductToTheFeed(item));
  }

  private addProductToTheFeed(product: MarketplaceProductModel) {

    const { offer } = this.feed.yml_catalog.shop.offers;

    if (!this.categoryNumberMap.has(product.categoryCode)) {
      return;
    }

    if (!product.calculatedPrice) {
      return;
    }

    const { id, blocked } = this.categoryNumberMap.get(product.categoryCode);
    const { minimalPrice, outletId } = this.settings;

    let available = true;
    let ignoreRestrictions = false;
    let nullifyStocks = false;

    if (product.concreteMarketplaceSettings) {
      const marketplaceSettings = product.concreteMarketplaceSettings;
      ignoreRestrictions = marketplaceSettings.ignoreRestrictions;
      nullifyStocks = marketplaceSettings.nullifyStock;
    }

    if (blocked && !ignoreRestrictions) {
      available = false;
    }

    if (minimalPrice > 0
      && minimalPrice > product.calculatedPrice
      && !ignoreRestrictions) {
      available = false;
    }

    if (nullifyStocks) {
      product.stock = 0;
    }

    if (product.stock === 0) {
      available = false;
    }

    const stock = available ? product.stock : 0;

    const newOffer: Offer = {
      '@id': product.articul,
      '@available': available,
      name: product.name,
      categoryId: id,
      price: product.calculatedPrice,
      barcode: product.barcode,
      description: product.description,
      outlets: new Outlets(outletId, stock),
    };

    SberMegaMarketFeedBuilder.completeOfferProductParams(newOffer, product);

    offer.push(newOffer);

  }

  private static addParamToTheOffer(offer: Offer, name: string, value: string | number) {

    if (!value){
      return;
    }

    if (!offer.param) {
      offer.param = [];
    }

    const { param } = offer;
    param.push(new Param(name, value));
  }

  private static completeOfferProductParams(offer: Offer, product: MarketplaceProductModel) {

    SberMegaMarketFeedBuilder.addParamToTheOffer(offer, 'Бренд', product.brand);
    SberMegaMarketFeedBuilder.addParamToTheOffer(offer, 'СтранаИзготовитель', product.countryOfOrigin);
    SberMegaMarketFeedBuilder.addParamToTheOffer(offer, 'Weight', product.weight);
    SberMegaMarketFeedBuilder.addParamToTheOffer(offer, 'Height', product.height);
    SberMegaMarketFeedBuilder.addParamToTheOffer(offer, 'Length', product.length);
    SberMegaMarketFeedBuilder.addParamToTheOffer(offer, 'Width', product.width);

    if (product.characteristics) {
      product.characteristics.forEach((item) => {
        SberMegaMarketFeedBuilder.addParamToTheOffer(offer, item.name, item.value);
      });
    }

  }
}
