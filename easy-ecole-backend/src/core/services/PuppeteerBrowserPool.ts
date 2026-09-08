let browserPromise: Promise<any> | null = null;

export async function getPuppeteerBrowser(): Promise<any> {
  if (!browserPromise) {
    browserPromise = import('puppeteer').then((module: any) => {
      const puppeteer = module.default ?? module;
      return puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }).catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  return browserPromise;
}