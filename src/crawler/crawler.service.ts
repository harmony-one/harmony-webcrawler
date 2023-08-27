import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';
import { PageElement, ParseResult } from '../types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  constructor(private readonly configService: ConfigService) {}

  private async isSubstack(page: Page) {
    try {
      await page.waitForSelector('div#entry div#main .available-content', {
        timeout: 10000,
      });
    } catch (e) {
      return false;
    }
    return true;
  }

  private async parseSubstack(page: Page) {
    const parsedElements: PageElement[] = [];
    const selector =
      '.available-content h2, .available-content p, .available-content ul li';
    const elements = await page.$$(selector);

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
    const isSubstack = await this.isSubstack(page);
    if (isSubstack) {
      return this.parseSubstack(page);
    }
    return [];
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
