import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';
import { PageElement, ParseResponse } from './types';

@Injectable()
export class AppService {
  constructor(private readonly logger: Logger) {
    // this.getPageData(
    //   'https://blog.harmony.one/p/harmony-year-of-efficiency-and-ai',
    // );
  }

  private async isSubstackIframe(page: Page) {
    try {
      await page.waitForSelector('div#entry div#main iframe', { timeout: 500 });
    } catch (e) {
      return false;
    }
    return true;
  }

  private async parseSubstackIframe(page: Page) {
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
    const isSubstackIframe = await this.isSubstackIframe(page);
    if (isSubstackIframe) {
      return this.parseSubstackIframe(page);
    }
    return [];
  }

  public async getPageData(url: string): Promise<ParseResponse> {
    const timeStart = Date.now();
    let networkTraffic = 0;
    let result: PageElement[] = [];

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
      await page.waitForNetworkIdle({ timeout: 1000 });
      result = await this.parsePage(page, url);
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
      result,
      elapsedTime: Date.now() - timeStart,
      networkTraffic,
    };
  }
}
