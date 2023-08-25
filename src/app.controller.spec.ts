import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    jest.setTimeout(30000);
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, Logger],
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
      expect(data.result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('parse Substack IFrame', () => {
    it('should return parsed data', async () => {
      const data = await appController.parseContent(
        'https://blog.harmony.one/p/harmony-year-of-efficiency-and-ai',
      );
      expect(data.result.length).toBeGreaterThanOrEqual(0);
    });
  });
});
