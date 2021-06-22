import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { GoodsFeedGenerator } from '../marketplace/feed/goods-feed.generator';
import { CompanyService } from '../company/company.service';
import { MarketplaceService } from '../marketplace/marketplace.service';

@Injectable()
export class TaskService {

  constructor(private readonly companyService: CompanyService,
              private readonly productService: ProductService,
              private readonly categoryService: CategoryService,
              private readonly marketplaceService: MarketplaceService) {
  }

  @Interval(10000)
  async generateFeeds() {
    const generator = new GoodsFeedGenerator(this.companyService,
      this.categoryService,
      this.productService,
      this.marketplaceService,
      '1');

    await generator.generateFeed();
  }

}
