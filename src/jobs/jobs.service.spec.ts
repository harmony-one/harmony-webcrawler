import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { JobStatus } from '../types';
import { ScheduleModule } from '@nestjs/schedule';
import { CrawlerService } from '../crawler/crawler.service';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        ConfigModule.forRoot({
          load: [configuration],
        }),
        ScheduleModule.forRoot(),
      ],
      providers: [JobsService, CrawlerService],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register new job', async () => {
    const newJob = await service.create('');
    expect(newJob.id.length).toBe(10);
    expect(newJob.status).toBe(JobStatus.created);
  });
});
