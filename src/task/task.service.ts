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
import { LoggedFeedGenerator } from '../feed/logged-feed.generator';

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

    const startDate = new Date();
    this.logger.log('Started feeds generator');

    const marketplaces = await this.marketplaceService.getAll();

    for (const marketplace of marketplaces) {
      if (!marketplace.active) {
        this.logger.log(`${marketplace.name} is not active`);
        continue;
      }
      const millisecondsInterval = marketplace.sendStocksAndPriceEveryMinutes * 60000;
      const date = new Date(startDate.getTime() - millisecondsInterval);

      if (date < marketplace.sentStocksAndPricesAt) {
        continue;
      }

      const generator = this.feedGeneratorByMarketplace(marketplace);

      if (generator) {
        const loggedGenerator = new LoggedFeedGenerator(generator, marketplace.name);
        await loggedGenerator.getData();
        await loggedGenerator.generateFeed();
        await loggedGenerator.sendData();
        await this.marketplaceService.updateSentStocksAndPricesAt(marketplace._id, startDate);
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
