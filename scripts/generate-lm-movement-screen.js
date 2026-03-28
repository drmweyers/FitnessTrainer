/**
 * EvoFit Trainer — Lead Magnet PDF Generator
 * Generates: The 5-Minute Movement Screen
 *
 * Usage: node scripts/generate-lm-movement-screen.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generate() {
  const htmlPath = path.resolve(__dirname, '../public/lead-magnets/5-minute-movement-screen.html');
  const pdfPath = path.resolve(__dirname, '../public/lead-magnets/5-minute-movement-screen.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found:', htmlPath);
    process.exit(1);
  }

  console.log('Reading HTML file...');
  const html = fs.readFileSync(htmlPath, 'utf8');

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();

    // Set viewport to A4 dimensions
    await page.setViewport({
      width: 794,   // A4 at 96 DPI
      height: 1123,
      deviceScaleFactor: 2
    });

    console.log('Loading HTML content...');
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for Google Fonts to load
    console.log('Waiting for fonts to load...');
    await new Promise(r => setTimeout(r, 3000));

    // Ensure fonts are loaded
    await page.evaluate(() => document.fonts.ready);

    console.log('Generating PDF...');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });

    const stats = fs.statSync(pdfPath);
    const fileSizeKB = Math.round(stats.size / 1024);

    console.log('');
    console.log('PDF generated successfully!');
    console.log(`   Path: ${pdfPath}`);
    console.log(`   Size: ${fileSizeKB} KB`);
    console.log('');

  } finally {
    await browser.close();
  }
}

generate().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
