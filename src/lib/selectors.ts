import type { AppState, Invoice, Payment } from '../types';
import {
  invoicePaid,
  invoiceStatus,
  invoiceTotal,
  parseISODate,
  startOfWeek,
  sum,
  todayISO,
  toISO,
} from './utils';

export function getClient(state: AppState, id?: string) {
  return state.clients.find((client) => client.id === id);
}

export function getProject(state: AppState, id?: string) {
  return state.projects.find((project) => project.id === id);
}

export function invoiceBalance(invoice: Invoice, payments: Payment[]): number {
  return Math.max(0, invoiceTotal(invoice) - invoicePaid(invoice.id, payments));
}

export function totalReceived(payments: Payment[]): number {
  return sum(
    payments.map((payment) => (payment.type === 'Refund' ? -payment.amount : payment.amount)),
  );
}

export function totalInvoiced(invoices: Invoice[]): number {
  return sum(invoices.filter((invoice) => !invoice.draft).map(invoiceTotal));
}

export function totalOutstanding(invoices: Invoice[], payments: Payment[]): number {
  return sum(
    invoices
      .filter((invoice) => !invoice.draft)
      .map((invoice) => invoiceBalance(invoice, payments)),
  );
}

export function outstandingInvoices(invoices: Invoice[], payments: Payment[]) {
  return invoices
    .filter(
      (invoice) =>
        !invoice.draft &&
        invoiceStatus(invoice, payments) !== 'Paid' &&
        invoiceBalance(invoice, payments) > 0,
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function clientOutstanding(state: AppState, clientId: string): number {
  return sum(
    state.invoices
      .filter((invoice) => invoice.clientId === clientId && !invoice.draft)
      .map((invoice) => invoiceBalance(invoice, state.payments)),
  );
}

export function projectValueByClient(state: AppState, clientId: string): number {
  return sum(
    state.projects.filter((project) => project.clientId === clientId).map((project) => project.value),
  );
}

export function weeklyWorkHours(state: AppState, anchor: Date = new Date()) {
  const start = toISO(startOfWeek(anchor));
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = parseISODate(start);
    date.setDate(date.getDate() + index);
    const iso = toISO(date);
    const entries = state.workEntries.filter((entry) => entry.date === iso);
    const minutes = sum(
      entries.map((entry) => {
        const [sh, sm] = entry.startTime.split(':').map(Number);
        const [eh, em] = entry.endTime.split(':').map(Number);
        return Math.max(0, eh * 60 + em - (sh * 60 + sm));
      }),
    );
    return {
      date: iso,
      label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      hours: Math.round((minutes / 60) * 10) / 10,
      minutes,
    };
  });
  return days;
}

export function monthlyIncomeSeries(payments: Payment[], months = 6) {
  const now = new Date();
  const series = Array.from({ length: months }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1) + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const income = sum(
      payments
        .filter((payment) => payment.date.startsWith(key))
        .map((payment) => (payment.type === 'Refund' ? -payment.amount : payment.amount)),
    ) / 1000;
    return {
      month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
      monthKey: key,
      income: Math.round(income * 10) / 10,
    };
  });
  return series;
}

export function todayStats(state: AppState) {
  const today = todayISO();
  const entries = state.workEntries.filter((entry) => entry.date === today);
  const minutes = sum(
    entries.map((entry) => {
      const [sh, sm] = entry.startTime.split(':').map(Number);
      const [eh, em] = entry.endTime.split(':').map(Number);
      return Math.max(0, eh * 60 + em - (sh * 60 + sm));
    }),
  );
  return { minutes, count: entries.length };
}
