import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Page, Browser, Protocol } from 'puppeteer';
import { LRUCache } from 'lru-cache';
import { PageElement, ParseResult } from '../types';
import { ConfigService } from '@nestjs/config';
import { ParseDto } from '../dto/parse.dto';

enum PageType {
  default = 'default',
  Substack = 'Substack',
  Notion = 'Notion',
  NotionEmbed = 'NotionEmbed', // 1.country Notion embed
  WSJ = 'WSJ', // https://www.wsj.com
  twitter = 'twitter',
  superSo = 'superSo',
  weatherDotCom = 'weatherDotCom',
}

interface PageConfig {
  type: PageType;
  pageSelector?: string;
  pageUrl?: string;
  contentSelector: string;
}

const PAGE_CONFIGS = [
  {
    type: PageType.Notion,
    pageSelector: '#notion-app .notion-app-inner',
    contentSelector: 'h1, h2, h3, blockquote div, div[data-block-id] div',
  },
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
    pageUrl: 'https://www.wsj.com',
    contentSelector:
      '.article-container h1, .article-container h2, .article-container p, .layout-grid h1, .layout-grid h2, .layout-grid p, .crawler h1, .crawler h2, .crawler p',
  },
  {
    type: PageType.twitter,
    pageUrl: 'https://twitter.com',
    contentSelector: 'body div[dir="auto"] span',
  },
  {
    type: PageType.twitter,
    pageUrl: 'https://x.com',
    contentSelector: 'body div[dir="auto"] span',
  },
  {
    type: PageType.superSo,
    pageSelector: '.super-content-wrapper .super-content',
    contentSelector:
      '.super-content-wrapper .super-content .notion-semantic-string span',
  },
  {
    type: PageType.weatherDotCom,
    pageUrl: 'https://weather.com',
    contentSelector:
      '[data-testid="PresentationName"], [data-testid="DailyContent"]:first-child h3, [data-testid="DailyContent"]:first-child [data-testid="TemperatureValue"], [data-testid="DailyContent"]:first-child [data-testid="daypartName"], #todayDetails [data-testid="HeaderTitle"] h2, #todayDetails [data-testid="TemperatureValue"], [data-testid="DailyForecast"] h1 strong, [data-testid="ctaButton"] [class^="CalendarDateCell--tempHigh"] [data-testid="TemperatureValue"]',
  },
  {
    type: PageType.default,
    pageSelector: 'body',
    contentSelector: 'h1, h2, h3, body p, body ul li, table td, body span',
  },
];

interface PagePoolData {
  type: PageType;
  cookies: Protocol.Network.Cookie[];
}

@Injectable()
export class CrawlerService {
  viewportWith = 1024;
  viewportHeight = 1600;
  private readonly logger = new Logger(CrawlerService.name);
  private browser: Browser;
  private loggedPagesPool: LRUCache<PageType, PagePoolData> = new LRUCache({
    ttl: 1000 * 60 * 60 * 24,
    max: 100,
  });

  constructor(private readonly configService: ConfigService) {
    this.initBrowser();
  }

  private async getConfig(page: Page, pageUrl: string) {
    for (const c of PAGE_CONFIGS) {
      const urlExists = pageUrl.startsWith(c.pageUrl);
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
        timeout: 2000,
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

  private async signIn(dto: ParseDto, page: Page) {
    if (dto.url.includes('https://wsj.com')) {
      const username = dto.username || this.configService.get('wsj.username');
      const password = dto.password || this.configService.get('wsj.password');

      await page.addStyleTag({
        content: '{scroll-behavior: auto !important;}',
      });

      const loginLink = 'https://accounts.wsj.com/login';
      this.logger.log(`Login link: ${loginLink}`);
      await page.goto(loginLink);
      await page.waitForTimeout(6000);
      await page.waitForSelector('button.continue-submit');
      await page.waitForTimeout(3000);

      await page.waitForSelector('input#password-login-username');
      await page.type('input#password-login-username', username);

      await page.click('button.continue-submit');
      await page.waitForTimeout(2000);

      await page.waitForSelector('input#password-login-password');
      await page.type('input#password-login-password', password);

      const signIn = await page.waitForSelector(
        '.new-design.basic-login-submit',
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await page.evaluateHandle((el) => el.click(), signIn);
      await page.waitForSelector('main#main');
      // await page.goto(dto.url);
      // await page.waitForSelector('.article-container, .layout-grid, .crawler', {
      //   timeout: 10000,
      // });
      this.logger.log(`Logged in as ${username}`);
    }
  }

  private async getPageConfig(dto: ParseDto, page: Page) {
    const config = await this.getConfig(page, dto.url);
    if (config === null) {
      throw new Error(`Unknown page type: ${dto.url}`);
    }
    return config;
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

  private async getPage(dto: ParseDto) {
    if (dto.url.includes('wsj.com')) {
      const loggedPageData = this.loggedPagesPool.get(PageType.WSJ);
      if (loggedPageData) {
        this.logger.log(
          `Using page cookies with type ${loggedPageData.type} from logged pages pool`,
        );
        const page = await this.browser.newPage();
        await page.setCookie(...loggedPageData.cookies);
        return page;
      }
    }

    this.logger.log(`Created new page instance`);
    const page = await this.browser.newPage();

    // Set user agent for Twitter
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
    );

    await page.setViewport({
      width: this.viewportWith,
      height: this.viewportHeight,
    });

    await this.signIn(dto, page);

    return page;
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

    const page = await this.getPage(dto);
    let pageConfig: PageConfig;
    let errorMessage = '';

    try {
      page.on('response', addResponseSize);
      await page.goto(url, { waitUntil: 'load' });

      await page.waitForTimeout(2000); // For pages with redirects

      if (!url.includes('weather.com')) {
        await page.waitForNetworkIdle({ timeout: 10000 });
      }
      pageConfig = await this.getPageConfig(dto, page);

      this.logger.log(`Using parse config: ${JSON.stringify(pageConfig)}`);
      elements = await this.parse(page, pageConfig);
      page.off('response', addResponseSize);
    } catch (e) {
      this.logger.error(
        `Failed to fetch page content: ${(e as Error).message}`,
      );
      errorMessage = (e as Error).message || 'Unknown error';
    } finally {
      if (
        pageConfig &&
        pageConfig.type === PageType.WSJ &&
        elements.length > 0
      ) {
        const cookies = await page.cookies();
        this.loggedPagesPool.set(PageType.WSJ, {
          type: pageConfig.type,
          cookies,
        });
        this.logger.log(
          `Page with type "${pageConfig.type}" added to logged pages pool`,
        );
      }
      await page.close();
    }

    return {
      timestamp: Date.now(),
      elapsedTime: Date.now() - timeStart,
      networkTraffic,
      errorMessage,
      elementsCount: elements.length,
      elements,
    };
  }
}
