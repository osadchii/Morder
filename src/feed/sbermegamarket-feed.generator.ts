import { CompanyService } from '../company/company.service';
import { CategoryService } from '../category/category.service';
import { ProductService } from '../product/product.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { MarketplaceCategoryDto } from '../category/dto/marketplace-category.dto';
import { Offer, SberMegaMarketFeed } from './sbermegamarket-feed.model';
import { CompanyModel } from '../company/company.model';
import { FeedGenerator } from './feed.generator.interface';
import { MarketplaceProductDto } from '../product/dto/marketplace-product.dto';
import { MarketplaceModel } from '../marketplace/marketplace.model';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { path } from 'app-root-path';
import { ensureDir, writeFile } from 'fs-extra';
import { ProductImageHelper } from '../product/product.image';

interface CompleteProductsOptions {
  categories: Map<string, MarketplaceCategoryDto>;
  products: MarketplaceProductDto[];
}

export class SberMegaMarketFeedGenerator implements FeedGenerator {

  public readonly goodsFeed: SberMegaMarketFeed = {
    yml_catalog: {
      '@date': format(new Date(), 'yyyy-MM-dd HH:mm'),
      shop: {
        categories: {
          category: [],
        },
        offers: {
          offer: [],
        },
      },
    },
  };

  private categories: Map<string, MarketplaceCategoryDto>;
  private products: MarketplaceProductDto[];
  private company: CompanyModel;

  constructor(
    private readonly configService: ConfigService,
    private readonly companyService: CompanyService,
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly marketplaceService: MarketplaceService,
    private readonly marketplace: MarketplaceModel) {
  }

  async getData() {
    this.categories = await this.getMarketplaceCategories();
    this.products = await this.getMarketplaceProducts();
    this.company = await this.getMarketplaceCompanyData();
  }

  async sendData() {
    const xml = this.serializeFeed();
    await this.saveFeedFile(xml);
  }

  async generateFeed() {
    this.completeCompanyInfo(this.company);
    this.completeCategories(this.categories);

    const completeProductsOptions: CompleteProductsOptions = {
      categories: this.categories,
      products: this.products
    };

    this.completeProducts(completeProductsOptions);
  }

  private completeCompanyInfo(company: CompanyModel) {

    if (!company) {
      return;
    }
    const shop = this.goodsFeed.yml_catalog.shop;
    shop.company = company.companyName;
    shop.name = company.shopName;
    shop.url = company.url;

  }

  private completeCategories(categories: Map<string, MarketplaceCategoryDto>) {

    const categoryList = this.goodsFeed
      .yml_catalog.shop.categories.category;
    categories.forEach((category) => {
      categoryList.push({
        '#text': category.name,
        '@id': category.number,
        '@parent':
          categories.has(category.parentCode)
            ? categories.get(category.parentCode).number : undefined,
      });
    });
  }

  private completeProducts({ categories, products }: CompleteProductsOptions) {

    const { minimalPrice, warehouseId } = this.marketplace;
    const offerList = this.goodsFeed.yml_catalog.shop.offers.offer;

    products.forEach(({
                        name,
                        calculatedPrice,
                        categoryCode,
                        ignoreRestrictions,
                        articul,
                        nullifyStock,
                        stock,
                        description,
                        barcode,
                        erpCode,
                        brand,
                        length,
                        width,
                        height,
                        weight,
                        countryOfOrigin,
                        characteristics,
                        image,
                      }) => {
      if (categories.has(categoryCode)) {

        const { number, blocked } = categories.get(categoryCode);
        const veryCheaper = minimalPrice > calculatedPrice;

        if (nullifyStock
          || ((blocked || veryCheaper) && !ignoreRestrictions)) {
          stock = 0;
        }

        const available = stock > 0;

        const marketplaceProduct: Offer = {
          '@id': articul,
          '@available': available,
          name,
          categoryId: number,
          price: calculatedPrice,
          description,
          barcode,
          picture:
            image
              ? ProductImageHelper.imageUrlImageName(this.configService, erpCode)
              : undefined,
          outlets: {
            outlet: [
              {
                '@id': warehouseId,
                '@instock': stock,
              },
            ],
          },
          param: [],
        };

        const addParam = (offer: Offer, key: string, value?: string | number) => {
          if (value) {
            offer.param.push({
              '@name': key,
              '#text': value.toString(),
            });
          }
        };

        addParam(marketplaceProduct, 'Бренд', brand);
        addParam(marketplaceProduct, 'Weight', weight);
        addParam(marketplaceProduct, 'Length', length);
        addParam(marketplaceProduct, 'Height', height);
        addParam(marketplaceProduct, 'Width', width);
        addParam(marketplaceProduct, 'Страна производитель', countryOfOrigin);

        characteristics?.forEach((characteristic) => {
          addParam(marketplaceProduct, characteristic.key, characteristic.value);
        });

        offerList.push(marketplaceProduct);
      }
    });

  }

  private serializeFeed() {

    const builder = require('xmlBuilder');
    return builder.create(this.goodsFeed)
      .end({ pretty: true });

  }

  private async getMarketplaceCategories() {

    let categoryNumber = 1;

    const categories = await this.categoryService
      .getMarketplaceCategories(this.marketplace._id.toHexString());
    const categoriesByErpCode = new Map<string, MarketplaceCategoryDto>();

    categories.forEach((item) => {
      item.number = categoryNumber++;
      categoriesByErpCode.set(item.erpCode, item);
    });

    return categoriesByErpCode;
  }

  private async getMarketplaceProducts() {
    return await this.productService
      .getMarketplaceProducts(this.marketplace);
  }

  private async getMarketplaceCompanyData() {
    return await this.companyService.get();
  }

  private async saveFeedFile(xmlData: string) {
    const feedPath = `${path}/${this.configService.get('FEEDS_PATH')}`;
    const feedFullName = `${feedPath}/${this.marketplace._id}.xml`;

    await ensureDir(feedPath);
    await writeFile(feedFullName, xmlData);
  }

}