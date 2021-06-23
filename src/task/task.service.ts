import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { GoodsFeedGenerator } from '../marketplace/feed/goods-feed.generator';
import { CompanyService } from '../company/company.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { MarketplaceModel, MarketplaceType } from '../marketplace/marketplace.model';
import { FeedGenerator } from '../marketplace/feed/feed.generator.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskService {

  constructor(private readonly companyService: CompanyService,
              private readonly productService: ProductService,
              private readonly categoryService: CategoryService,
              private readonly marketplaceService: MarketplaceService,
              private readonly configService: ConfigService) {
  }

  @Interval(10000)
  async generateFeeds() {

    const marketplaces = await this.marketplaceService.getAll();

    for (const marketplace of marketplaces) {
      const now = new Date();
      const date = new Date(now.getTime() - marketplace.sendStocksAndPriceEveryMinutes * 60000);
      if (date < marketplace.sentStocksAndPricesAt) {
        continue;
      }
      const generator = this.feedGeneratorByMarketplace(marketplace);

      if (generator) {
        await generator.generateFeed();
      }
    }
  }

  private feedGeneratorByMarketplace(marketplace: MarketplaceModel): FeedGenerator {
    switch (marketplace.type) {
      case MarketplaceType.SberMegaMarket:
        return new GoodsFeedGenerator(this.configService,
          this.companyService,
          this.categoryService,
          this.productService,
          this.marketplaceService,
          marketplace);
    }
  }
}
