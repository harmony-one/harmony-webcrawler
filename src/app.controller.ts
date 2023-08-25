import { BadRequestException, Controller, Get, Logger, Query } from "@nestjs/common";
import { AppService } from './app.service';
import { ParseResponse } from './types';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  @Get()
  getStatus(): string {
    return 'OK';
  }

  @Get('/parse')
  async parseContent(@Query('url') url: string): Promise<ParseResponse> {
    if (!url) {
      throw new BadRequestException('Url is missing');
    }
    if (!url.includes('http')) {
      throw new BadRequestException('Wrong url');
    }
    this.logger.log(`Start parsing ${url}...`);
    const data = await this.appService.getPageData(url);
    this.logger.log(
      `Parsing completed ${url}. Page elements: ${data.result.length}, elapsed time: ${data.elapsedTime}, network traffic: ${data.networkTraffic}.`,
    );
    return data;
  }
}
