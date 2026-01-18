# Story 010-06: Generate Invoices

**Parent Epic**: [EPIC-010 - Payment & Billing](../epics/epic-010-payment-billing.md)
**Story ID**: STORY-010-06
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 12

## User Story
**As a** user (trainer or client)
**I want to** receive automated invoices
**So that I** have accurate payment records for my business or taxes

## Acceptance Criteria
- [ ] Automatic invoice generation on payment
- [ ] Customizable invoice templates
- [ ] Trainer can add company branding/logo
- [ ] Automatic tax calculations
- [ ] Multi-language invoice support
- [ ] PDF generation and download
- [ ] Automatic email delivery to clients
- [ ] Complete invoice history
- [ ] Invoice status tracking (draft, sent, paid, overdue)
- [ ] Invoice numbering system
- [ ] Line item details with descriptions
- [ ] Payment instructions included

## Technical Implementation

### Frontend Tasks
1. **Create InvoiceManager Component**
   - List of all invoices with filters
   - Status indicators (draft, sent, paid, overdue)
   - Search and sort functionality
   - Quick actions (view, download, resend)

2. **Create InvoiceViewer Component**
   - Display invoice in professional format
   - Show payment status
   - Line item breakdown
   - Tax breakdown
   - Download PDF button
   - Email invoice button

3. **Create InvoiceSettings Component**
   - Company information form
   - Logo upload
   - Template selection
   - Invoice prefix settings
   - Tax configuration
   - Payment terms configuration
   - Language selection

4. **Create InvoicePreview Component**
   - Real-time preview of invoice
   - Editable fields
   - Template selection preview
   - Mobile-friendly preview

### Backend Tasks
1. **Create Invoice Endpoints**
   ```typescript
   GET  /api/billing/invoices - List invoices
   GET  /api/billing/invoices/:id - Get invoice details
   POST /api/billing/invoices - Create manual invoice
   PUT  /api/billing/invoices/:id - Update invoice
   DELETE /api/billing/invoices/:id - Delete invoice
   GET  /api/billing/invoices/:id/pdf - Get invoice PDF
   POST /api/billing/invoices/:id/send - Email invoice
   GET  /api/billing/invoices/settings - Get invoice settings
   PUT  /api/billing/invoices/settings - Update settings
   POST /api/billing/invoices/generate - Batch generate invoices
   ```

2. **Implement InvoiceService**
   ```typescript
   class InvoiceService {
     // Invoice CRUD
     async createInvoice(data: CreateInvoiceDto, trainerId: string): Promise<Invoice>
     async getInvoice(invoiceId: string, userId: string): Promise<Invoice>
     async updateInvoice(invoiceId: string, data: UpdateInvoiceDto, userId: string): Promise<Invoice>
     async deleteInvoice(invoiceId: string, userId: string): Promise<void>
     async listInvoices(filters: InvoiceFilters): Promise<Invoice[]>

     // PDF generation
     async generateInvoicePDF(invoiceId: string): Promise<Buffer>
     async getInvoicePDF(invoiceId: string): Promise<Buffer>
     async saveInvoicePDF(invoiceId: string): Promise<string>

     // Email delivery
     async sendInvoice(invoiceId: string, recipientEmail?: string): Promise<void>
     async resendInvoice(invoiceId: string): Promise<void>
     async markInvoiceAsSent(invoiceId: string): Promise<void>

     // Automatic generation
     async generateInvoiceForTransaction(transactionId: string): Promise<Invoice>
     async generateInvoiceForSubscription(subscriptionId: string): Promise<Invoice>
     async generateBatchInvoices(trainerId: string, period: DateRange): Promise<Invoice[]>

     // Settings
     async getInvoiceSettings(trainerId: string): Promise<InvoiceSettings>
     async updateInvoiceSettings(trainerId: string, settings: UpdateInvoiceSettingsDto): Promise<InvoiceSettings>
     async uploadInvoiceLogo(trainerId: string, file: Express.Multer.File): Promise<string>

     // Numbering
     async generateInvoiceNumber(trainerId: string): Promise<string>
   }
   ```

3. **PDF Generation Service**
   ```typescript
   class PDFGenerationService {
     async generateInvoicePDF(invoice: Invoice, settings: InvoiceSettings): Promise<Buffer> {
       const template = await this.loadTemplate(settings.templateId);
       const html = this.renderInvoiceHTML(invoice, settings, template);

       const pdf = await this.convertHTMLToPDF(html, {
         format: 'A4',
         margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
         displayHeaderFooter: true,
         headerTemplate: this.getHeaderTemplate(settings),
         footerTemplate: this.getFooterTemplate(settings),
       });

       return pdf;
     }

     private renderInvoiceHTML(invoice: Invoice, settings: InvoiceSettings, template: Template): string {
       return template.render({
         invoiceNumber: invoice.invoiceNumber,
         invoiceDate: this.formatDate(invoice.createdAt, settings.language),
         dueDate: this.formatDate(invoice.dueDate, settings.language),
         companyInfo: settings.companyInfo,
         clientInfo: invoice.client,
         lineItems: invoice.lineItems,
         subtotal: invoice.amount,
         tax: invoice.taxAmount,
         total: invoice.amount + invoice.taxAmount,
         currency: invoice.currency,
         paymentInstructions: settings.paymentInstructions,
       });
     }

     private async convertHTMLToPDF(html: string, options: any): Promise<Buffer> {
       // Use Puppeteer or similar for HTML to PDF conversion
       const browser = await puppeteer.launch();
       const page = await browser.newPage();
       await page.setContent(html, { waitUntil: 'networkidle0' });
       const pdf = await page.pdf(options);
       await browser.close();
       return pdf;
     }
   }
   ```

4. **Invoice Template System**
   ```typescript
   class InvoiceTemplateService {
     private templates: Map<string, Template> = new Map();

     async getTemplate(templateId: string): Promise<Template>
     async listTemplates(): Promise<Template[]>
     async createCustomTemplate(trainerId: string, template: TemplateDto): Promise<Template>
     async updateTemplate(templateId: string, template: UpdateTemplateDto): Promise<Template>

     // Default templates
     private loadDefaultTemplates(): void {
       this.templates.set('modern', new ModernTemplate());
       this.templates.set('classic', new ClassicTemplate());
       this.templates.set('minimal', new MinimalTemplate());
     }
   }

   interface Template {
     id: string;
     name: string;
     preview: string;
     render(context: InvoiceContext): string;
   }
   ```

5. **Tax Calculation Service**
   ```typescript
   class TaxCalculationService {
     async calculateTax(invoiceData: InvoiceData, trainerId: string): Promise<TaxCalculation> {
       const settings = await this.invoiceService.getInvoiceSettings(trainerId);
       const taxConfig = await this.getTaxConfiguration(trainerId, invoiceData.clientLocation);

       const taxableAmount = this.calculateTaxableAmount(invoiceData.lineItems);
       const tax = taxableAmount * (taxConfig.taxRate / 100);

       return {
         taxableAmount,
         taxRate: taxConfig.taxRate,
         taxName: taxConfig.taxName,
         taxAmount: tax,
         isInclusive: taxConfig.isInclusive,
       };
     }

     private calculateTaxableAmount(lineItems: LineItem[]): number {
       return lineItems.reduce((sum, item) => sum + (item.taxable ? item.amount : 0), 0);
     }
   }
   ```

6. **Multi-language Support**
   ```typescript
   class InvoiceLocalizationService {
     private translations: Map<string, Translations> = new Map();

     async getTranslations(language: string): Promise<Translations> {
       if (!this.translations.has(language)) {
         await this.loadTranslations(language);
       }
       return this.translations.get(language)!;
     }

     async translateInvoice(invoice: Invoice, language: string): Promise<TranslatedInvoice> {
       const translations = await this.getTranslations(language);
       return {
         ...invoice,
         lineItems: invoice.lineItems.map(item => ({
           ...item,
           description: this.translateText(item.description, translations),
         })),
         notes: this.translateText(invoice.notes || '', translations),
       };
   }

     private translateText(text: string, translations: Translations): string {
       // Simple translation - in production, use professional i18n library
       return text;
     }
   }
   ```

7. **Database Schema Updates**
   ```sql
   CREATE TABLE invoices (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     invoice_number VARCHAR(50) UNIQUE NOT NULL,
     client_id UUID NOT NULL REFERENCES users(id),
     trainer_id UUID NOT NULL REFERENCES users(id),
     transaction_id UUID REFERENCES transactions(id),
     amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
     tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
     currency VARCHAR(3) NOT NULL DEFAULT 'USD',
     status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
     due_date DATE,
     paid_at TIMESTAMP,
     line_items JSONB NOT NULL DEFAULT '[]',
     notes TEXT,
     payment_instructions TEXT,
     template_id VARCHAR(100) DEFAULT 'modern',
     language VARCHAR(10) DEFAULT 'en',
     pdf_url VARCHAR(500),
     sent_at TIMESTAMP,
     viewed_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_invoices_number ON invoices(invoice_number);
   CREATE INDEX idx_invoices_client ON invoices(client_id);
     CREATE INDEX idx_invoices_trainer ON invoices(trainer_id);
   CREATE INDEX idx_invoices_status ON invoices(status);
   CREATE INDEX idx_invoices_transaction ON invoices(transaction_id);

   CREATE TABLE invoice_settings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID NOT NULL UNIQUE REFERENCES users(id),
     company_name VARCHAR(255) NOT NULL,
     company_address TEXT,
     company_phone VARCHAR(50),
     company_email VARCHAR(255),
     company_logo_url VARCHAR(500),
     tax_id VARCHAR(100),
     invoice_prefix VARCHAR(20) DEFAULT 'INV-',
     next_invoice_number INTEGER DEFAULT 1,
     template_id VARCHAR(100) DEFAULT 'modern',
     default_language VARCHAR(10) DEFAULT 'en',
     payment_terms_days INTEGER DEFAULT 30,
     payment_instructions TEXT,
     auto_generate BOOLEAN DEFAULT true,
     auto_send BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_invoice_settings_trainer ON invoice_settings(trainer_id);

   CREATE TABLE invoice_templates (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID REFERENCES users(id), -- NULL for system templates
     name VARCHAR(255) NOT NULL,
     description TEXT,
     template_html TEXT NOT NULL,
     css TEXT,
     preview_url VARCHAR(500),
     is_custom BOOLEAN DEFAULT false,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_invoice_templates_trainer ON invoice_templates(trainer_id);
   ```

### Data Models
```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: User;
  trainerId: string;
  trainer?: User;
  transactionId?: string;
  transaction?: Transaction;
  amount: number;
  taxAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: Date;
  paidAt?: Date;
  lineItems: LineItem[];
  notes?: string;
  paymentInstructions?: string;
  templateId: string;
  language: string;
  pdfUrl?: string;
  sentAt?: Date;
  viewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable: boolean;
  metadata?: Record<string, any>;
}

interface InvoiceSettings {
  id: string;
  trainerId: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogoUrl?: string;
  taxId?: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  templateId: string;
  defaultLanguage: string;
  paymentTermsDays: number;
  paymentInstructions?: string;
  autoGenerate: boolean;
  autoSend: boolean;
}

interface CreateInvoiceDto {
  clientId: string;
  dueDate?: Date;
  lineItems: LineItem[];
  notes?: string;
  saveAsDraft?: boolean;
  sendImmediately?: boolean;
}

interface InvoiceContext {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  clientInfo: User;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paymentInstructions?: string;
}
```

## Test Cases

### 1. Happy Path Tests
- Automatic invoice generation on payment
- PDF generation with correct format
- Email delivery successful
- Invoice number incrementing correctly
- Custom template rendering
- Tax calculations accurate
- Multi-language invoice generation
- Invoice status updates correctly

### 2. PDF Generation Tests
- PDF contains all required information
- PDF format is professional
- Company logo displays correctly
- Line items formatted properly
- Tax breakdown visible
- Payment instructions included
- PDF size reasonable (< 1MB)
- PDF downloadable

### 3. Email Tests
- Invoice email delivered
- Email contains invoice PDF
- Email subject line correct
- Email sender correct
- Email formatted professionally
- Attachments work correctly

### 4. Template Tests
- Default templates render correctly
- Custom template creation
- Template switching
- Template preview
- Template CSS application
- Mobile-responsive templates

### 5. Security Tests
- **CRITICAL**: Client can only view their own invoices
- **CRITICAL**: Trainer can only view their own invoices
- **CRITICAL**: PDF generation protected from abuse
- **CRITICAL**: SQL injection prevention in invoice queries
- **CRITICAL**: XSS protection in invoice display
- **CRITICAL**: Invoice number uniqueness enforced
- Authorization checks on all invoice operations

### 6. Edge Cases
- Invoice with zero amount
- Invoice with negative line item (rejection)
- Duplicate invoice number prevention
- Invoice with no line items
- Invoice for deleted transaction
- Concurrent invoice generation

### 7. Localization Tests
- Invoice in different languages
- Currency formatting by locale
- Date formatting by locale
- Tax name translation

### 8. Integration Tests
- Stripe invoice sync
- Transaction to invoice mapping
- Subscription invoice generation
- Batch invoice generation

## UI/UX Mockups

```
+--------------------------------------------------+
|  Invoices                                        |
|                                                  |
|  [Create Manual Invoice]  [Settings]             |
|                                                  |
|  Filter: [All Status ▼]  Search: [___________]   |
|                                                  |
|  +--------------------------------------------+  |
|  |  INV-2024-0015                  $700.00    |  |
|  |  John Doe - Jan 15, 2024                  |  |
|  |  Due: Feb 14, 2024           [Paid ✓]     |  |
|  |  [View] [Download] [Resend]               |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  |  INV-2024-0014                  $899.00    |  |
|  |  Jane Smith - Jan 1, 2024                 |  |
|  |  Due: Jan 31, 2024           [Paid ✓]     |  |
|  |  [View] [Download] [Resend]               |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  |  INV-2024-0013                  $375.00    |  |
|  |  Mike Brown - Dec 20, 2023                |  |
|  |  Due: Jan 19, 2024           [Overdue ⚠]  |  |
|  |  [View] [Download] [Send Reminder]        |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Invoice: INV-2024-0015                          |
|                                                  |
|  [Company Logo]                                  |
|  Jane Smith Fitness                             |
|  123 Fitness Street                             |
|  Los Angeles, CA 90001                          |
|  Phone: (555) 123-4567                          |
|  Email: jane@smithfitness.com                   |
|                                                  |
|  Bill To:                                        |
|  John Doe                                       |
|  john.doe@email.com                             |
|                                                  |
|  ───────────────────────────────────────────     |
|                                                  |
|  Invoice Number: INV-2024-0015                   |
|  Invoice Date: January 15, 2024                  |
|  Due Date: February 14, 2024                     |
|  Status: [PAID ✓]                                |
|                                                  |
|  ───────────────────────────────────────────     |
|                                                  |
|  Item                          Qty   Amount      |
|  ────────────────────────────────────────       |
|  10-Session Package               1    $700.00   |
|  • 10 personal training sessions                |
|  • Customized workout plans                     |
|  • Progress tracking                            |
|                                                  |
|  Subtotal                           $700.00     |
|  Tax (8%)                            $56.00     |
|  ────────────────────────────────────────       |
|  Total                              $756.00     |
|                                                  |
|  Payment Method: Visa •••• 4242                  |
|  Paid on: January 15, 2024                       |
|                                                  |
|  ───────────────────────────────────────────     |
|                                                  |
|  Payment Instructions:                           |
|  Future payments can be made through the         |
|  platform using saved payment methods.          |
|                                                  |
|  Thank you for your business!                   |
|                                                  |
|  [Download PDF] [Print] [Email] [Back]           |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Invoice Settings                                |
|                                                  |
|  Company Information                              |
|  ───────────────────────────────────             |
|  Company Name: [Jane Smith Fitness_______]       |
|  Address: [123 Fitness Street__________]         |
|  [Los Angeles, CA 90001____________]             |
|  Phone: [(555) 123-4567_____________]            |
|  Email: [jane@smithfitness.com______]            |
|  Tax ID: [___________________________]           |
|                                                  |
|  Logo:                                           |
|  [Browse...]  [Remove]  Current: [View]          |
|                                                  |
|  Invoice Settings                                |
|  ───────────────────────────────────             |
|  Invoice Prefix: [INV-]                          |
|  Next Number: [0016]                             |
|  Template: [Modern ▼]                            |
|  Language: [English ▼]                           |
|  Payment Terms: [30] days                        |
|                                                  |
|  Payment Instructions:                            |
|  [Payment via platform or bank transfer___]      |
|  [to account: •••• 6789__________________]        |
|                                                  |
|  Automation:                                     |
|  ☑ Auto-generate invoices                       |
|  ☑ Auto-send to clients                         |
|  ☐ Send payment reminders                       |
|                                                  |
|  Preview: [View Sample Invoice]                  |
|                                                  |
|  [Cancel]  [Save Settings]                       |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Create Manual Invoice                           |
|                                                  |
|  Select Client:                                  |
|  [Search Client ________________]  [Browse]      |
|                                                  |
|  Selected: John Doe                              |
|                                                  |
|  Invoice Details:                                |
|  ───────────────────────────────────             |
|  Due Date: [Feb 14, 2024 📅]                     |
|  Notes: [__________________________________]     |
|  [__________________________________]            |
|                                                  |
|  Line Items:                                     |
|  [+ Add Line Item]                               |
|                                                  |
|  +-------------------------------------------+   |
|  |  Description: [Additional Training Session] |   |
|  |  Quantity: [1]  Unit Price: [$85.00]       |   |
|  |  Amount: $85.00  Taxable: ☑               |   |
|  |  [Remove]                                 |   |
|  +-------------------------------------------+   |
|                                                  |
|  +-------------------------------------------+   |
|  |  Description: [Nutrition Consultation____] |   |
|  |  Quantity: [1]  Unit Price: [$50.00]       |   |
|  |  Amount: $50.00  Taxable: ☑               |   |
|  |  [Remove]                                 |   |
|  +-------------------------------------------+   |
|                                                  |
|  Summary:                                        |
|  Subtotal: $135.00                               |
|  Tax (8%): $10.80                                |
|  Total: $145.80                                  |
|                                                  |
|  ☑ Send invoice to client immediately            |
|  ☐ Save as draft                                |
|                                                  |
|  [Cancel]  [Create Invoice →]                    |
+--------------------------------------------------+
```

## Dependencies
- Transactions system (Story 010-03)
- Tax configuration (Story 010-01)
- User information (client/trainer)
- Email service configured
- File storage for PDFs
- PDF generation library installed

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>85% coverage)
- [ ] PDF generation tested and working
- [ ] Email delivery tested
- [ ] All templates render correctly
- [ ] Multi-language support tested
- [ ] Tax calculations verified
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Sample invoices generated

## Notes
- **CRITICAL**: Use proper PDF generation library that supports UTF-8 and international characters.
- **CRITICAL**: Ensure PDF storage is secure and access-controlled.
- Invoice numbers should never be reused, even if invoice is deleted.
- Consider implementing watermark for draft invoices.
- Provide both HTML and PDF versions for accessibility.
- Invoice templates should be mobile-responsive.
- Consider supporting electronic signatures for paid invoices.
- Implement invoice reminder system for overdue invoices.
- Allow bulk invoice generation for multiple clients.
- Consider integrating with accounting software (QuickBooks, Xero).
- Store invoices permanently for legal/tax purposes.
- Implement invoice search with advanced filters (date range, amount, status).
- Support credit notes and corrected invoices.
- Test PDF rendering with special characters and long descriptions.
