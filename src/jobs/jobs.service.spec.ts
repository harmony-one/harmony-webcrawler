import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { CacheModule } from '@nestjs/cache-manager';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [JobsService],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register new job', async () => {
    const newJob = await service.registerJob('');
    expect(typeof newJob.id).toBe('string');
    expect(newJob.id.length).toBe(10);
  });
});
