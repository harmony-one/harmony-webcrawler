export interface PageElement {
  text: string;
  tagName: string;
}

export interface ParseResult {
  elements: PageElement[];
  elapsedTime: number;
  networkTraffic: number;
  timestamp: number;
}
