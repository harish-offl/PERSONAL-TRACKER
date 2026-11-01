import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CurrencySettings, Invoice, InvoiceStatus, Payment, Priority, TaskStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let formatPreferences: Pick<CurrencySettings, 'currency' | 'dateFormat'> = {
  currency: 'INR',
  dateFormat: 'MMM d, yyyy',
};

export function setFormatPreferences(prefs: Pick<CurrencySettings, 'currency' | 'dateFormat'>) {
  formatPreferences = { ...formatPreferences, ...prefs };
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
};

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function toISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDays(dateOrISO: string | Date, days: number): string {
  const base = typeof dateOrISO === 'string' ? parseISODate(dateOrISO) : new Date(dateOrISO);
  base.setDate(base.getDate() + days);
  return toISO(base);
}

export function daysAgoISO(days: number): string {
  return addDays(new Date(), -days);
}

export function dateTimeHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const date = parseISODate(iso);
  const format = formatPreferences.dateFormat;
  if (format === 'dd/MM/yyyy') {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }
  if (format === 'MM/dd/yyyy') {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(iso: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parseISODate(iso));
}

export function formatDateLong(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export function formatWeekdayShort(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}

export function formatMoney(value: number, options?: { compact?: boolean }): string {
  if (!Number.isFinite(value)) return '—';
  if (options?.compact && Math.abs(value) >= 100000) {
    const symbol = CURRENCY_SYMBOL[formatPreferences.currency] ?? '';
    const lakhs = value / 100000;
    return `${symbol}${lakhs.toFixed(lakhs >= 10 ? 1 : 2)}L`;
  }
  return new Intl.NumberFormat(formatPreferences.currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: formatPreferences.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function workDuration(startTime: string, endTime: string): number {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  return diff > 0 ? diff : 0;
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatTime(time: string): string {
  if (!time) return '—';
  const [hourRaw, minute] = time.split(':').map(Number);
  const suffix = hourRaw >= 12 ? 'PM' : 'AM';
  const hour = hourRaw % 12 || 12;
  return `${hour}:${String(minute || 0).padStart(2, '0')} ${suffix}`;
}

export function relativeTime(isoDateTime: string): string {
  const then = new Date(isoDateTime).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff)) return 'Just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDateShort(isoDateTime.slice(0, 10));
}

export function daysUntil(iso: string): number {
  const target = parseISODate(iso).getTime();
  const today = parseISODate(todayISO()).getTime();
  return Math.round((target - today) / 86400000);
}

export function deadlineLabel(iso: string): string {
  const diff = daysUntil(iso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `In ${diff}d`;
}

export function isOverdue(iso: string): boolean {
  return daysUntil(iso) < 0;
}

export function isToday(iso: string): boolean {
  return iso === todayISO();
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

export function monthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function monthEnd(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function inRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function nextSequence(ids: string[], prefix: string): number {
  const values = ids
    .filter((id) => id.startsWith(`${prefix}-`))
    .map((id) => Number(id.split('-').pop()))
    .filter((value) => Number.isFinite(value));
  return (values.length ? Math.max(...values) : 0) + 1;
}

export function invoiceSubtotal(invoice: Invoice): number {
  return invoice.items.reduce((total, item) => total + item.quantity * item.rate, 0);
}

export function invoiceTax(invoice: Invoice): number {
  return Math.round((invoiceSubtotal(invoice) - invoice.discount) * (invoice.taxRate / 100));
}

export function invoiceTotal(invoice: Invoice): number {
  return Math.max(0, invoiceSubtotal(invoice) - invoice.discount + invoiceTax(invoice));
}

export function invoicePaid(invoiceId: string, payments: Payment[]): number {
  return Math.max(
    0,
    sum(
      payments
        .filter((payment) => payment.invoiceId === invoiceId)
        .map((payment) => (payment.type === 'Refund' ? -payment.amount : payment.amount)),
    ),
  );
}

export function invoiceStatus(invoice: Invoice, payments: Payment[], today = todayISO()): InvoiceStatus {
  if (invoice.draft) return 'Draft';
  const total = invoiceTotal(invoice);
  const paid = invoicePaid(invoice.id, payments);
  if (total > 0 && paid >= total - 0.01) return 'Paid';
  if (invoice.dueDate < today) return 'Overdue';
  if (paid > 0) return 'Partially Paid';
  return 'Sent';
}

export function paymentStatus(payment: Payment, invoices: Invoice[], payments: Payment[]): string {
  if (payment.type === 'Refund') return 'Refunded';
  const invoice = invoices.find((item) => item.id === payment.invoiceId);
  if (!invoice) return 'Recorded';
  const status = invoiceStatus(invoice, payments);
  if (status === 'Paid') return 'Paid';
  if (status === 'Overdue') return 'Overdue';
  return 'Partial';
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  pending: 'Pending',
  completed: 'Completed',
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export function downloadFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJSON(filename: string, data: unknown) {
  downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '');
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(','),
    )
    .join('\n');
  downloadFile(filename, csv, 'text/csv;charset=utf-8');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
