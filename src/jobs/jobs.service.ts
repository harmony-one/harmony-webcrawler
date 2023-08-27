import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JobStatus, ParseJob } from '../types';
import { CrawlerService } from '../crawler/crawler.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private crawlerService: CrawlerService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkJobsList() {
    const jobs = await this.getList();
    return jobs;
  }

  private getRandomId(length = 10) {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }

  public async create(url: string) {
    const id = this.getRandomId();

    const newJob: ParseJob = {
      id,
      url,
      status: JobStatus.created,
      result: null,
      error: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
    };

    await this.cacheManager.set(id, newJob);
    return newJob;
  }

  public getById(id: string): Promise<ParseJob> {
    return this.cacheManager.get(id);
  }

  public async getList() {
    const ids = await this.cacheManager.store.keys();
    const list: ParseJob[] = [];
    for (const id of ids) {
      const job = await this.getById(id);
      list.push(job);
    }
    return list;
  }

  public async registerJob(url: string) {
    const job = await this.create(url);
  }
}
