const { chromium } = require('playwright');

const originalLaunch = chromium.launch.bind(chromium);
chromium.launch = async function patchedLaunch(...args) {
  const browser = await originalLaunch(...args);
  const originalNewContext = browser.newContext.bind(browser);
  browser.newContext = async function patchedNewContext(...ctxArgs) {
    const context = await originalNewContext(...ctxArgs);
    const originalNewPage = context.newPage.bind(context);
    context.newPage = async function patchedNewPage(...pageArgs) {
      const page = await originalNewPage(...pageArgs);
      const originalGoto = page.goto.bind(page);
      page.goto = async function robustGoto(url, options = {}) {
        try {
          return await originalGoto(url, options);
        } catch (err) {
          const msg = String(err && err.message || err || '');
          if (!/ERR_ABORTED|Navigation interrupted|navigation.*interrupted|net::ERR_ABORTED/i.test(msg)) throw err;
          // Some Shopify/search pages intentionally redirect and abort the original navigation.
          // If the page moved, treat that redirect as success and wait for the resulting page.
          await page.waitForTimeout(350).catch(() => {});
          const current = page.url();
          if (current && current !== 'about:blank') {
            await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
            return null;
          }
          // If it did not move, retry once using the earliest reliable lifecycle event.
          return await originalGoto(url, { ...options, waitUntil: 'commit', timeout: options.timeout || 45000 });
        }
      };
      return page;
    };
    return context;
  };
  return browser;
};

require('./worker.js');
