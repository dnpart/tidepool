const { chromium } = require('playwright');
(async () => {
  const [,, file, outp, width] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +(width||1040), height: 800 }, deviceScaleFactor: 2 });
  const [f, hash] = file.split('#'); await p.goto('file://' + require('path').resolve(f) + (hash ? '#' + hash : ''));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: outp, fullPage: true });
  await b.close();
})();
