import { CompanyService } from '../../company/company.service';
import { CategoryService } from '../../category/category.service';
import { ProductService } from '../../product/product.service';
import { MarketplaceService } from '../marketplace.service';
import { MarketplaceCategoryDto } from '../../category/dto/marketplace-category.dto';
import { SberMegaMarketFeed, Offer } from './sbermegamarket-feed.model';
import { Logger } from '@nestjs/common';
import { CompanyModel } from '../../company/company.model';
import { FeedGenerator } from './feed.generator.interface';
import { MarketplaceProductDto } from '../../product/dto/marketplace-product.dto';
import { MarketplaceModel } from '../marketplace.model';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { path } from 'app-root-path';
import { ensureDir, writeFile } from 'fs-extra';

export class SberMegaMarketFeedGenerator implements FeedGenerator {

  private readonly logger = new Logger(SberMegaMarketFeedGenerator.name);
  private readonly goodsFeed: SberMegaMarketFeed = {
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

  constructor(
    private readonly configService: ConfigService,
    private readonly companyService: CompanyService,
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly marketplaceService: MarketplaceService,
    private readonly marketplace: MarketplaceModel) {
  }

  async generateFeed(startDate: Date) {

    const categories = await this
      .getMarketplaceCategories();
    const products = await this.productService
      .getMarketplaceProducts(this.marketplace);
    const company = await this.companyService
      .get();

    this.completeCompanyInfo(company);
    this.completeCategories(categories);
    this.completeProducts(categories, products);

    const xml = this.serializeFeed();

    this.logger.log(xml);

    await this.saveFeedFile(xml);

    await this.marketplaceService
      .updateSentStocksAndPricesAt(this.marketplace._id, startDate);
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

  private completeProducts(categories: Map<string, MarketplaceCategoryDto>,
                           products: MarketplaceProductDto[]) {

    const offerList = this.goodsFeed.yml_catalog.shop.offers.offer;

    products.forEach((item) => {
      if (item.calculatedPrice != undefined
        && categories.has(item.categoryCode)) {

        const category = categories.get(item.categoryCode);

        if (item.nullifyStock
          || (category.blocked && !item.ignoreRestrictions)) {
          item.stock = 0;
        }

        const available = item.stock > 0;

        const marketplaceProduct: Offer = {
          '@id': item.articul,
          '@available': available,
          name: item.name,
          categoryId: category.number,
          price: item.calculatedPrice,
          description: item.description,
          barcode: item.barcode,
          outlets: {
            outlet: [
              {
                '@id': this.marketplace.warehouseId,
                '@instock': item.stock,
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

        addParam(marketplaceProduct, 'Бренд', item.brand);
        addParam(marketplaceProduct, 'Weight', item.weight);
        addParam(marketplaceProduct, 'Length', item.length);
        addParam(marketplaceProduct, 'Height', item.height);
        addParam(marketplaceProduct, 'Width', item.width);
        addParam(marketplaceProduct, 'Страна производитель', item.countryOfOrigin);

        item.characteristics?.forEach((characteristic) => {
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

  private async saveFeedFile(xmlData: string) {
    const feedPath = `${path}/${this.configService.get('FEEDS_PATH')}`;
    await ensureDir(feedPath);
    await writeFile(`${feedPath}/${this.marketplace._id}.xml`, xmlData);
  }

}