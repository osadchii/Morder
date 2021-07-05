import { FeedGenerator } from './feed.generator.interface';
import { Logger } from '@nestjs/common';

export class LoggedFeedGenerator implements FeedGenerator {

  private logger: Logger;

  constructor(private readonly feedGenerator: FeedGenerator,
              marketplaceName: string) {
    this.logger = new Logger(marketplaceName);
  }

  async generateFeed() {
    const startTime = new Date().getTime();
    this.logger.log(`Started generating feed`);

    await this.feedGenerator.generateFeed();

    const elapsedMs = new Date().getTime() - startTime;
    this.logger.log(`Feed generated successfully. Elapsed ms: ${elapsedMs}`);
  }

  async getData() {
    const startTime = new Date().getTime();
    this.logger.log(`Started getting data for feed`);

    await this.feedGenerator.getData();

    const elapsedMs = new Date().getTime() - startTime;
    this.logger.log(`Data for feed received successfully. Elapsed ms: ${elapsedMs}`);
  }

  async sendData() {
    const startTime = new Date().getTime();
    this.logger.log(`Started sending feed`);

    await this.feedGenerator.sendData();

    const elapsedMs = new Date().getTime() - startTime;
    this.logger.log(`Feed sent successfully. Elapsed ms: ${elapsedMs}`);
  }

}