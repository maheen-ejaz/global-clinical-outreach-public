import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const base = process.argv[2] || 'http://127.0.0.1:8793/';
const output = new URL(process.argv[3] || './evidence/carousel-local/', import.meta.url);
await fs.mkdir(output, { recursive: true });
const started = performance.now();
const result = { url: base, checkedAt: new Date().toISOString(), cases: [] };
const atEnd = page => page.waitForFunction(() => {
  const t = document.querySelector('.gc-carousel-track'); return t.scrollLeft >= t.scrollWidth - t.clientWidth - 1;
}, null, { polling: 50 });
const atStart = page => page.waitForFunction(() => document.querySelector('.gc-carousel-track').scrollLeft <= 1, null, { polling: 50 });
const pollNative = async check => {
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.fail('Native no-JS scroll did not reach the expected position');
};

for (const [name, engine] of Object.entries({ chromium, webkit, firefox })) {
  const browser = await engine.launch();
  try {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ colorScheme: theme, reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('requestfailed', r => errors.push(r.url()));
      await page.goto(base, { waitUntil: 'networkidle' });
      const section = page.locator('#listing-preview'), track = page.locator('.gc-carousel-track');
      const previous = page.locator('[data-carousel-prev]'), next = page.locator('[data-carousel-next]');
      assert.equal(await page.locator('.gc-demo-card').count(), 4);
      assert.equal(await page.locator('.gc-demo-label').allTextContents().then(x => x.every(t => t === 'Example')), true);
      assert.match(await page.locator('#programme-preview-note').textContent(), /fictional.*illustrative/);
      await section.scrollIntoViewIfNeeded();
      assert.equal(await previous.getAttribute('aria-disabled'), 'true');
      await next.focus(); await page.keyboard.press('Enter');
      try { await atEnd(page); } catch (error) {
        console.error(JSON.stringify({ browser: name, theme, errors, state: await track.evaluate(el => ({ left: el.scrollLeft, maximum: el.scrollWidth - el.clientWidth, focused: document.activeElement?.outerHTML, hidden: document.hidden })) }));
        throw error;
      }
      await page.waitForFunction(() => document.querySelector('[data-carousel-next]').getAttribute('aria-disabled') === 'true');
      assert.equal(await next.getAttribute('aria-disabled'), 'true');
      assert.match(await page.locator('[data-carousel-status]').textContent(), /4 of 4/);
      assert.equal(await next.evaluate(el => document.activeElement === el), true, 'End control must retain keyboard focus');
      await next.dispatchEvent('click'); await atEnd(page);
      await previous.click(); await atStart(page);
      await next.focus();
      await page.keyboard.press(name === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
      assert.equal(await track.evaluate(el => document.activeElement === el), true);
      await page.keyboard.press('ArrowRight');
      assert.equal(await track.evaluate(el => getComputedStyle(el).outlineColor === (getComputedStyle(document.body).getPropertyValue('--accent').trim() === '#2f6fe4' ? 'rgb(47, 111, 228)' : 'rgb(107, 155, 255)')), true, 'Focus ring must use the enabled blue accent role');
      await page.waitForFunction(() => document.querySelector('.gc-carousel-track').scrollLeft > 1);
      assert.equal(await track.evaluate(el => document.activeElement === el), true);
      await page.keyboard.press('End'); await atEnd(page);
      await page.keyboard.press('Home'); await atStart(page);
      await page.waitForFunction(() => document.querySelector('[data-carousel-status]').textContent.startsWith('Showing 1'));
      await page.evaluate(() => {
        window.gcQaStatusWrites = 0;
        window.gcQaStatusObserver = new MutationObserver(() => window.gcQaStatusWrites++);
        window.gcQaStatusObserver.observe(document.querySelector('[data-carousel-status]'), { childList: true, subtree: true, characterData: true });
        window.scrollBy(0, 20);
      });
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => { window.gcQaStatusObserver.disconnect(); return window.gcQaStatusWrites; }), 0, 'Vertical scrolling must not repeat unchanged live status');
      const sizes = name === 'chromium' ? [320,375,390,768,1024,1440] : [390,1440];
      for (const width of sizes) {
        await page.setViewportSize({ width, height: 1000 });
        await track.evaluate(el => { el.scrollLeft = 0; }); await atStart(page);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}/${theme}/${width} page overflow`);
        assert.ok(await track.evaluate(el => el.scrollWidth > el.clientWidth));
        for (const image of await page.locator('.gc-demo-media img').all()) await image.evaluate(el => el.decode());
        assert.ok(await page.locator('.gc-demo-media img').evaluateAll(images => images.every(image => image.naturalWidth > 0 && image.alt.trim().length > 0)));
        assert.ok(await page.locator('.gc-carousel-controls button').evaluateAll(buttons => buttons.every(button => button.getBoundingClientRect().height >= 44)));
        await track.focus(); await page.keyboard.press('End'); await atEnd(page);
        assert.ok(await page.locator('.gc-demo-card').last().evaluate(el => {
          const t = el.parentElement.getBoundingClientRect(), c = el.getBoundingClientRect(); return c.right <= t.right + 1 && c.left >= t.left - 1;
        }), 'Last card must be fully reachable');
        await page.keyboard.press('Home'); await atStart(page);
        if (name === 'chromium' && [390,1440].includes(width)) {
          await section.screenshot({ path: new URL(`${theme}-${width}.png`, output).pathname });
        }
        result.cases.push({ browser: name, theme, width, navigation: true, reachableLastCard: true, noPageOverflow: true, images: true });
      }
      const a11y = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      assert.deepEqual(a11y.violations, [], `${name}/${theme} accessibility`);
      // Text enlargement must preserve the card content and native scroll reachability.
      await page.setViewportSize({ width: 320, height: 1000 });
      await page.evaluate(() => {
        const items = [...document.querySelectorAll('#listing-preview, #listing-preview *')].map(el => ({ el, size: parseFloat(getComputedStyle(el).fontSize), line: getComputedStyle(el).lineHeight }));
        items.forEach(({el,size,line}) => { el.style.fontSize = `${size*2}px`; if (line !== 'normal') el.style.lineHeight = `${parseFloat(line)*2}px`; });
      });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await track.focus(); await page.keyboard.press('End'); await atEnd(page);
      assert.match(await page.locator('.gc-demo-card').last().textContent(), /US\$1,400.*per month/s);
      assert.deepEqual(errors, []);
      result.cases.push({ browser: name, theme, textScale: '200%', allDataRetained: true, axeViolations: 0, quietUnchangedLiveStatus: true });
      await context.close();
    }
    // Native horizontal scrolling and content survive without JavaScript.
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } });
    const plain = await noJs.newPage(); await plain.goto(base);
    assert.equal(await plain.locator('[data-carousel-controls]').isVisible(), false);
    await plain.locator('.gc-carousel-track').focus();
    await plain.keyboard.press('ArrowRight');
    await pollNative(() => plain.locator('.gc-carousel-track').evaluate(el => el.scrollLeft > 0));
    await plain.locator('.gc-carousel-track').evaluate(el => { el.scrollLeft = el.scrollWidth; });
    await pollNative(() => plain.locator('.gc-carousel-track').evaluate(el => el.scrollLeft >= el.scrollWidth - el.clientWidth - 1));
    assert.ok(await plain.locator('.gc-demo-card').last().isVisible());
    await noJs.close();
    result.cases.push({ browser: name, noJavaScript: true, readableScrollableCards: true });
    const unsupported = await browser.newContext();
    await unsupported.addInitScript(() => { MediaQueryList.prototype.addEventListener = undefined; });
    const fallback = await unsupported.newPage(); const failures = []; fallback.on('pageerror', e => failures.push(e.message));
    await fallback.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await fallback.locator('[data-carousel-controls]').isVisible(), false);
    assert.deepEqual(failures, []);
    await unsupported.close();
    result.cases.push({ browser: name, missingPreferenceListener: true, nativeFallback: true });
    // Simulate WebKit's late offscreen overflow metrics before the reader reaches the section.
    const late = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
    await late.addInitScript(() => {
      const native = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollWidth');
      Object.defineProperty(Element.prototype, 'scrollWidth', { configurable: true, get() {
        return this.classList?.contains('gc-carousel-track') && window.scrollY === 0 ? this.clientWidth : native.get.call(this);
      }});
    });
    const revealed = await late.newPage(); await revealed.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await revealed.locator('[data-carousel-next]').getAttribute('aria-disabled'), 'true');
    await revealed.locator('#listing-preview').scrollIntoViewIfNeeded();
    await revealed.locator('[data-carousel-next]').focus();
    assert.equal(await revealed.locator('[data-carousel-next]').getAttribute('aria-disabled'), 'false');
    await revealed.keyboard.press('Enter'); await atEnd(revealed);
    await late.close();
    result.cases.push({ browser: name, lateOffscreenLayout: true, nextUsableAfterReveal: true });
  } finally { await browser.close(); }
}

// Smooth user-triggered navigation can be stopped by a live reduced-motion change.
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  const page = await context.newPage(); await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#listing-preview').scrollIntoViewIfNeeded();
  await page.locator('.gc-carousel-track').focus(); await page.keyboard.press('End');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.gc-carousel-track').focus(); await page.keyboard.press('End'); await atEnd(page);
  await page.keyboard.press('Home'); await atStart(page);
  assert.equal(await page.locator('.gc-carousel-track').evaluate(el => el.scrollLeft), 0);
  await context.close();
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const p = await touch.newPage(); await p.goto(base, { waitUntil: 'networkidle' });
  await p.locator('#listing-preview').scrollIntoViewIfNeeded();
  const bounds = await p.locator('.gc-carousel-track').boundingBox();
  const cdp = await touch.newCDPSession(p);
  await cdp.send('Input.synthesizeScrollGesture', { x: bounds.x + bounds.width * 0.8, y: Math.max(100, bounds.y + 90), xDistance: -190, yDistance: 0, gestureSourceType: 'touch', speed: 500 });
  await p.waitForFunction(() => document.querySelector('.gc-carousel-track').scrollLeft > 0);
  assert.ok(await p.locator('.gc-carousel-track').evaluate(el => getComputedStyle(el).overflowX === 'auto' && getComputedStyle(el).scrollSnapType.includes('x')));
  await touch.close();
  result.cases.push({ browser: 'chromium', liveReducedMotion: true, nativeTouchSwipe: true });
} finally { await browser.close(); }
result.durationSeconds = Math.round((performance.now()-started)/1000);
await fs.writeFile(new URL('carousel-results.json',output),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({ carouselCases: result.cases.length, durationSeconds: result.durationSeconds }));
