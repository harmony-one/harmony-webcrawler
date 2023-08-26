export interface PageElement {
  text: string;
  tagName: string;
}

export interface ParseResult {
  elements: PageElement[];
  elapsedTime: number;
  networkTraffic: number;
}

export enum JobStatus {
  created = 'created',
  started = 'started',
  completed = 'completed',
  failed = 'failed',
}

export interface ParseJob {
  id: string;
  url: string;
  status: JobStatus;
  result: ParseResult | null;
  error: string | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
}
