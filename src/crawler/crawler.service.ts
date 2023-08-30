import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Page, Browser } from 'puppeteer';
import { PageElement, ParseResult } from '../types';
import { ConfigService } from '@nestjs/config';
import { ParseDto } from '../dto/parse.dto';

enum PageType {
  Substack = 'Substack',
  Notion = 'Notion',
  NotionEmbed = 'NotionEmbed', // 1.country Notion embed
  WSJ = 'WSJ', // https://www.wsj.com
  default = 'default',
}

interface PageConfig {
  type: PageType;
  pageSelector: string;
  pageUrlSelector?: string;
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
  {
    type: PageType.WSJ,
    pageSelector: '',
    pageUrlSelector: 'https://www.wsj.com',
    contentSelector:
      '.article-container h1, .article-container h2, .crawler h1, .crawler h2, .crawler section p, .paywall p',
  },
  {
    type: PageType.default,
    pageSelector: 'body',
    contentSelector: 'body h1, body h2, body p, body ul li',
  },
];

@Injectable()
export class CrawlerService {
  viewportWith = 1024;
  viewportHeight = 1600;
  private readonly logger = new Logger(CrawlerService.name);
  private browser: Browser;

  constructor(private readonly configService: ConfigService) {
    this.initBrowser();
  }

  private async getConfig(page: Page, pageUrl: string) {
    for (const c of PAGE_CONFIGS) {
      const urlExists = pageUrl.startsWith(c.pageUrlSelector);
      if (urlExists) {
        return c;
      }
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

  private trimText(text: string) {
    return text.trim().replaceAll(/\n\s{2,}/g, '');
  }

  private async parse(page: Page, config: PageConfig) {
    this.logger.log(`Parsing page type: ${config.type}`);
    const parsedElements: PageElement[] = [];
    const elements = await page.$$(config.contentSelector);

    for (const item of elements) {
      const rawText = await page.evaluate((el) => el.textContent, item);
      const rawTagName = await page.evaluate((el) => el.tagName, item);

      const text = this.trimText(rawText || '');
      const tagName = this.trimText((rawTagName || '').toLowerCase());

      if (text) {
        parsedElements.push({
          text,
          tagName,
        });
      }
    }

    return parsedElements;
  }

  private async signIn(dto: ParseDto, page: Page, pageConfig: PageConfig) {
    if (pageConfig.type === PageType.WSJ) {
      const username = dto.username || this.configService.get('wsj.username');
      const password = dto.password || this.configService.get('wsj.password');

      await page.addStyleTag({
        content: '{scroll-behavior: auto !important;}',
      });
      await page.waitForSelector('header a');

      const textToFind = 'Sign In';
      const link = await page.evaluateHandle(
        (text) =>
          [...document.querySelectorAll('a')].find((a) => a.innerText === text),
        textToFind,
      );
      const href = await page.evaluate((el) => el.href, link);
      this.logger.log(`Login link: ${href}`);
      await page.goto(href);
      await page.waitForSelector('button.continue-submit');
      await page.waitForTimeout(1000);

      await page.waitForSelector('input#password-login-username');
      await page.type('input#password-login-username', username);

      await page.click('button.continue-submit');
      await page.waitForTimeout(1000);

      await page.waitForSelector('input#password-login-password');
      await page.type('input#password-login-password', password);

      const signIn = await page.waitForSelector(
        '.new-design.basic-login-submit',
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await page.evaluateHandle((el) => el.click(), signIn);
      await page.waitForSelector('.paywall');

      this.logger.log(`Logged in ${pageConfig.type} as ${username}`);
    }
  }

  private async parsePage(dto: ParseDto, page: Page) {
    const config = await this.getConfig(page, dto.url);
    if (config === null) {
      throw new Error(`Unknown page type: ${dto.url}`);
    }
    this.logger.log(`Using parse config: ${JSON.stringify(config)}`);
    await this.signIn(dto, page, config);
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
        defaultViewport: {
          width: this.viewportWith,
          height: this.viewportHeight,
        },
      });
      this.logger.log(`Browser instance initialized`);
    } catch (e) {
      this.logger.error(
        `Failed to create a browser instance: ${(e as Error).message}`,
      );
    }
  }

  public async getPageData(dto: ParseDto): Promise<ParseResult> {
    const { url } = dto;

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
      await page.setViewport({
        width: this.viewportWith,
        height: this.viewportHeight,
      });
      page.on('response', addResponseSize);
      await page.goto(url);
      await page.waitForTimeout(1000); // For pages with redirects
      await page.waitForNetworkIdle({ timeout: 10000 });
      elements = await this.parsePage(dto, page);
      page.off('response', addResponseSize);
      await page.close();
    } catch (e) {
      this.logger.error(
        `Failed to fetch page content: ${(e as Error).message}`,
      );
    }

    return {
      timestamp: Date.now(),
      elapsedTime: Date.now() - timeStart,
      networkTraffic,
      elementsCount: elements.length,
      elements,
    };
  }
}
