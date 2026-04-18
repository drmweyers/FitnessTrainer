import path from 'path';
import fs from 'fs';
import ejs from 'ejs';
import { PdfTemplateData } from './analyticsPdfData';

let templateCache: string | null = null;

function getTemplate(): string {
  if (templateCache) return templateCache;
  const templatePath = path.join(process.cwd(), 'lib', 'templates', 'analyticsPdfTemplate.ejs');
  templateCache = fs.readFileSync(templatePath, 'utf-8');
  return templateCache;
}

export async function renderPdf(data: PdfTemplateData): Promise<Buffer> {
  const template = getTemplate();
  const html = ejs.render(template, data);

  let chromium: any;
  let puppeteer: any;

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    chromium = (await import('@sparticuz/chromium')).default;
    puppeteer = (await import('puppeteer-core')).default;
  } else {
    puppeteer = (await import('puppeteer')).default;
  }

  const browser = await puppeteer.launch({
    args: chromium ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: chromium ? chromium.defaultViewport : { width: 1200, height: 800 },
    executablePath: chromium ? await chromium.executablePath() : undefined,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
