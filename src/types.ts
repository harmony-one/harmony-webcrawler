export interface PageElement {
  text: string;
  tagName: string;
}

export interface ParseResult {
  elements: PageElement[];
  elapsedTime: number;
  networkTraffic: number;
}

export interface ParseJob {
  id: string;
  url: string;
  result: ParseResult | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
}
