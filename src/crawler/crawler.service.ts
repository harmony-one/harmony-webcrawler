import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Page, Browser } from 'puppeteer';
import { PageElement, ParseResult } from '../types';
import { ConfigService } from '@nestjs/config';

enum PageType {
  Substack = 'Substack',
  Notion = 'Notion',
  NotionEmbed = 'NotionEmbed', // 1.country Notion embed
}

interface PageConfig {
  type: PageType;
  pageSelector: string;
  contentSelector: string;
}

const PAGE_CONFIGS = [
  {
    type: PageType.NotionEmbed,
    pageSelector: 'div.notion',
    contentSelector: '.notion-page-content-inner *',
  },
  {
    type: PageType.Substack,
    pageSelector: 'div#entry div#main .available-content',
    contentSelector:
      '.available-content h2, .available-content p, .available-content ul li',
  },
];

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private browser: Browser;

  constructor(private readonly configService: ConfigService) {
    this.initBrowser();
  }

  private async getConfig(page: Page) {
    for (const c of PAGE_CONFIGS) {
      const selectorExists = await this.checkSelector(page, c.pageSelector);
      if (selectorExists) {
        return c;
      }
    }
    return null;
  }

  private async checkSelector(page: Page, selector: string) {
    try {
      await page.waitForSelector(selector, {
        timeout: 1000,
      });
    } catch (e) {
      return false;
    }
    return true;
  }

  private async parse(page: Page, config: PageConfig) {
    this.logger.log(`Parsing page type: ${config.type}`);
    const parsedElements: PageElement[] = [];
    const elements = await page.$$(config.contentSelector);

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

  private async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-features=site-per-process',
        ],
      });
      this.logger.log(`Browser instance initialized`);
    } catch (e) {
      this.logger.error(
        `Failed to create a browser instance: ${(e as Error).message}`,
      );
    }
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

    if (!this.browser) {
      await this.initBrowser();
    }

    try {
      const page = await this.browser.newPage();
      page.on('response', addResponseSize);
      await page.goto(url);
      await page.waitForNetworkIdle({ timeout: 5000 });
      elements = await this.parsePage(page, url);
      page.off('response', addResponseSize);
    } catch (e) {
      this.logger.error(
        `Failed to fetch page content: ${(e as Error).message}`,
      );
    } finally {
      // await this.browser.close();
      // this.logger.log(`Browser closed`);
    }
    return {
      elements,
      elapsedTime: Date.now() - timeStart,
      networkTraffic,
    };
  }
}
