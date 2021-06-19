import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductService } from '../product/product.service';

@Injectable()
export class TaskService {

  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly productService: ProductService) {
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async generateFeeds() {
    const stocks = await this.productService.getStocks();
    const data = JSON.stringify(stocks);
    this.logger.log(data);
  }

}
