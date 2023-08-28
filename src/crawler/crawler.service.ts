import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';
import { PageElement, ParseResult } from '../types';

enum PageType {
  Substack = "Substack",
  Notion = "Notion",
}

interface PageConfig {
  type: PageType;
  selector: string;
}

const PAGE_CONFIGS = [
  { type: PageType.Substack, selector: '.available-content h2, .available-content p, .available-content ul li' },
  { type: PageType.Notion, selector: '.notion-page-content-inner *' },
]

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  private async getConfig(page: Page) {
    for (const c of PAGE_CONFIGS) {
      const selectorExists = await this.checkSelector(page, c.selector);
      if (selectorExists) {
        return c;
      }c
    }
    return null;
  }

  private async checkSelector(page: Page, selector: string) {
    try {
      await page.waitForSelector(selector, {
        timeout: 10000,
      });
    } catch (e) {
      return false;
    }
    return true;
  }

  private async parse(page: Page, config: PageConfig) {
    this.logger.log(`Parsing page type: ${config.type}`);
    const parsedElements: PageElement[] = [];
    const elements = await page.$$(config.selector);

    for (const item of elements) {
      const text = await page.evaluate((el) => el.textContent, item);
      const tagName = await page.evaluate((el) => el.tagName, item);

      if (text) {
        parsedElements.push({
          text,
          tagName: tagName.toLowerCase(),
        });
      }
   }

    return parsedElements;
  }

  private async parsePage(page: Page, url: string) {
    const config = await this.getConfig(page);
    if (config === null) {
      throw new Error(`Unknown page type: ${url}`);
    }
    return await this.parse(page, config);
  }

  public async getPageData(url: string): Promise<ParseResult> {
    const timeStart = Date.now();
    let networkTraffic = 0;
    let elements: PageElement[] = [];

    async function addResponseSize(response) {
      try {
        const buffer = await response.buffer();
        networkTraffic += buffer.length;
      } catch {}
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-features=site-per-process',
      ],
    });

    try {
      const page = await browser.newPage();
      page.on('response', addResponseSize);
      await page.goto(url);
      await page.waitForNetworkIdle({ timeout: 10000 });
      elements = await this.parsePage(page, url);
      page.off('response', addResponseSize);
    } catch (e) {
      this.logger.error(
        `Failed to fetch page content: ${(e as Error).message}`,
      );
    } finally {
      await browser.close();
      this.logger.log(`Browser closed`);
    }
    return {
      elements,
      elapsedTime: Date.now() - timeStart,
      networkTraffic,
    };
  }
}
