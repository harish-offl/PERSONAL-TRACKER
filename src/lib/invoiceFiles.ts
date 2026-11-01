import { jsPDF } from 'jspdf';
import type { Client, Invoice, Payment, Project, Settings } from '../types';
import {
  escapeHtml,
  formatDate,
  formatMoney,
  invoicePaid,
  invoiceStatus,
  invoiceSubtotal,
  invoiceTax,
  invoiceTotal,
} from './utils';

interface InvoiceFileArgs {
  invoice: Invoice;
  client?: Client;
  project?: Project;
  payments: Payment[];
  settings: Settings;
}

function pdfMoney(value: number, currency: Settings['preferences']['currency']): string {
  const symbol = currency === 'INR' ? 'Rs.' : currency === 'USD' ? '$' : 'EUR';
  return `${symbol} ${new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function downloadInvoicePDF({
  invoice,
  client,
  project,
  payments,
  settings,
}: InvoiceFileArgs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const currency = settings.preferences.currency;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const right = pageWidth - margin;
  const business = settings.invoice.businessName || settings.profile.name;
  const total = invoiceTotal(invoice);
  const paid = invoicePaid(invoice.id, payments);
  const balance = Math.max(0, total - paid);
  const status = invoiceStatus(invoice, payments);

  doc.setFillColor(159, 18, 57);
  doc.rect(0, 0, pageWidth, 3, 'F');

  doc.setTextColor(8, 8, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(business, margin, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(102, 102, 102);
  doc.text(settings.profile.name, margin, 28);
  doc.text(settings.profile.email, margin, 33);
  if (settings.invoice.gstin) doc.text(`GSTIN: ${settings.invoice.gstin}`, margin, 38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(8, 8, 8);
  doc.text('INVOICE', right, 24, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text(invoice.id, right, 31, { align: 'right' });
  doc.text(`Status: ${status}`, right, 36, { align: 'right' });
  doc.text(`Issued: ${formatDate(invoice.issueDate)}`, right, 41, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, right, 46, { align: 'right' });

  doc.setDrawColor(234, 234, 234);
  doc.setLineWidth(0.25);
  doc.line(margin, 56, right, 56);

  doc.setFontSize(8);
  doc.setTextColor(133, 133, 133);
  doc.text('BILL TO', margin, 66);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(8, 8, 8);
  doc.text(client?.businessName ?? 'Client', margin, 72);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(102, 102, 102);
  let infoY = 77;
  if (client?.name) {
    doc.text(client.name, margin, infoY);
    infoY += 5;
  }
  if (client?.email) {
    doc.text(client.email, margin, infoY);
    infoY += 5;
  }
  if (client?.phone) {
    doc.text(client.phone, margin, infoY);
    infoY += 5;
  }
  if (client?.location) {
    doc.text(client.location, margin, infoY);
  }

  if (project) {
    doc.setFontSize(8);
    doc.setTextColor(133, 133, 133);
    doc.text('PROJECT', right, 66, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(8, 8, 8);
    doc.text(project.name, right, 72, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(102, 102, 102);
    doc.text(project.code, right, 77, { align: 'right' });
  }

  const tableTop = 92;
  doc.setFillColor(247, 247, 247);
  doc.roundedRect(margin, tableTop, right - margin, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  doc.text('DESCRIPTION', margin + 4, tableTop + 6);
  doc.text('QTY', margin + 112, tableTop + 6, { align: 'right' });
  doc.text('RATE', margin + 142, tableTop + 6, { align: 'right' });
  doc.text('AMOUNT', right - 4, tableTop + 6, { align: 'right' });

  let y = tableTop + 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  invoice.items.forEach((item, index) => {
    const lines = doc.splitTextToSize(item.description || 'Item', 96) as string[];
    const rowHeight = Math.max(10, lines.length * 4.5 + 5);
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, right - margin, rowHeight, 'F');
    }
    doc.setTextColor(8, 8, 8);
    doc.text(lines, margin + 4, y + 5.5);
    doc.setTextColor(102, 102, 102);
    doc.text(String(item.quantity), margin + 112, y + 5.5, { align: 'right' });
    doc.text(pdfMoney(item.rate, currency), margin + 142, y + 5.5, { align: 'right' });
    doc.setTextColor(8, 8, 8);
    doc.text(pdfMoney(item.quantity * item.rate, currency), right - 4, y + 5.5, {
      align: 'right',
    });
    doc.setDrawColor(243, 243, 243);
    doc.line(margin, y + rowHeight, right, y + rowHeight);
    y += rowHeight;
  });

  const subtotal = invoiceSubtotal(invoice);
  const tax = invoiceTax(invoice);
  const totalsX = right - 64;
  let totalY = y + 8;
  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 8.8);
    doc.setTextColor(bold ? 8 : 102, bold ? 8 : 102, bold ? 8 : 102);
    doc.text(label, totalsX, totalY);
    doc.text(value, right - 4, totalY, { align: 'right' });
    totalY += bold ? 7 : 5.5;
  };

  totalRow('Subtotal', pdfMoney(subtotal, currency));
  if (invoice.discount > 0) totalRow('Discount', `− ${pdfMoney(invoice.discount, currency)}`);
  if (invoice.taxRate > 0) totalRow(`Tax (${invoice.taxRate}%)`, pdfMoney(tax, currency));
  doc.setDrawColor(234, 234, 234);
  doc.line(totalsX, totalY - 2.5, right - 4, totalY - 2.5);
  totalY += 4;
  totalRow('Grand total', pdfMoney(total, currency), true);
  totalRow('Amount paid', pdfMoney(paid, currency));
  doc.setTextColor(159, 18, 57);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Balance due', totalsX, totalY);
  doc.text(pdfMoney(balance, currency), right - 4, totalY, { align: 'right' });

  const footerY = Math.max(totalY + 14, 244);
  doc.setDrawColor(243, 243, 243);
  doc.line(margin, footerY, right, footerY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  doc.text('NOTES', margin, footerY + 7);
  doc.text('PAYMENT TERMS', margin + 84, footerY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  doc.text(doc.splitTextToSize(invoice.notes || 'Thank you for your business.', 74) as string[], margin, footerY + 12);
  doc.text(doc.splitTextToSize(invoice.terms || settings.invoice.paymentTerms, 76) as string[], margin + 84, footerY + 12);

  if (settings.invoice.bankDetails) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 102, 102);
    doc.text('PAYMENT DETAILS', margin, footerY + 30);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.invoice.bankDetails, margin, footerY + 35);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(133, 133, 133);
  doc.text(
    `Generated with Personal Tracker · ${business}`,
    margin,
    doc.internal.pageSize.getHeight() - 10,
  );

  doc.save(`${invoice.id}.pdf`);
}

export function printInvoice({ invoice, client, project, payments, settings }: InvoiceFileArgs) {
  const total = invoiceTotal(invoice);
  const paid = invoicePaid(invoice.id, payments);
  const balance = Math.max(0, total - paid);
  const status = invoiceStatus(invoice, payments);

  const rows = invoice.items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.description || 'Item')}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${escapeHtml(formatMoney(item.rate))}</td>
        <td class="num">${escapeHtml(formatMoney(item.quantity * item.rate))}</td>
      </tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>${escapeHtml(invoice.id)}</title>
<style>
  *{box-sizing:border-box} body{font-family:Inter,-apple-system,Segoe UI,sans-serif;color:#080808;margin:0;padding:40px;font-size:12px;line-height:1.5}
  .page{max-width:760px;margin:0 auto} .top{height:5px;background:#9F1239;border-radius:99px;margin-bottom:28px}
  .header{display:flex;justify-content:space-between;gap:24px;margin-bottom:28px}
  h1{font-size:28px;letter-spacing:-.03em;margin:0 0 4px} .muted{color:#666666} .tiny{font-size:10px;color:#858585;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
  .right{text-align:right} .badge{display:inline-block;border:1px solid #EAEAEA;background:#F7F7F7;border-radius:99px;padding:3px 10px;font-size:10px;margin-bottom:8px}
  .cols{display:flex;justify-content:space-between;gap:24px;border-top:1px solid #EAEAEA;border-bottom:1px solid #EAEAEA;padding:18px 0;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin-bottom:20px} th{background:#F7F7F7;text-align:left;padding:9px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#666666;border-radius:6px}
  td{padding:10px;border-bottom:1px solid #EAEAEA;vertical-align:top} .num{text-align:right;white-space:nowrap}
  .totals{margin-left:auto;width:280px} .row{display:flex;justify-content:space-between;padding:4px 0;color:#666666} .row strong{color:#080808}
  .grand{border-top:1px solid #EAEAEA;margin-top:6px;padding-top:9px;font-size:14px;font-weight:600;color:#080808}
  .balance{color:#9F1239;font-weight:600}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;border-top:1px solid #EAEAEA;padding-top:16px;margin-top:24px}
  .footer{margin-top:36px;font-size:9px;color:#858585;text-align:center}
  @media print{body{padding:0}.page{max-width:none}}
</style></head>
<body><div class="page">
  <div class="top"></div>
  <div class="header">
    <div>
      <h1>${escapeHtml(settings.invoice.businessName || settings.profile.name)}</h1>
      <div class="muted">${escapeHtml(settings.profile.name)}</div>
      <div class="muted">${escapeHtml(settings.profile.email)}</div>
      ${settings.invoice.gstin ? `<div class="muted">GSTIN: ${escapeHtml(settings.invoice.gstin)}</div>` : ''}
    </div>
    <div class="right">
      <div class="badge">${escapeHtml(status)}</div>
      <h1>INVOICE</h1>
      <div class="muted">${escapeHtml(invoice.id)}</div>
      <div class="muted">Issued ${escapeHtml(formatDate(invoice.issueDate))}</div>
      <div class="muted">Due ${escapeHtml(formatDate(invoice.dueDate))}</div>
    </div>
  </div>
  <div class="cols">
    <div>
      <div class="tiny">Bill to</div>
      <strong>${escapeHtml(client?.businessName ?? 'Client')}</strong>
      <div class="muted">${escapeHtml(client?.name ?? '')}</div>
      <div class="muted">${escapeHtml(client?.email ?? '')}</div>
      <div class="muted">${escapeHtml(client?.phone ?? '')}</div>
    </div>
    ${project ? `<div class="right"><div class="tiny">Project</div><strong>${escapeHtml(project.name)}</strong><div class="muted">${escapeHtml(project.code)}</div></div>` : ''}
  </div>
  <table><thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${escapeHtml(formatMoney(invoiceSubtotal(invoice)))}</span></div>
    ${invoice.discount > 0 ? `<div class="row"><span>Discount</span><span>− ${escapeHtml(formatMoney(invoice.discount))}</span></div>` : ''}
    ${invoice.taxRate > 0 ? `<div class="row"><span>Tax (${invoice.taxRate}%)</span><span>${escapeHtml(formatMoney(invoiceTax(invoice)))}</span></div>` : ''}
    <div class="row grand"><span>Grand total</span><span>${escapeHtml(formatMoney(total))}</span></div>
    <div class="row"><span>Amount paid</span><span>${escapeHtml(formatMoney(paid))}</span></div>
    <div class="row balance"><span>Balance due</span><span>${escapeHtml(formatMoney(balance))}</span></div>
  </div>
  <div class="grid">
    <div><div class="tiny">Notes</div><div class="muted">${escapeHtml(invoice.notes || 'Thank you for your business.')}</div></div>
    <div><div class="tiny">Payment terms</div><div class="muted">${escapeHtml(invoice.terms || settings.invoice.paymentTerms)}</div><div class="tiny" style="margin-top:12px">Payment details</div><div class="muted">${escapeHtml(settings.invoice.bankDetails)}</div></div>
  </div>
  <div class="footer">Generated with Personal Tracker · ${escapeHtml(settings.invoice.businessName || settings.profile.name)}</div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=880,height=1000');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
