const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--enable-unsafe-swiftshader']
  });
  
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  // Inject a trialing subscription state so we can see the full UI
  await page.addInitScript(() => {
    const trialEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('jl_sub', JSON.stringify({ status: 'trialing', validUntil: trialEnd, plan: 'trial' }));
  });

  await page.goto('http://localhost:3002');
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('URL:', url);
  const text = await page.textContent('body');
  console.log('Page contains login?', text.includes('Sign in') || url.includes('login'));
  
  await page.screenshot({ path: '/tmp/ui-home.png' });
  console.log('Done - screenshot at /tmp/ui-home.png');
  
  await browser.close();
})();
