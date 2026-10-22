import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:8793/';
const output = new URL(process.argv[3] || './evidence/motion-local/', import.meta.url);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [label, width] of [['desktop', 1440], ['mobile', 390]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'no-preference', recordVideo: { dir: output.pathname, size: { width, height: 900 } } });
    const page = await context.newPage(); const video = page.video();
    await page.goto(base);
    await page.waitForTimeout(700);
    await page.locator('.gc-primary').first().hover(); await page.waitForTimeout(300);
    await page.mouse.move(0, 0);
    for (const target of ['#programmes', '#how-it-works', '#questions']) {
      await page.locator(target).scrollIntoViewIfNeeded(); await page.waitForTimeout(650);
    }
    await page.locator('details').nth(1).locator('summary').click(); await page.waitForTimeout(500);
    await page.locator('details').nth(1).locator('summary').click(); await page.waitForTimeout(300);
    await context.close();
    await video.saveAs(new URL(`${label}-motion.webm`, output).pathname);
    await video.delete();
  }
} finally { await browser.close(); }
console.log('Desktop/mobile motion clips captured');
