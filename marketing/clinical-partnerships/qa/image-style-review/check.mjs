import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const output = new URL('./evidence/', import.meta.url);
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const cases = [], errors = [];
const started = performance.now();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url() + ': ' + response.status()); });
  await page.goto('http://localhost:8793/qa/image-style-review/', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.review-option').count(), 5);
  for (const theme of ['light', 'dark']) {
    await page.locator('[data-theme-choice="' + theme + '"]').click();
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const image of await page.locator('.review-option > img').all()) await image.evaluate(element => element.decode());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok(await page.locator('button').evaluateAll(buttons => buttons.every(button => button.getBoundingClientRect().height >= 44)));
      for (const key of ['documentary', 'architecture', 'portrait', 'monochrome', 'illustration']) {
        await page.locator('[data-style="' + key + '"]').click();
        for (const image of await page.locator('[data-preview-image]').all()) await image.evaluate(element => element.decode());
        assert.equal(await page.locator('[data-preview-image]').first().evaluate(element => element.src.endsWith('/' + document.querySelector('[data-style][aria-pressed="true"]').dataset.style + '.webp')), true);
        assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-context-title')), true);
      }
      await page.locator('#review-direction').selectOption('portrait');
      assert.match(await page.locator('[data-context-title]').textContent(), /Faculty portrait/);
      await page.locator('#review-direction').selectOption('illustration');
      assert.match(await page.locator('[data-context-title]').textContent(), /Architectural ink/);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations, []);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: new URL(theme + '-' + width + '.png', output).pathname, fullPage: true });
      cases.push({ theme, width, directions: 5, imagesDecoded: true, contextSwitch: true, keyboardFocus: true, noOverflow: true, axeViolations: 0 });
    }
  }
  await page.locator('[data-style="documentary"]').focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('[data-context-title]').textContent(), /Clinical documentary/);
  assert.deepEqual(errors, []);
  await context.close();
  const plain = await browser.newContext({ javaScriptEnabled: false });
  const native = await plain.newPage();
  await native.goto('http://localhost:8793/qa/image-style-review/');
  assert.equal(await native.locator('.review-option').count(), 5);
  assert.equal(await native.locator('[data-style]').first().isVisible(), false);
  assert.equal(await native.locator('a[href="images/illustration.webp"]').getAttribute('href'), 'images/illustration.webp');
  await plain.close();
  await fs.writeFile(new URL('results.json', output), JSON.stringify({ checkedAt: new Date().toISOString(), cases, errors, noJavaScriptImagesAndLinks: true, durationSeconds: Math.round((performance.now() - started) / 1000) }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: cases.length, directions: 5, errors }));
} finally { await browser.close(); }
