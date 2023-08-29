import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerService } from './crawler/crawler.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    CacheModule.register(),
    ConfigModule.forRoot({
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [Logger, AppService, CrawlerService, ConfigService],
})
export class AppModule {}
