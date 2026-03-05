const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/shop');
  
  // Wait for sidebar to render
  await page.waitForSelector('.sticky');
  
  const badParents = await page.evaluate(() => {
    const el = document.querySelector('.sticky');
    let current = el.parentElement;
    const issues = [];
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      if (style.overflow !== 'visible' || style.overflowX !== 'visible' || style.overflowY !== 'visible') {
        issues.push({
          tag: current.tagName,
          className: current.className,
          overflow: style.overflow,
          overflowX: style.overflowX,
          overflowY: style.overflowY
        });
      }
      current = current.parentElement;
    }
    return issues;
  });
  
  console.log("Parents with overflow issues:", badParents);
  await browser.close();
})();
