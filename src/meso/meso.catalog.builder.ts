import { MarketplaceProductModel } from '../marketplace/marketplace.product.model';
import { MesoCatalogApiModel, MesoProduct } from './api-model/meso.catalog.api.model';
import { Vat } from '../product/product.model';
import { MarketplaceCategoryModel } from '../marketplace/marketplace.category.model';
import { MesoModel } from './meso.model';

export class MesoCatalogBuilder {

  private products: MarketplaceProductModel[] = [];
  private categoryBlockedMap = new Map<string, boolean>();

  constructor(private readonly settings: MesoModel) {
  }

  addProduct(product: MarketplaceProductModel) {
    this.products.push(product);
  }

  addCategory(category: MarketplaceCategoryModel) {
    this.categoryBlockedMap.set(category.erpCode, category.blocked);
  }

  build(): MesoCatalogApiModel {
    const catalog = new MesoCatalogApiModel();

    this.products.forEach((item) => {
      catalog.Products.push(this.mesoProductByMarketplaceProduct(item));
    });

    return catalog;
  }

  private mesoProductByMarketplaceProduct(product: MarketplaceProductModel): MesoProduct {
    if (!this.categoryBlockedMap.has(product.categoryCode)) {
      return;
    }

    if (!product.calculatedPrice) {
      return;
    }

    const blocked = this.categoryBlockedMap.get(product.categoryCode);
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

    return {
      ProductName: product.name,
      NdsPercent: MesoCatalogBuilder.NdsPercent(product.vat),
      RemainsCount: stock,
      Price: product.calculatedPrice,
      InternalCode: product.articul,
      Code: product.barcode
    };
  }

  private static NdsPercent(vat: Vat) {
    switch (vat) {
      case Vat.VAT_20:
        return 20;
      case Vat.VAT_20_120:
        return 20;
      case Vat.VAT_10:
        return 10;
      case Vat.VAT_10_110:
        return 10;
      case Vat.VAT_0:
        return 0;
      case Vat.NO_VAT:
        return 0;
    }
  }
}
