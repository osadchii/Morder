import { SberMegaMarketDto } from './dto/sbermegamarket.dto';
import { CompanyModel } from '../company/company.model';
import { SberMegaMarketFeedModel } from './sbermegamarket.feed.model';
import { format } from 'date-fns';
import { SberMegaMarketFeedCategoryModel } from './sbermegamarket.feed.category.model';
import { SberMegaMarketFeedProductModel } from './sbermegamarket.feed.product.model';

export class SberMegaMarketFeedBuilder {
  private company: CompanyModel;
  private categories: SberMegaMarketFeedCategoryModel[] = [];
  private products: SberMegaMarketFeedProductModel[] = [];
  private categoryNumberMap = new Map<string, number>();
  private readonly feed: SberMegaMarketFeedModel = new SberMegaMarketFeedModel();

  constructor(private readonly settings: SberMegaMarketDto) {
    this.feed.yml_catalog['@date'] = format(new Date(), 'yyyy-MM-dd HH:mm');
  }

  setCompany(company: CompanyModel) {
    this.company = company;
  }

  addProduct(product: SberMegaMarketFeedProductModel) {
    this.products.push(product);
  }

  addCategory(category: SberMegaMarketFeedCategoryModel) {
    this.categories.push(category);

    const categoryNumber = this.categoryNumberMap.size + 1;
    this.categoryNumberMap.set(
      category.erpCode,
      categoryNumber,
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

      const categoryNumber = this.categoryNumberMap.get(item.erpCode);

      if (item.parentCode && this.categoryNumberMap.has(item.parentCode)) {
        parentNumber = this.categoryNumberMap.get(item.parentCode);
      }

      category.push({
        '#text': item.name,
        '@id': categoryNumber,
        '@parentId': parentNumber,
      });

    });

  }

  private completeProductInformation() {

    const { offer } = this.feed.yml_catalog.shop.offers;

    this.products.forEach((item) => {

      if (!this.categoryNumberMap.has(item.categoryCode)) {
        return;
      }

      if (!item.calculatedPrice){
        return;
      }

      //TODO: 1. Определить доступность товара (по блокировке категории, по минимальной цене, остатку)
      // 2. Заполнить карточку
      // 3. Подумать над видами товара
      let available = true;

      const categoryCode = this.categoryNumberMap.get(item.categoryCode);

      offer.push({
        '@id': item.articul,
        '@available': true, //TODO
        name: item.name,
        categoryId: categoryCode,
        price: item.calculatedPrice
      });

    });

  }
}
