import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';
import { CrawlerService } from './crawler/crawler.service';
import { JobsService } from './jobs/jobs.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        ConfigModule.forRoot({
          load: [configuration],
        }),
      ],
      controllers: [AppController],
      providers: [CrawlerService, AppService, Logger, JobsService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "OK"', () => {
      expect(appController.getStatus()).toBe('OK');
    });
  });

  describe('parse Substack', () => {
    it('should return parsed data', async () => {
      const data = await appController.parseContent(
        'https://xn--qv9h.s.country/p/telegram-bots-and-clients-self-custody',
      );
      expect(data.elements.length).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('parse Substack IFrame', () => {
    it('should return parsed data', async () => {
      const data = await appController.parseContent(
        'https://blog.harmony.one/p/harmony-year-of-efficiency-and-ai',
      );
      expect(data.elements.length).toBeGreaterThanOrEqual(0);
    }, 30000);
  });
});
