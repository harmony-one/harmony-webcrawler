export interface PageElement {
  text: string;
  tagName: string;
}

export interface ParseResponse {
  result: PageElement[];
  elapsedTime: number;
}
