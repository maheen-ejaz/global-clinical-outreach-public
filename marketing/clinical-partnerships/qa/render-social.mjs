import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:8793/';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(base);
  await page.setContent(`<!doctype html><html lang="en"><head><style>
    @font-face {font-family: GCInter; src: url('${base}assets/fonts/inter-latin-500.woff2'); font-weight:500;}
    @font-face {font-family: GCInterTight; src: url('${base}assets/fonts/inter-tight-latin-600.woff2'); font-weight:600;}
    * {box-sizing:border-box;} body {margin:0;background:#f7f7f8;color:#18181b;padding:48px;font:500 24px/32px GCInter,sans-serif;}
    main {border:1px solid #d6d6db;border-radius:12px;background:white;padding:48px;height:534px;display:flex;flex-direction:column;justify-content:space-between;}
    header {display:flex;align-items:center;gap:16px;} img {width:72px;height:72px;} h1 {margin:0;max-width:800px;font:600 64px/61px GCInterTight,sans-serif;letter-spacing:-.02em;} p {margin:0;color:#71717a;} footer {border-top:1px solid #e7e7ea;padding-top:24px;display:flex;justify-content:space-between;}
  </style></head><body><main><header><img src="${base}assets/images/goocampus-logo.png" alt="GooCampus"><span>GooCampusWorld</span></header><h1>Clinical programme<br>partnerships.</h1><footer><p>Let’s start with a conversation.</p><span>↗</span></footer></main></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL('../assets/images/partnership-social.png', import.meta.url).pathname });
} finally { await browser.close(); }
