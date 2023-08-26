import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ParseResult } from './types';
import { CrawlerService } from './crawler/crawler.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly crawlerService: CrawlerService,
    private readonly logger: Logger,
  ) {}

  @Get()
  getStatus(): string {
    return this.appService.getStatus();
  }

  @Get('/parse')
  async parseContent(@Query('url') url: string): Promise<ParseResult> {
    if (!url) {
      throw new BadRequestException('Url is missing');
    }
    if (!url.includes('http')) {
      throw new BadRequestException('Wrong url');
    }
    this.logger.log(`Start parsing ${url}...`);
    const data = await this.crawlerService.getPageData(url);
    this.logger.log(
      `Parsing completed ${url}. Page elements: ${data.elements.length}, elapsed time: ${data.elapsedTime}, network traffic: ${data.networkTraffic}.`,
    );
    return data;
  }
}
