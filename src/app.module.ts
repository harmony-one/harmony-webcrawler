import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsService } from './jobs/jobs.service';
import { CrawlerService } from './crawler/crawler.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [Logger, AppService, JobsService, CrawlerService],
})
export class AppModule {}
