import { YandexMarketDto } from './dto/yandexmarket.dto';
import { format } from 'date-fns';
import { MarketplaceProductModel } from '../marketplace/marketplace.product.model';
import { MarketplaceCategoryModel } from '../marketplace/marketplace.category.model';
import { Availability, Offer, YandexMarketFeedModel } from './feed-models/yandexmarket.feed.model';

interface ShortCategoryInformation {
  id: number;
  blocked: boolean;
}

export class YandexMarketFeedBuilder {
  private categories: MarketplaceCategoryModel[] = [];
  private products: MarketplaceProductModel[] = [];
  private categoryNumberMap = new Map<string, ShortCategoryInformation>();
  private readonly feed: YandexMarketFeedModel = new YandexMarketFeedModel();

  constructor(private readonly settings: YandexMarketDto) {

    const { yml_catalog } = this.feed;
    yml_catalog['@date'] = format(new Date(), 'yyyy-MM-dd HH:mm');

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

  build(): YandexMarketFeedModel {

    this.completeCategoryInformation();
    this.completeProductInformation();

    return this.feed;

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
    const { minimalPrice, nullifyStocks } = this.settings;

    let available = true;
    let ignoreRestrictions = false;
    let nullifyProductStocks = false;

    if (product.concreteMarketplaceSettings) {
      const marketplaceSettings = product.concreteMarketplaceSettings;
      ignoreRestrictions = marketplaceSettings.ignoreRestrictions;
      nullifyProductStocks = marketplaceSettings.nullifyStock;
    }

    if (blocked && !ignoreRestrictions) {
      available = false;
    }

    if (minimalPrice > 0
      && minimalPrice > product.calculatedPrice
      && !ignoreRestrictions) {
      available = false;
    }

    if (nullifyProductStocks || nullifyStocks) {
      product.stock = 0;
    }

    if (product.stock === 0) {
      available = false;
    }

    const stock = available ? product.stock : 0;
    const weight = this.productWeight(product);
    const dimensions = this.productDimensions(product);
    const vendorCode = this.productVendorCode(product);
    const availability = available ? Availability.ACTIVE : Availability.INACTIVE;

    const newOffer: Offer = {
      '@id': product.articul,
      'shop-sku': product.articul,
      name: product.name,
      categoryId: id,
      price: product.calculatedPrice,
      count: stock,
      barcode: product.barcode,
      vat: product.vat,
      description: product.description,
      manufacturer: product.vendor,
      vendor: product.vendor,
      vendorCode: vendorCode,
      url: product.picture,
      currencyId: 'RUR',
      country_of_origin: product.countryOfOrigin,
      weight: weight,
      dimensions: dimensions,
      availability: availability,
    };

    offer.push(newOffer);

  }

  // If we don't have a product dimensions or weight, we can set a default values
  // for the yandex market settings.
  private productWeight(product: MarketplaceProductModel): number | undefined {

    if (product.weight)
      return product.weight;

    if (this.settings.defaultWeight)
      return this.settings.defaultWeight;

    return undefined;

  }

  private productDimensions(product: MarketplaceProductModel): string | undefined {

    const length = product.length ? product.length : this.settings.defaultLength;
    const height = product.height ? product.height : this.settings.defaultHeight;
    const width = product.width ? product.width : this.settings.defaultWidth;

    if (length && height && width) {
      return `${length}/${height}/${width}`;
    }
    return undefined;

  }

  private productVendorCode(product: MarketplaceProductModel): string | undefined {

    if (product.vendorCode)
      return product.vendorCode;

    if (this.settings.defaultVendorCode)
      return this.settings.defaultVendorCode;

    return undefined;

  }
}
