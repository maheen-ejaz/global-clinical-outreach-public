import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:8793/';
const output = new URL(process.argv[3] || './evidence/motion-local/', import.meta.url);
await fs.mkdir(output, { recursive: true });
const started = performance.now();
const result = { url: base, checkedAt: new Date().toISOString(), cases: [] };

const instrument = () => {
  window.gcMotionCalls = [];
  const native = Element.prototype.animate;
  Element.prototype.animate = function (frames, options) {
    const animation = native.call(this, frames, options);
    if (options?.id === 'gc-partnership-section') {
      window.gcMotionCalls.push({ target: this.getAttribute('aria-labelledby'), frames, duration: options.duration, iterations: options.iterations, fill: options.fill });
    }
    return animation;
  };
};
const assertReadable = async page => {
  const state = await page.locator('main > .gc-card').evaluateAll(cards => cards.map(card => {
    const s = getComputedStyle(card);
    return { opacity: s.opacity, visibility: s.visibility, display: s.display };
  }));
  assert.ok(state.every(s => s.opacity === '1' && s.visibility === 'visible' && s.display !== 'none'));
};
const finish = page => page.waitForFunction(() => !document.getAnimations().some(a => a.playState === 'running'));
const sectionRunning = page => page.waitForFunction(() => document.getAnimations().some(a => a.id === 'gc-partnership-section' && a.playState === 'running'));

for (const [name, engine] of Object.entries({ chromium, webkit, firefox })) {
  const browser = await engine.launch();
  try {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ reducedMotion: 'no-preference', colorScheme: theme, viewport: { width: 1440, height: 900 } });
      await context.addInitScript(instrument);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await sectionRunning(page);
      await assertReadable(page);
      const keys = await page.evaluate(() => window.gcMotionCalls.flatMap(call => call.frames.flatMap(frame => Object.keys(frame))));
      assert.ok(keys.every(key => key === 'transform'), 'Section motion must preserve text opacity and layout properties');
      await finish(page);
      const calls = await page.evaluate(() => window.gcMotionCalls);
      assert.ok(calls.length > 0 && calls.every(call => call.duration === 420 && call.iterations === 1 && call.fill === 'none'));
      await page.locator('.gc-skip').focus();
      const skip = await page.locator('.gc-skip').evaluate(el => ({ y: el.getBoundingClientRect().y, transitions: getComputedStyle(el).transitionProperty }));
      assert.ok(skip.y >= 0, 'Skip link must be fully on screen immediately on focus');
      assert.ok(!skip.transitions.split(',').some(property => property.trim() === 'transform'));

      // Fine-pointer feedback stays inside the existing control geometry.
      const arrow = page.locator('.gc-primary').first().locator('span');
      const before = await page.locator('.gc-primary').first().boundingBox();
      await page.locator('.gc-primary').first().hover();
      await finish(page);
      assert.equal(await arrow.evaluate(el => Math.round(new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)), 2);
      const after = await page.locator('.gc-primary').first().boundingBox();
      assert.equal(after.width, before.width);
      assert.equal(after.height, before.height);
      await page.mouse.move(0, 0);
      await finish(page);

      // Sections animate once, including under repeated forward/backward scroll.
      const cards = page.locator('main > .gc-card');
      for (let i = 0; i < await cards.count(); i++) {
        const label = await cards.nth(i).getAttribute('aria-labelledby');
        await cards.nth(i).scrollIntoViewIfNeeded();
        await page.waitForFunction(target => window.gcMotionCalls.some(call => call.target === target), label);
        await finish(page);
      }
      const once = await page.evaluate(() => window.gcMotionCalls.length);
      assert.equal(once, await cards.count());
      await page.evaluate(() => scrollTo(0, 0));
      await page.locator('#contact').scrollIntoViewIfNeeded();
      await finish(page);
      assert.equal(await page.evaluate(() => window.gcMotionCalls.length), once);

      // Native FAQ still owns disclosure; only its indicator/answer settle.
      const faq = page.locator('details').nth(1);
      await faq.locator('summary').click();
      assert.equal(await faq.getAttribute('open'), '');
      await assertReadable(page);
      await finish(page);
      const indicator = await faq.locator('.gc-disclosure').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el, '::after').transform).a);
      assert.equal(indicator, 1);
      await faq.locator('summary').click();
      await finish(page);
      assert.equal(await faq.getAttribute('open'), null);

      // A live preference change cancels section motion and removes CSS motion.
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await sectionRunning(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await finish(page);
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
      await assertReadable(page);
      await page.locator('.gc-primary').first().hover();
      assert.equal(await arrow.evaluate(el => getComputedStyle(el).transform), 'none');
      await page.locator('details').nth(1).locator('summary').click();
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
      await context.close();

      // A reduced-motion first load never starts section animations.
      const reduced = await browser.newContext({ reducedMotion: 'reduce', colorScheme: theme });
      await reduced.addInitScript(instrument);
      const staticPage = await reduced.newPage();
      await staticPage.goto(base, { waitUntil: 'networkidle' });
      assert.equal(await staticPage.evaluate(() => window.gcMotionCalls.length), 0);
      await staticPage.locator('#contact').scrollIntoViewIfNeeded();
      assert.equal(await staticPage.evaluate(() => document.getAnimations().length), 0);
      await assertReadable(staticPage);
      await reduced.close();
      assert.deepEqual(errors, []);
      result.cases.push({ browser: name, theme, oneTimeSections: once, fullOpacity: true, reducedFirstLoad: true, liveReduction: true, nativeFaq: true, arrowFeedback: true, instantSkipLink: true });
    }

    // The enhancement is optional; native content/control behavior survives missing APIs.
    for (const missing of ['IntersectionObserver', 'animate', 'preferenceListener']) {
      const context = await browser.newContext({ reducedMotion: 'no-preference' });
      await context.addInitScript(key => {
        if (key === 'IntersectionObserver') window.IntersectionObserver = undefined;
        else if (key === 'animate') Element.prototype.animate = undefined;
        else MediaQueryList.prototype.addEventListener = undefined;
      }, missing);
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      await assertReadable(page);
      await page.locator('details').nth(1).locator('summary').click();
      assert.ok(await page.locator('details').nth(1).locator('p').isVisible());
      assert.deepEqual(errors, []);
      await context.close();
      result.cases.push({ browser: name, missingApi: missing, readableNativeFallback: true });
    }
    const focused = await browser.newContext({ reducedMotion: 'no-preference' });
    await focused.addInitScript(instrument);
    await focused.addInitScript(() => {
      // Establish focus during parsing, before any deferred enhancement can run.
      const watcher = new MutationObserver(() => {
        const link = document.querySelector('.gc-primary');
        if (!link) return;
        link.focus({ preventScroll: true });
        watcher.disconnect();
      });
      watcher.observe(document, { childList: true, subtree: true });
    });
    const keyboardPage = await focused.newPage();
    await keyboardPage.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await keyboardPage.locator('.gc-hero').evaluate(el => getComputedStyle(el).transform), 'none');
    assert.equal(await keyboardPage.evaluate(() => window.gcMotionCalls.some(call => call.target === 'partnership-title')), false);
    await focused.close();
    result.cases.push({ browser: name, focusedSection: 'hero', moved: false });
    const during = await browser.newContext({ reducedMotion: 'no-preference' });
    const duringPage = await during.newPage();
    await duringPage.goto(base, { waitUntil: 'domcontentloaded' });
    await duringPage.waitForFunction(() => document.querySelector('.gc-hero').getAnimations().some(a => a.id === 'gc-partnership-section' && a.playState === 'running'));
    await duringPage.locator('.gc-primary').first().focus();
    await duringPage.waitForFunction(() => !document.querySelector('.gc-hero').getAnimations().some(a => a.id === 'gc-partnership-section' && a.playState === 'running'));
    assert.equal(await duringPage.locator('.gc-hero').evaluate(el => getComputedStyle(el).transform), 'none');
    await during.close();
    result.cases.push({ browser: name, focusDuringSectionMotion: 'cancelled immediately' });
    // Simulate browser lifecycle events without changing the operating system/tab settings.
    const lifecycle = await browser.newContext({ reducedMotion: 'no-preference' });
    await lifecycle.addInitScript(instrument);
    const lifecyclePage = await lifecycle.newPage();
    await lifecyclePage.goto(base, { waitUntil: 'domcontentloaded' });
    await sectionRunning(lifecyclePage);
    await lifecyclePage.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await lifecyclePage.evaluate(() => document.getAnimations().some(a => a.id === 'gc-partnership-section' && a.playState === 'running')), false);
    await assertReadable(lifecyclePage);
    const hiddenCalls = await lifecyclePage.evaluate(() => window.gcMotionCalls.length);
    await lifecyclePage.locator('#programmes').scrollIntoViewIfNeeded();
    await lifecyclePage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await lifecyclePage.evaluate(() => window.gcMotionCalls.length), hiddenCalls);
    await lifecyclePage.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await sectionRunning(lifecyclePage);
    await lifecyclePage.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    assert.equal(await lifecyclePage.evaluate(() => document.getAnimations().some(a => a.id === 'gc-partnership-section' && a.playState === 'running')), false);
    const beforeReturn = await lifecyclePage.evaluate(() => window.gcMotionCalls.length);
    await lifecyclePage.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await lifecyclePage.locator('#contact').scrollIntoViewIfNeeded();
    await lifecyclePage.waitForFunction(() => window.gcMotionCalls.some(call => call.target === 'contact-title'));
    await finish(lifecyclePage);
    assert.ok(await lifecyclePage.evaluate(() => window.gcMotionCalls.length) > beforeReturn);
    const targets = await lifecyclePage.evaluate(() => window.gcMotionCalls.map(call => call.target));
    assert.equal(new Set(targets).size, targets.length);
    await lifecycle.close();
    result.cases.push({ browser: name, lifecycle: 'simulated visibility/pagehide/persisted pageshow', cancellationAndResume: true, replayed: false });
  } finally { await browser.close(); }
}

// Touch must not acquire persistent hover motion after a tap.
const touchBrowser = await chromium.launch();
try {
  const context = await touchBrowser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  const page = await context.newPage(); await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('.gc-text-action').tap(); await finish(page);
  assert.equal(await page.locator('.gc-text-action span').evaluate(el => getComputedStyle(el).transform), 'none');
  await context.close();
  result.cases.push({ browser: 'chromium', touch: true, persistentHoverMotion: false });
} finally { await touchBrowser.close(); }

result.durationSeconds = Math.round((performance.now() - started) / 1000);
await fs.writeFile(new URL('motion-results.json', output), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ motionCases: result.cases.length, durationSeconds: result.durationSeconds }));
