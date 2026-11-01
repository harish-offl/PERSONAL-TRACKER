import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Banknote,
  CreditCard,
  Download,
  Eye,
  FileText,
  Landmark,
  Plus,
  Receipt,
  Smartphone,
  Trash2,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { Invoice, Payment, PaymentMode, PaymentType } from '../types';
import {
  cn,
  downloadCSV,
  formatDate,
  formatMoney,
  invoicePaid,
  invoiceTotal,
  nextSequence,
  paymentStatus,
  todayISO,
} from '../lib/utils';
import { getClient, totalOutstanding, totalReceived } from '../lib/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionCard, StatCard } from '../components/shared/cards';
import {
  ActionMenu,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FilterMenu,
  Input,
  Modal,
  SearchInput,
  Select,
  StatusBadge,
  Td,
  Textarea,
  Th,
  TableRow,
  useToast,
} from '../components/ui';

const PAYMENT_MODES: PaymentMode[] = ['UPI', 'Bank Transfer', 'Cash', 'Card', 'Cheque'];

const modeIcon: Record<PaymentMode, LucideIcon> = {
  UPI: Smartphone,
  'Bank Transfer': Landmark,
  Cash: Banknote,
  Card: CreditCard,
  Cheque: FileText,
};

type PaymentSort = 'newest' | 'oldest' | 'amount';

export function PaymentsPage() {
  const { state, addPayment, deletePayment } = useAppData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<PaymentMode[]>([]);
  const [typeFilter, setTypeFilter] = useState<PaymentType[]>([]);
  const [sort, setSort] = useState<PaymentSort>('newest');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prefillInvoiceId, setPrefillInvoiceId] = useState<string | undefined>();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);

  useEffect(() => {
    const create = searchParams.get('create');
    const invoiceId = searchParams.get('invoice');
    if (create) {
      setPrefillInvoiceId(invoiceId ?? undefined);
      setDrawerOpen(true);
    }
    if (create || invoiceId) {
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      next.delete('invoice');
      next.delete('t');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const viewing = viewingId ? state.payments.find((payment) => payment.id === viewingId) ?? null : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.payments
      .filter((payment) => {
        const client = getClient(state, payment.clientId);
        const invoice = state.invoices.find((item) => item.id === payment.invoiceId);
        const project = state.projects.find((item) => item.id === invoice?.projectId);
        const haystack = `${payment.id} ${payment.reference} ${client?.businessName ?? ''} ${client?.name ?? ''} ${payment.invoiceId} ${project?.name ?? ''}`.toLowerCase();
        return (
          (!q || haystack.includes(q)) &&
          (modeFilter.length === 0 || modeFilter.includes(payment.mode)) &&
          (typeFilter.length === 0 || typeFilter.includes(payment.type))
        );
      })
      .sort((a, b) => {
        if (sort === 'oldest') return a.date.localeCompare(b.date);
        if (sort === 'amount') return b.amount - a.amount;
        return b.date.localeCompare(a.date);
      });
  }, [state, search, modeFilter, typeFilter, sort]);

  const stats = useMemo(() => {
    const received = totalReceived(state.payments);
    const pending = totalOutstanding(state.invoices, state.payments);
    const refunds = state.payments.filter((payment) => payment.type === 'Refund');
    const payments = state.payments.filter((payment) => payment.type === 'Payment');
    const average = payments.length
      ? payments.reduce((total, payment) => total + payment.amount, 0) / payments.length
      : 0;
    return {
      received,
      pending,
      refundAmount: refunds.reduce((total, payment) => total + payment.amount, 0),
      refundCount: refunds.length,
      average,
      overpayments: pending,
    };
  }, [state]);

  const openCreate = (invoiceId?: string) => {
    setPrefillInvoiceId(invoiceId);
    setDrawerOpen(true);
  };

  const openInvoice = (invoice: Invoice | undefined) => {
    if (!invoice) return;
    navigate(`/invoices?invoice=${invoice.id}`);
  };

  const exportPayments = () => {
    downloadCSV('personal-tracker-payments.csv', [
      ['Payment ID', 'Client', 'Invoice', 'Type', 'Amount', 'Method', 'Date', 'Reference', 'Status'],
      ...filtered.map((payment) => {
        const client = getClient(state, payment.clientId);
        return [
          payment.id,
          client?.businessName ?? '',
          payment.invoiceId,
          payment.type,
          payment.amount,
          payment.mode,
          payment.date,
          payment.reference,
          paymentStatus(payment, state.invoices, state.payments),
        ];
      }),
    ]);
    toast({ title: 'Payments exported', description: 'CSV download started.' });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Track every payment received and refunded."
        badge={<Badge tone="gray">{state.payments.length} records</Badge>}
        actions={
          <Button variant="primary" size="md" onClick={() => openCreate()}>
            <Plus className="h-3.5 w-3.5" />
            Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Total Received" value={formatMoney(stats.received)} hint={`${state.payments.length} payment records`} tone="accent" />
        <StatCard icon={Receipt} label="Pending Payments" value={formatMoney(stats.pending)} hint="Across unpaid invoices" />
        <StatCard icon={Receipt} label="Refunded" value={formatMoney(stats.refundAmount)} hint={`${stats.refundCount} refunds issued`} />
        <StatCard icon={Wallet} label="Average Payment" value={formatMoney(Math.round(stats.average))} hint="Mean received amount" />
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search payments…" className="w-full sm:w-56" />
          <FilterMenu
            label="Method"
            options={PAYMENT_MODES.map((mode) => ({
              value: mode,
              label: mode,
              count: state.payments.filter((payment) => payment.mode === mode).length,
            }))}
            selected={modeFilter}
            onChange={setModeFilter}
            onClear={() => setModeFilter([])}
          />
          <FilterMenu
            label="Type"
            options={(['Payment', 'Refund'] as PaymentType[]).map((type) => ({
              value: type,
              label: type,
              count: state.payments.filter((payment) => payment.type === type).length,
            }))}
            selected={typeFilter}
            onChange={setTypeFilter}
            onClear={() => setTypeFilter([])}
          />
          <div className="hidden sm:block">
            <Select value={sort} onChange={(event) => setSort(event.target.value as PaymentSort)} className="w-[160px]">
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="amount">Sort: Amount</option>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={exportPayments}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button variant="primary" size="md" onClick={() => openCreate()} className="hidden sm:inline-flex">
            <Plus className="h-3.5 w-3.5" />
            Record payment
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments found"
          description="Adjust your filters or record your first payment against an invoice."
          action={
            <Button variant="primary" size="sm" onClick={() => openCreate()}>
              <Plus className="h-3.5 w-3.5" />
              Record payment
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
          <DataTable minWidth={1120}>
            <thead>
              <tr>
                <Th>Payment ID</Th>
                <Th>Client</Th>
                <Th>Invoice</Th>
                <Th align="right">Amount</Th>
                <Th>Payment Method</Th>
                <Th>Payment Date</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => {
                const client = getClient(state, payment.clientId);
                const invoice = state.invoices.find((item) => item.id === payment.invoiceId);
                const ModeIcon = modeIcon[payment.mode];
                const isRefund = payment.type === 'Refund';
                return (
                  <TableRow key={payment.id} onClick={() => setViewingId(payment.id)}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                            isRefund
                              ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-400'
                              : 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-400',
                          )}
                        >
                          <Receipt className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-mono text-[11px] font-medium text-ink">{payment.id}</p>
                          <p className="text-[9.5px] text-muted">{payment.type}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-[11px] font-medium text-ink">{client?.businessName ?? '—'}</p>
                      <p className="text-[9.5px] text-muted">{client?.name}</p>
                    </Td>
                    <Td><span className="font-mono text-[10.5px] text-soft">{payment.invoiceId}</span></Td>
                    <Td align="right">
                      <span className={cn('whitespace-nowrap text-[11.5px] font-semibold', isRefund ? 'text-danger' : 'text-ink')}>
                        {isRefund ? '−' : ''}
                        {formatMoney(payment.amount)}
                      </span>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10.5px] text-soft">
                        <ModeIcon className="h-3.5 w-3.5 text-muted" />
                        {payment.mode}
                      </span>
                    </Td>
                    <Td><span className="whitespace-nowrap text-[11px]">{formatDate(payment.date)}</span></Td>
                    <Td><StatusBadge status={paymentStatus(payment, state.invoices, state.payments)} /></Td>
                    <Td align="right">
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <ActionMenu
                          label={`Actions for ${payment.id}`}
                          items={[
                            { label: 'View details', icon: Eye, onClick: () => setViewingId(payment.id) },
                            { label: 'View invoice', icon: FileText, onClick: () => openInvoice(invoice) },
                            {
                              label: 'Record another',
                              icon: Plus,
                              onClick: () => openCreate(payment.invoiceId),
                              separator: true,
                            },
                            {
                              label: 'Delete payment',
                              icon: Trash2,
                              onClick: () => setDeleting(payment),
                              danger: true,
                              separator: true,
                            },
                          ]}
                        />
                      </div>
                    </Td>
                  </TableRow>
                );
              })}
            </tbody>
          </DataTable>
        </div>
      )}

      {drawerOpen && (
        <RecordPaymentDrawer
          prefillInvoiceId={prefillInvoiceId}
          paymentId={`PAY-${String(nextSequence(state.payments.map((payment) => payment.id), 'PAY')).padStart(3, '0')}`}
          onClose={() => {
            setDrawerOpen(false);
            setPrefillInvoiceId(undefined);
          }}
          onSaved={(payment) => {
            addPayment(payment);
            toast({
              title: payment.type === 'Refund' ? 'Refund recorded' : 'Payment recorded',
              description: `${formatMoney(payment.amount)} · ${payment.id}`,
            });
            setDrawerOpen(false);
            setPrefillInvoiceId(undefined);
          }}
        />
      )}

      {viewing && (
        <PaymentDetailModal
          payment={viewing}
          onClose={() => setViewingId(null)}
          onViewInvoice={() => {
            setViewingId(null);
            navigate(`/invoices?invoice=${viewing.invoiceId}`);
          }}
          onDelete={() => {
            setViewingId(null);
            setDeleting(viewing);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deletePayment(deleting.id);
            toast({ title: 'Payment deleted', description: `${deleting.id} was removed from this invoice.` });
          }
          setDeleting(null);
        }}
        title="Delete this payment?"
        description={deleting ? `${deleting.id} · ${formatMoney(deleting.amount)} will be removed and the invoice balance recalculated.` : ''}
        confirmLabel="Delete payment"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Payment detail                                                             */
/* -------------------------------------------------------------------------- */

function PaymentDetailModal({
  payment,
  onClose,
  onViewInvoice,
  onDelete,
}: {
  payment: Payment;
  onClose: () => void;
  onViewInvoice: () => void;
  onDelete: () => void;
}) {
  const { state } = useAppData();
  const client = getClient(state, payment.clientId);
  const invoice = state.invoices.find((item) => item.id === payment.invoiceId);
  const ModeIcon = modeIcon[payment.mode];
  const isRefund = payment.type === 'Refund';

  return (
    <Modal
      open
      onClose={onClose}
      title="Payment details"
      description={`${payment.id} · ${formatDate(payment.date)}`}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger hover:bg-danger/10 hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
            <Button variant="primary" size="sm" onClick={onViewInvoice}>
              <FileText className="h-3.5 w-3.5" /> View invoice
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-secondary/40 p-4">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
              isRefund
                ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-400'
                : 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-400',
            )}
          >
            <Receipt className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn('text-lg font-semibold tracking-[-0.02em]', isRefund ? 'text-danger' : 'text-ink')}>
              {isRefund ? '−' : ''}
              {formatMoney(payment.amount)}
            </p>
            <p className="text-[10.5px] text-muted">
              {payment.type} · {payment.mode} · {payment.reference || 'No reference'}
            </p>
          </div>
          <StatusBadge status={paymentStatus(payment, state.invoices, state.payments)} />
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Client</dt>
            <dd className="mt-0.5 text-[11.5px] font-medium text-ink">{client?.businessName ?? '—'}</dd>
            <dd className="text-[10px] text-muted">{client?.name}</dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Invoice</dt>
            <dd className="mt-0.5 font-mono text-[11px] text-ink">{payment.invoiceId}</dd>
            <dd className="text-[10px] text-muted">
              {invoice ? `${formatMoney(invoiceTotal(invoice))} total` : 'Invoice removed'}
            </dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Payment date</dt>
            <dd className="mt-0.5 text-[11.5px] text-ink">{formatDate(payment.date)}</dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Method</dt>
            <dd className="mt-0.5 inline-flex items-center gap-1.5 text-[11.5px] text-ink">
              <ModeIcon className="h-3.5 w-3.5 text-muted" /> {payment.mode}
            </dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Reference</dt>
            <dd className="mt-0.5 text-[11.5px] text-ink">{payment.reference || '—'}</dd>
          </div>
          {invoice && (
            <div>
              <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Invoice balance</dt>
              <dd className="mt-0.5 text-[11.5px] font-medium text-accent-strong">
                {formatMoney(Math.max(0, invoiceTotal(invoice) - invoicePaid(invoice.id, state.payments)))}
              </dd>
            </div>
          )}
        </dl>

        <div>
          <p className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Notes</p>
          <p className="mt-1 rounded-lg border border-line bg-secondary/30 p-2.5 text-[11px] leading-relaxed text-soft">
            {payment.notes || 'No notes for this payment.'}
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Record payment form                                                        */
/* -------------------------------------------------------------------------- */

function RecordPaymentDrawer({
  prefillInvoiceId,
  paymentId,
  onClose,
  onSaved,
}: {
  prefillInvoiceId?: string;
  paymentId: string;
  onClose: () => void;
  onSaved: (payment: Payment) => void;
}) {
  const { state } = useAppData();
  const availableInvoices = useMemo(
    () => state.invoices.filter((invoice) => !invoice.draft).sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    [state.invoices],
  );
  const [invoiceId, setInvoiceId] = useState(prefillInvoiceId ?? '');
  const [type, setType] = useState<PaymentType>('Payment');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const invoice = availableInvoices.find((item) => item.id === invoiceId);
  const client = getClient(state, invoice?.clientId);
  const paid = invoice ? invoicePaid(invoice.id, state.payments) : 0;
  const total = invoice ? invoiceTotal(invoice) : 0;
  const remaining = invoice ? Math.max(0, total - paid) : 0;

  useEffect(() => {
    if (invoice && !amount) setAmount(String(remaining > 0 ? remaining : ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const selectInvoice = (id: string) => {
    setInvoiceId(id);
    const next = availableInvoices.find((item) => item.id === id);
    if (next) {
      const nextRemaining = Math.max(0, invoiceTotal(next) - invoicePaid(next.id, state.payments));
      if (type === 'Payment' && nextRemaining > 0) setAmount(String(nextRemaining));
    }
  };

  const switchType = (nextType: PaymentType) => {
    setType(nextType);
    if (!invoice) return;
    setAmount(nextType === 'Payment' ? String(remaining) : '');
  };

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    const value = Number(amount);
    if (!invoiceId) nextErrors.invoiceId = 'Choose the invoice this belongs to.';
    if (!amount || Number.isNaN(value) || value <= 0) nextErrors.amount = 'Enter an amount greater than zero.';
    if (!date) nextErrors.date = 'Choose a payment date.';
    if (invoice && value > 0) {
      if (type === 'Payment' && value > remaining + 0.01) {
        nextErrors.amount = `Amount exceeds the remaining balance of ${formatMoney(remaining)}.`;
      }
      if (type === 'Refund' && value > paid + 0.01) {
        nextErrors.amount = `Refund cannot exceed the amount received (${formatMoney(paid)}).`;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !invoice) return;

    setSaving(true);
    window.setTimeout(() => {
      onSaved({
        id: paymentId,
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        amount: value,
        date,
        mode,
        reference: reference.trim(),
        type,
        notes: notes.trim(),
        createdAt: todayISO(),
      });
      setSaving(false);
    }, 360);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={type === 'Refund' ? 'Record refund' : 'Record payment'}
      description={`${paymentId} · Link this entry to an invoice.`}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div className="text-[10.5px] text-muted">
            {invoice ? (
              <>Remaining <span className="font-medium text-ink">{formatMoney(remaining)}</span></>
            ) : (
              'Select an invoice to continue'
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={submit}>
              {type === 'Refund' ? 'Record refund' : 'Record payment'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-secondary/40 p-1">
          {(['Payment', 'Refund'] as PaymentType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => switchType(option)}
              className={cn(
                'rounded-md py-1.5 text-[11px] font-medium transition-colors',
                type === option ? 'bg-card text-ink shadow-card' : 'text-muted hover:text-soft',
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <Field label="Invoice" required error={errors.invoiceId}>
          <Select value={invoiceId} onChange={(event) => selectInvoice(event.target.value)}>
            <option value="">Select an invoice</option>
            {availableInvoices.map((item) => {
              const itemClient = getClient(state, item.clientId);
              const itemRemaining = Math.max(0, invoiceTotal(item) - invoicePaid(item.id, state.payments));
              return (
                <option key={item.id} value={item.id}>
                  {item.id} · {itemClient?.businessName ?? 'Client'} · {formatMoney(itemRemaining)} due
                </option>
              );
            })}
          </Select>
        </Field>

        {invoice && (
          <div className="rounded-lg border border-line bg-secondary/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-ink">{client?.businessName}</p>
                <p className="text-[9.5px] text-muted">{invoice.id} · Due {formatDate(invoice.dueDate)}</p>
              </div>
              <Badge tone={type === 'Refund' ? 'purple' : 'amber'}>
                {type === 'Refund' ? `${formatMoney(paid)} received` : `${formatMoney(remaining)} due`}
              </Badge>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-line pt-2.5 text-center">
              <div>
                <p className="text-[8.5px] uppercase tracking-wide text-muted">Total</p>
                <p className="text-[10.5px] font-medium text-ink">{formatMoney(total)}</p>
              </div>
              <div>
                <p className="text-[8.5px] uppercase tracking-wide text-muted">Paid</p>
                <p className="text-[10.5px] font-medium text-success">{formatMoney(paid)}</p>
              </div>
              <div>
                <p className="text-[8.5px] uppercase tracking-wide text-muted">Remaining</p>
                <p className="text-[10.5px] font-medium text-accent-strong">{formatMoney(remaining)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={type === 'Refund' ? 'Refund amount' : 'Amount'} required error={errors.amount}>
            <Input
              type="number"
              min="0"
              step="100"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Payment date" required error={errors.date}>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Payment method">
            <Select value={mode} onChange={(event) => setMode(event.target.value as PaymentMode)}>
              {PAYMENT_MODES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="Reference" hint="Transaction ID, cheque number, etc.">
            <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="UPI-8842" />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={type === 'Refund' ? 'Why was this refund issued?' : 'Add a note about this payment…'}
          />
        </Field>

        <div className="rounded-lg border border-line bg-secondary/40 p-3 text-[10px] leading-relaxed text-muted">
          {type === 'Refund'
            ? 'Refunds reduce the amount received for this invoice and are tracked separately.'
            : 'Payments immediately update the invoice balance and status.'}
        </div>
      </div>
    </Drawer>
  );
}
