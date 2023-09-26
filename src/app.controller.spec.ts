import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';
import { CrawlerService } from './crawler/crawler.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ScheduleModule } from '@nestjs/schedule';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        ConfigModule.forRoot({
          load: [configuration],
        }),
        ScheduleModule.forRoot(),
      ],
      controllers: [AppController],
      providers: [CrawlerService, AppService, Logger],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "OK"', () => {
      expect(appController.getStatus()).toBe('OK');
    });
  });

  describe('Substack', () => {
    it('should return parsed data', async () => {
      const data = await appController.parseContent({
        url: 'https://read.substack.com/p/see-what-your-friends-are-reading',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);

    it('should return parsed data', async () => {
      const data = await appController.parseContent({
        url: 'https://xn--qv9h.s.country/p/telegram-bots-and-clients-self-custody',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);

    it('should return parsed data', async () => {
      const data = await appController.parseContent({
        url: 'https://blog.harmony.one/p/harmony-year-of-efficiency-and-ai',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Notion', () => {
    it('should parse notion page', async () => {
      const data = await appController.parseContent({
        url: 'https://www.notion.so/harmonyone/b3bb4a64250a4eaf95e0eafd4b933f90?v=e49f044b1bf4486988306f161981e733',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Notion Embed', () => {
    it('should return parsed data', async () => {
      const data = await appController.parseContent({
        url: 'https://www.h.country/one-bot-upcoming-features-558b9dfa4401443bb1f4fd3a271edd44',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);
    it('should return parsed data', async () => {
      const data = await appController.parseContent({
        url: 'https://harmony.one',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);

    it('should return parsed data', async () => {
      const data = await appController.parseContent({
        url: 'https://harmony.one/dear',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('General parsing', () => {
    it('should parse reddit.com', async () => {
      const data = await appController.parseContent({
        url: 'https://www.reddit.com/r/harmony_one/comments/z0b8g1/export_from_blits_import_to_metamask',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);

    it('should parse wikipedia', async () => {
      const data = await appController.parseContent({
        url: 'https://en.wikipedia.org/wiki/Grimes',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);

    it('should parse CNN', async () => {
      const data = await appController.parseContent({
        url: 'https://edition.cnn.com/2023/08/29/tech/new-iphone-15-apple-wonderlust/index.html',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);
  });

  // describe('WSJ', () => {
  //   it('should return parsed data', async () => {
  //     const data = await appController.parseContent({
  //       url: 'https://www.wsj.com/articles/vivek-ramaswamy-taiwan-china-gop-presidential-race-4a1fb6fe?mod=hp_opin_pos_1',
  //     });
  //     expect(data.elements.length).toBeGreaterThan(0);
  //   }, 90000);
  //
  //   it('should return parsed data', async () => {
  //     const data = await appController.parseContent({
  //       url: 'https://www.wsj.com/us-news/donald-trump-to-turn-himself-in-at-fulton-county-jail-in-georgia-aa43b825',
  //     });
  //     expect(data.elements.length).toBeGreaterThan(0);
  //   }, 90000);
  //
  //   it('should return parsed data', async () => {
  //     const data = await appController.parseContent({
  //       url: 'https://www.wsj.com/business/media/under-armour-kevin-plank-stephanie-ruhle-66cb65b5?mod=hp_lead_pos5',
  //     });
  //     expect(data.elements.length).toBeGreaterThan(0);
  //   }, 90000);
  // });

  describe('Twitter', () => {
    it('should parse tweet', async () => {
      const data = await appController.parseContent({
        url: 'https://twitter.com/harmonyprotocol/status/1696648591685886213?s=46&t=zj2jAM0qpe5fipIoj7gbBA',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);

    it('should parse tweet', async () => {
      const data = await appController.parseContent({
        url: 'https://twitter.com/harmonyprotocol/status/1696648591685886213?s=46&t=zj2jAM0qpe5fipIoj7gbBA',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Super.so', () => {
    it('should parse https://howarths.super.site', async () => {
      const data = await appController.parseContent({
        url: 'https://howarths.super.site',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);

    it('should parse https://fairnessfoundation.com/fairness-index/foreword', async () => {
      const data = await appController.parseContent({
        url: 'https://fairnessfoundation.com/fairness-index/foreword',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('weather.com', () => {
    it('should parse page', async () => {
      const data = await appController.parseContent({
        url: 'https://weather.com/en-CA/weather/tenday/l/667d0d17672cf04f19f320d981e1a41c1de1cef47193b8879646b77ab2689e18',
      });
      expect(data.elements.length).toBeGreaterThan(0);
    }, 30000);
  });
});
