import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.argv[2] || 'http://127.0.0.1:8793/';
const output = new URL(process.argv[3] || './evidence/', import.meta.url);
await fs.mkdir(output, { recursive: true });
const started = performance.now();
const result = { url: base, checkedAt: new Date().toISOString(), browsers: [], layouts: [], accessibility: [] };
const mailto = 'mailto:info@goocampus.in?subject=Clinical%20programme%20partnership%20enquiry';

for (const [name, engine] of Object.entries({ chromium, webkit, firefox })) {
  const browser = await engine.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('requestfailed', req => errors.push(`${req.url()}: ${req.failure()?.errorText}`));
    page.on('response', res => { if (res.status() >= 400) errors.push(`${res.url()}: ${res.status()}`); });
    // Finish the chosen responsive resources before another resize/navigation can cancel them.
    // This layout/control suite settles imagery; carousel checks exercise actual lazy loading.
    const settleImages = () => page.locator('img').evaluateAll(images => Promise.all(images.map(async image => {
      image.loading = 'eager';
      await image.decode();
    })));
    await page.goto(base, { waitUntil: 'networkidle' });
    await settleImages();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.gc-primary').first().getAttribute('href'), mailto);
    assert.equal(await page.locator('[data-email-address]').textContent(), 'info@goocampus.in');
    assert.equal(await page.locator('#contact [data-email-address], #contact a[href^="tel:"]').count(), 0);
    assert.equal(await page.locator('#contact .gc-actions .gc-button').count(), 2);
    for (const id of ['programmes', 'how-it-works', 'questions', 'contact']) {
      await page.locator(`nav a[href="#${id}"]`).click();
      assert.equal(new URL(page.url()).hash, `#${id}`);
      assert.ok(await page.locator(`#${id}`).isVisible());
    }
    const summary = page.locator('details').nth(1).locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('details').nth(1).getAttribute('open'), '');
    assert.equal(await page.locator('.gc-faq details[open]').count(), 1);
    assert.equal(await page.locator('details').first().getAttribute('open'), null);
    // Opening a different answer closes the prior answer and preserves keyboard focus.
    const nextSummary = page.locator('details').nth(2).locator('summary');
    await nextSummary.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.gc-faq details[open]').count(), 1);
    assert.equal(await page.locator('details').nth(1).getAttribute('open'), null);
    assert.equal(await page.locator('details').nth(2).getAttribute('open'), '');
    await summary.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('details').nth(1).getAttribute('open'), null);
    const sizes = name === 'chromium' ? [320, 375, 390, 768, 1024, 1440] : [390, 1440];
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      // Verify the themed gradient survives real hover/pressed states in both themes.
      const primary = page.locator('.gc-primary').first();
      await primary.focus();
      await page.keyboard.press(name === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
      const focus = await page.locator(':focus-visible').evaluate(el => getComputedStyle(el).outlineColor);
      assert.equal(focus, theme === 'light' ? 'rgb(47, 111, 228)' : 'rgb(107, 155, 255)');
      const heading = await page.locator('#contact-title').evaluate(el => getComputedStyle(el).color);
      assert.equal(heading, theme === 'light' ? 'rgb(15, 42, 92)' : 'rgb(143, 179, 255)');

      const ends = theme === 'light' ? ['rgb(15, 42, 92)', 'rgb(47, 111, 228)'] : ['rgb(28, 63, 134)', 'rgb(58, 111, 214)'];
      for (const state of ['default', 'hover', 'active']) {
        if (state === 'hover') await primary.hover();
        if (state === 'active') await page.mouse.down();
        const style = await primary.evaluate(el => ({ background: getComputedStyle(el).backgroundImage, color: getComputedStyle(el).color }));
        assert.ok(ends.every(color => style.background.includes(color)), `${name}/${theme}/${state}: gradient lost`);
        assert.equal(style.color, 'rgb(255, 255, 255)');
        if (state === 'active') await page.mouse.move(0, 0);
        if (state === 'active') await page.mouse.up();
      }
      await page.mouse.move(0, 0);

      for (const width of sizes) {
        await page.setViewportSize({ width, height: 900 });
        await settleImages();
        const overflow = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth, root: document.body.scrollWidth }));
        assert.ok(overflow.page <= overflow.viewport && overflow.root <= overflow.viewport, `${name}/${theme}/${width}: ${JSON.stringify(overflow)}`);
        const address = await page.locator('[data-email-address]').boundingBox();
        assert.ok(address.x >= 0 && address.x + address.width <= width);
        const buttons = await page.locator('.gc-button, nav a, summary, .gc-network-link').evaluateAll(items => items.map(el => el.getBoundingClientRect().height));
        assert.ok(buttons.every(h => h >= 44));
        result.layouts.push({ browser: name, theme, width, overflow: false });
        if (name === 'chromium' && [390, 1440].includes(width)) {
          await page.goto(base, { waitUntil: 'networkidle' });
          await settleImages();
          await page.screenshot({ path: new URL(`./${theme}-${width}.png`, output).pathname, fullPage: true });
          await page.screenshot({ path: new URL(`./${theme}-${width}-first-view.png`, output).pathname });
          await page.locator('.gc-network').screenshot({ path: new URL(`./${theme}-${width}-network.png`, output).pathname });
          await page.locator('#how-it-works').screenshot({ path: new URL(`./${theme}-${width}-steps.png`, output).pathname });
          await page.locator('#contact').screenshot({ path: new URL(`./${theme}-${width}-contact.png`, output).pathname });
        }
      }
      const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      result.accessibility.push({ browser: name, theme, violations: a11y.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) })) });
      assert.deepEqual(a11y.violations, [], `${name}/${theme} accessibility violations`);
    }
    // 200% text enlargement, independent of responsive viewport emulation.
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await settleImages();
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('.gc-clinical-partnerships, .gc-clinical-partnerships *')) {
          el.dataset.gcQaFontSize = getComputedStyle(el).fontSize;
          el.dataset.gcQaLineHeight = getComputedStyle(el).lineHeight;
        }
        for (const el of document.querySelectorAll('[data-gc-qa-font-size]')) {
          el.style.fontSize = `${parseFloat(el.dataset.gcQaFontSize) * 2}px`;
          if (el.dataset.gcQaLineHeight !== 'normal') el.style.lineHeight = `${parseFloat(el.dataset.gcQaLineHeight) * 2}px`;
        }
      });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} 200% text at ${width}`);
      result.layouts.push({ browser: name, width, textScale: '200%', overflow: false });
      await page.goto(base, { waitUntil: 'networkidle' });
      await settleImages();
    }
    // Keyboard traversal: skip link first, visible ring and a working content jump.
    const keyboard = await context.newPage();
    await keyboard.goto(base);
    const tabKey = name === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
    await keyboard.keyboard.press(tabKey);
    assert.equal(await keyboard.evaluate(() => document.activeElement.textContent), 'Skip to content');
    assert.equal(await keyboard.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'solid');
    await keyboard.keyboard.press('Enter');
    assert.equal(await keyboard.evaluate(() => document.activeElement.id), 'main-content');
    const traversal = [];
    for (let i = 0; i < 32; i++) {
      await keyboard.keyboard.press(tabKey);
      traversal.push(await keyboard.evaluate(() => document.activeElement.tagName));
    }
    assert.ok(traversal.includes('SUMMARY') && traversal.includes('BUTTON'));
    await keyboard.close();
    if (name === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.bringToFront();
      await page.locator('[data-copy-email]').click();
      await page.waitForFunction(() => document.querySelector('[data-copy-status]').textContent === 'Email address copied');
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'info@goocampus.in');
    }
    // Clipboard succeeds and rejects without requesting or sending anything.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.gcCopied = value; } } }));
    await page.locator('[data-copy-email]').click();
    await page.waitForFunction(() => document.querySelector('[data-copy-status]').textContent === 'Email address copied');
    assert.equal(await page.evaluate(() => window.gcCopied), 'info@goocampus.in');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
    await page.locator('[data-copy-email]').click();
    await page.waitForFunction(() => document.querySelector('[data-copy-status]').textContent.startsWith('Copy is unavailable.'));
    assert.ok(await page.locator('[data-email-address]').isVisible());
    assert.deepEqual(errors, []);
    await context.close();
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
    const plain = await noJs.newPage();
    await plain.goto(base);
    assert.ok(await plain.locator('h1').isVisible());
    assert.equal(await plain.locator('.gc-primary').first().getAttribute('href'), mailto);
    assert.equal(await plain.locator('[data-copy-email]').isVisible(), false);
    await plain.locator('details').nth(2).locator('summary').click();
    assert.ok(await plain.locator('details').nth(2).locator('p').isVisible());
    assert.equal(await plain.locator('.gc-faq details[open]').count(), 1);
    await plain.locator('details').nth(3).locator('summary').click();
    assert.equal(await plain.locator('.gc-faq details[open]').count(), 1);
    assert.equal(await plain.locator('details').nth(2).getAttribute('open'), null);
    await noJs.close();
    result.browsers.push({ name, version: browser.version(), keyboard: 'passed', keyboardTabKey: tabKey, clipboardSuccessAndFallback: 'passed', nativeClipboard: name === 'chromium' ? 'passed' : 'not separately exercised', noJavaScript: 'passed', errors });
  } finally { await browser.close(); }
}
result.durationSeconds = Math.round((performance.now() - started) / 1000);
await fs.writeFile(new URL('./browser-results.json', output), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ browsers: result.browsers, layouts: result.layouts.length, durationSeconds: result.durationSeconds }));
