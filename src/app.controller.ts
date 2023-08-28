import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ParseResult } from './types';
import { CrawlerService } from './crawler/crawler.service';
import { ConfigService } from '@nestjs/config';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly crawlerService: CrawlerService,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getStatus(): string {
    return this.appService.getStatus();
  }

  @Get('/parse')
  @CacheTTL(60 * 60 * 1000)
  @UseInterceptors(CacheInterceptor)
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
