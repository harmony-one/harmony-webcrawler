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
import { ParseDto } from './dto/parse.dto';

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
  @CacheTTL(30 * 1000)
  @UseInterceptors(CacheInterceptor)
  async parseContent(@Query() dto: ParseDto): Promise<ParseResult> {
    this.logger.log(`Start parsing URL "${dto.url}"...`);
    const data = await this.crawlerService.getPageData(dto);

    this.logger.log(
      `Parsing completed ${dto.url}. ` +
        `Page elements: ${data.elements.length}, ` +
        `elapsed time: ${data.elapsedTime}, ` +
        `network traffic: ${data.networkTraffic}.`,
    );
    return data;
  }
}
