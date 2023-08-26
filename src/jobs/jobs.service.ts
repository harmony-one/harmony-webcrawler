import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JobStatus, ParseJob } from '../types';

@Injectable()
export class JobsService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  private getRandomId(length = 10) {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }

  public async registerJob(url: string) {
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

  public getJob(id: string) {
    return this.cacheManager.get(id);
  }
}
