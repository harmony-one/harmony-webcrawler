export interface PageElement {
  text: string;
  tagName: string;
}

export interface ParseResult {
  elapsedTime: number;
  networkTraffic: number;
  timestamp: number;
  elementsCount: number;
  elements: PageElement[];
}
