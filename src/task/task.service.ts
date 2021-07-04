import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { SberMegaMarketFeedGenerator } from '../feed/sbermegamarket-feed.generator';
import { CompanyService } from '../company/company.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { MarketplaceModel, MarketplaceType } from '../marketplace/marketplace.model';
import { FeedGenerator } from '../feed/feed.generator.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskService {

  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly companyService: CompanyService,
              private readonly productService: ProductService,
              private readonly categoryService: CategoryService,
              private readonly marketplaceService: MarketplaceService,
              private readonly configService: ConfigService) {
  }

  @Interval(10000)
  async generateFeeds() {

    this.logger.log('Started feeds generator');

    const marketplaces = await this.marketplaceService.getAll();

    this.logger.log(`${marketplaces.length} marketplaces received`);

    const startDate = new Date();

    for (const marketplace of marketplaces) {
      if (!marketplace.active) {
        this.logger.log(`${marketplace.name} is not active`)
        continue;
      }
      const millisecondsInterval = marketplace.sendStocksAndPriceEveryMinutes * 60000;
      const date = new Date(startDate.getTime() - millisecondsInterval);

      if (date < marketplace.sentStocksAndPricesAt) {
        this.logger.log(`${marketplace.name} feed is fresh`)
        continue;
      }

      const generator = this.feedGeneratorByMarketplace(marketplace);

      if (generator) {
        const startGenerate = new Date().getTime();
        await generator.generateFeed(startDate);
        const endGenerate = new Date().getTime();
        this.logger.log(`Feed for ${marketplace.name} was generated. Elapsed ms: ${endGenerate - startGenerate}`);
      }
    }
  }

  private feedGeneratorByMarketplace(marketplace: MarketplaceModel): FeedGenerator {
    switch (marketplace.type) {
      case MarketplaceType.SberMegaMarket:
        return new SberMegaMarketFeedGenerator(this.configService,
          this.companyService,
          this.categoryService,
          this.productService,
          this.marketplaceService,
          marketplace);
    }
  }
}
