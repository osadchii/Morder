import { format } from 'date-fns';
import { MarketplaceProductModel } from '../marketplace.product.model';
import { MarketplaceCategoryModel } from '../marketplace.category.model';
import { Offer, Outlets, OzonFeedModel } from './feed-model/ozon.feed.model';
import { OzonDto } from './dto/ozon.dto';

interface ShortCategoryInformation {
  id: number;
  blocked: boolean;
}

export class OzonFeedBuilder {
  private products: MarketplaceProductModel[] = [];
  private categoryNumberMap = new Map<string, ShortCategoryInformation>();
  private readonly feed: OzonFeedModel = new OzonFeedModel();

  constructor(private readonly settings: OzonDto) {

    const { yml_catalog } = this.feed;

    yml_catalog['@date'] = format(new Date(), 'yyyy-MM-dd HH:mm');

  }

  addProduct(product: MarketplaceProductModel) {
    this.products.push(product);
  }

  addCategory(category: MarketplaceCategoryModel) {
    const categoryNumber = this.categoryNumberMap.size + 1;
    this.categoryNumberMap.set(
      category.erpCode,
      {
        id: categoryNumber,
        blocked: category.blocked,
      },
    );
  }

  build(): OzonFeedModel {

    this.completeProductInformation();

    return this.feed;

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

    const { blocked } = this.categoryNumberMap.get(product.categoryCode);
    const { minimalPrice, warehouseName, nullifyStocks } = this.settings;

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

    const newOffer: Offer = {
      '@id': product.articul,
      price: this.settings.updatePricesByAPI ? undefined : product.calculatedPrice,
      outlets: this.settings.updateStocksByAPI ? undefined : new Outlets(warehouseName, stock),
    };

    offer.push(newOffer);

  }
}
