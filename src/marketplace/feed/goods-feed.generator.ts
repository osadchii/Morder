import { CompanyService } from '../../company/company.service';
import { CategoryService } from '../../category/category.service';
import { ProductService } from '../../product/product.service';
import { MarketplaceService } from '../marketplace.service';
import { MarketplaceCategoryDto } from '../../category/dto/marketplace-category.dto';
import { GoodsFeedModel } from './goods-feed.model';
import { Logger } from '@nestjs/common';
import { CompanyModel } from '../../company/company.model';

export class GoodsFeedGenerator {

  private readonly logger = new Logger(GoodsFeedGenerator.name);

  constructor(private readonly companyService: CompanyService,
              private readonly categoryService: CategoryService,
              private readonly productService: ProductService,
              private readonly marketplaceService: MarketplaceService,
              private readonly marketplaceId: string) {
  }

  async generateFeed() {

    const categories = await this.getMarketplaceCategories();
    const company = await this.companyService.get();

    const goodsFeed: GoodsFeedModel = {
      yml_catalog: {
        '@date': GoodsFeedGenerator.nowDateString(),
        shop: {
          categories: {
            category: [],
          },
        },
      },
    };

    GoodsFeedGenerator.completeCompanyInfo(goodsFeed, company);
    GoodsFeedGenerator.completeCategories(goodsFeed, categories);

    const xml = GoodsFeedGenerator.serializeFeed(goodsFeed);

    this.logger.log(xml);

    await this.marketplaceService.updateSentStocksAndPricesAt(this.marketplaceId);
  }

  private async getMarketplaceCategories() {
    let categoryNumber = 1;

    const categories = await this.categoryService.getMarketplaceCategories(this.marketplaceId);
    const categoriesByErpCode = new Map<string, MarketplaceCategoryDto>();

    categories.forEach((item) => {
      item.number = categoryNumber++;
      categoriesByErpCode.set(item.erpCode, item);
    });

    return categoriesByErpCode;
  }

  private static completeCompanyInfo(feed: GoodsFeedModel, company: CompanyModel) {
    if (!company){
      return;
    }
    const shop = feed.yml_catalog.shop;
    shop.company = company.companyName;
    shop.name = company.shopName;
    shop.url = company.url;
  }

  private static completeCategories(feed: GoodsFeedModel, categories: Map<string, MarketplaceCategoryDto>) {
    const categoryList = feed.yml_catalog.shop.categories.category;
    categories.forEach((category) => {
      categoryList.push({
        '#text': category.name,
        '@id': category.number,
        '@parent':
          categories.has(category.parentCode) ? categories.get(category.parentCode).number : undefined,
      });
    });
  }

  private static serializeFeed(feed: GoodsFeedModel) {
    const builder = require('xmlBuilder');
    return builder.create(feed).end({ pretty: true });
  }

  private static nowDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const numberWithLeadZero = (number: number): string => {
      if (number < 10) {
        return `0${number}`;
      }
      return `${number}`;
    };

    return `${year}-${numberWithLeadZero(month)}-${numberWithLeadZero(day)} ${numberWithLeadZero(hour)}:${numberWithLeadZero(minute)}`;
  }
}