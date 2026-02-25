import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

    console.log("Navegando para http://localhost:3000/#/licencas...");
    await page.goto('http://localhost:3000/#/licencas', { waitUntil: 'networkidle0' });

    console.log("Página carregada.");
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
