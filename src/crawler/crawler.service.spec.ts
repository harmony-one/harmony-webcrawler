import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from './crawler.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../config/configuration';

describe('CrawlerService', () => {
  let service: CrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
        }),
      ],
      providers: [ConfigService, CrawlerService],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
