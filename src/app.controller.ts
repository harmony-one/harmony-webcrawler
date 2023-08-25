import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ParseResponse } from './types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
    const timeStart = Date.now();
    const result = await this.appService.getPageData(url);
    return {
      result,
      elapsedTime: Date.now() - timeStart,
    };
  }
}
