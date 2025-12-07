const puppeteer = require("puppeteer");
(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 10000 });
    console.log(" Frontend is accessible");
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error(" Error:", err.message);
    process.exit(1);
  }
})();
