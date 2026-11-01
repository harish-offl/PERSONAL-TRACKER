import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Copy,
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
  Printer,
  Send,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { Invoice, InvoiceItem, InvoiceStatus } from '../types';
import {
  addDays,
  cn,
  downloadCSV,
  formatDate,
  formatMoney,
  invoiceTax,
  invoiceTotal,
  invoiceStatus,
  invoicePaid,
  invoiceSubtotal,
  nextSequence,
  todayISO,
  uid,
} from '../lib/utils';
import { getClient } from '../lib/selectors';
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
  IconButton,
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
import { downloadInvoicePDF, printInvoice } from '../lib/invoiceFiles';

type InvoiceSort = 'newest' | 'due' | 'amount' | 'status';

interface EditorState {
  open: boolean;
  invoice: Invoice | null;
  clientId?: string;
  projectId?: string;
}

export function InvoicesPage() {
  const { state, addInvoice, updateInvoice, deleteInvoice, duplicateInvoice, getNextInvoiceId } = useAppData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus[]>([]);
  const [sort, setSort] = useState<InvoiceSort>('newest');
  const [editor, setEditor] = useState<EditorState>({ open: false, invoice: null });
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);

  useEffect(() => {
    const create = searchParams.get('create');
    const invoiceId = searchParams.get('invoice');
    if (invoiceId) setViewingId(invoiceId);
    if (create) {
      setEditor({
        open: true,
        invoice: null,
        clientId: searchParams.get('client') ?? '',
        projectId: searchParams.get('project') ?? '',
      });
    }
    if (create || invoiceId) {
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      next.delete('invoice');
      next.delete('client');
      next.delete('project');
      next.delete('t');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const viewing = viewingId ? state.invoices.find((invoice) => invoice.id === viewingId) ?? null : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.invoices
      .filter((invoice) => {
        const client = getClient(state, invoice.clientId);
        const project = state.projects.find((item) => item.id === invoice.projectId);
        const status = invoiceStatus(invoice, state.payments);
        const haystack = `${invoice.id} ${client?.businessName ?? ''} ${client?.name ?? ''} ${project?.name ?? ''}`.toLowerCase();
        return (!q || haystack.includes(q)) && (statusFilter.length === 0 || statusFilter.includes(status));
      })
      .sort((a, b) => {
        if (sort === 'due') return a.dueDate.localeCompare(b.dueDate);
        if (sort === 'amount') return invoiceTotal(b) - invoiceTotal(a);
        if (sort === 'status') return invoiceStatus(a, state.payments).localeCompare(invoiceStatus(b, state.payments));
        return b.issueDate.localeCompare(a.issueDate);
      });
  }, [state, search, statusFilter, sort]);

  const stats = useMemo(() => {
    const nonDraft = state.invoices.filter((invoice) => !invoice.draft);
    const invoiced = nonDraft.reduce((total, invoice) => total + invoiceTotal(invoice), 0);
    const collected = nonDraft.reduce(
      (total, invoice) => total + Math.min(invoiceTotal(invoice), invoicePaid(invoice.id, state.payments)),
      0,
    );
    const partial = nonDraft.filter((invoice) => invoiceStatus(invoice, state.payments) === 'Partially Paid');
    const overdue = nonDraft.filter((invoice) => invoiceStatus(invoice, state.payments) === 'Overdue');
    const partialAmount = partial.reduce(
      (total, invoice) => total + Math.max(0, invoiceTotal(invoice) - invoicePaid(invoice.id, state.payments)),
      0,
    );
    const overdueAmount = overdue.reduce(
      (total, invoice) => total + Math.max(0, invoiceTotal(invoice) - invoicePaid(invoice.id, state.payments)),
      0,
    );
    return {
      invoiced,
      collected,
      paidCount: nonDraft.filter((invoice) => invoiceStatus(invoice, state.payments) === 'Paid').length,
      partial,
      partialAmount,
      overdue,
      overdueAmount,
      draftCount: state.invoices.filter((invoice) => invoice.draft).length,
    };
  }, [state]);

  const openCreate = () => setEditor({ open: true, invoice: null });

  const openEdit = (invoice: Invoice) => {
    setViewingId(null);
    setEditor({ open: true, invoice });
  };

  const handleDownload = (invoice: Invoice) => {
    downloadInvoicePDF({
      invoice,
      client: getClient(state, invoice.clientId),
      project: state.projects.find((project) => project.id === invoice.projectId),
      payments: state.payments,
      settings: state.settings,
    });
    toast({ title: 'Invoice downloaded', description: `${invoice.id}.pdf` });
  };

  const handlePrint = (invoice: Invoice) => {
    const ok = printInvoice({
      invoice,
      client: getClient(state, invoice.clientId),
      project: state.projects.find((project) => project.id === invoice.projectId),
      payments: state.payments,
      settings: state.settings,
    });
    if (!ok) {
      toast({ title: 'Popup blocked', description: 'Allow popups to print this invoice.', variant: 'error' });
    }
  };

  const handleDuplicate = (invoice: Invoice) => {
    duplicateInvoice(invoice.id);
    toast({ title: 'Invoice duplicated', description: `A draft copy of ${invoice.id} was created.` });
  };

  const exportInvoices = () => {
    downloadCSV('personal-tracker-invoices.csv', [
      ['Invoice', 'Client', 'Project', 'Issue date', 'Due date', 'Total', 'Paid', 'Remaining', 'Status'],
      ...filtered.map((invoice) => {
        const client = getClient(state, invoice.clientId);
        const project = state.projects.find((item) => item.id === invoice.projectId);
        return [
          invoice.id,
          client?.businessName ?? '',
          project?.name ?? '',
          invoice.issueDate,
          invoice.dueDate,
          invoiceTotal(invoice),
          invoicePaid(invoice.id, state.payments),
          Math.max(0, invoiceTotal(invoice) - invoicePaid(invoice.id, state.payments)),
          invoiceStatus(invoice, state.payments),
        ];
      }),
    ]);
    toast({ title: 'Invoices exported', description: 'CSV download started.' });
  };

  const handleSaved = (invoice: Invoice, isNew: boolean) => {
    if (isNew) {
      addInvoice(invoice);
      toast({ title: invoice.draft ? 'Invoice draft saved' : 'Invoice created', description: invoice.id });
    } else {
      updateInvoice(invoice);
      toast({ title: 'Invoice updated', description: invoice.id });
    }
    setEditor({ open: false, invoice: null });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invoices"
        description="Create, manage, and monitor your invoices."
        badge={<Badge tone="gray">{state.invoices.length} total</Badge>}
        actions={
          <Button variant="primary" size="md" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Create Invoice
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Total Invoiced" value={formatMoney(stats.invoiced)} hint={`${state.invoices.length - stats.draftCount} sent invoices`} />
        <StatCard icon={Wallet} label="Paid" value={formatMoney(stats.collected)} hint={`${stats.paidCount} fully paid`} tone="accent" />
        <StatCard icon={FileText} label="Partially Paid" value={formatMoney(stats.partialAmount)} hint={`${stats.partial.length} invoices in progress`} />
        <StatCard icon={FileText} label="Overdue" value={formatMoney(stats.overdueAmount)} hint={`${stats.overdue.length} invoices past due`} />
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search invoices…" className="w-full sm:w-56" />
          <FilterMenu
            label="Status"
            options={(['Draft', 'Sent', 'Partially Paid', 'Overdue', 'Paid'] as InvoiceStatus[]).map((status) => ({
              value: status,
              label: status,
              count: state.invoices.filter((invoice) => invoiceStatus(invoice, state.payments) === status).length,
            }))}
            selected={statusFilter}
            onChange={setStatusFilter}
            onClear={() => setStatusFilter([])}
          />
          <div className="hidden sm:block">
            <Select value={sort} onChange={(event) => setSort(event.target.value as InvoiceSort)} className="w-[160px]">
              <option value="newest">Sort: Newest</option>
              <option value="due">Sort: Due date</option>
              <option value="amount">Sort: Amount</option>
              <option value="status">Sort: Status</option>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={exportInvoices}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button variant="primary" size="md" onClick={openCreate} className="hidden sm:inline-flex">
            <Plus className="h-3.5 w-3.5" />
            New Invoice
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description="Adjust your filters or create an invoice to start billing your clients."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Create invoice
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
          <DataTable minWidth={1180}>
            <thead>
              <tr>
                <Th>Invoice Number</Th>
                <Th>Client</Th>
                <Th>Project</Th>
                <Th>Invoice Date</Th>
                <Th>Due Date</Th>
                <Th align="right">Invoice Total</Th>
                <Th align="right">Amount Paid</Th>
                <Th align="right">Remaining</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => {
                const client = getClient(state, invoice.clientId);
                const project = state.projects.find((item) => item.id === invoice.projectId);
                const total = invoiceTotal(invoice);
                const paid = invoicePaid(invoice.id, state.payments);
                const remaining = Math.max(0, total - paid);
                const status = invoiceStatus(invoice, state.payments);
                return (
                  <TableRow key={invoice.id} onClick={() => setViewingId(invoice.id)}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-secondary/60 text-muted">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-mono text-[11px] font-medium text-ink">{invoice.id}</span>
                      </div>
                    </Td>
                    <Td><span className="text-[11px] font-medium text-ink">{client?.businessName ?? '—'}</span></Td>
                    <Td><span className="text-[11px]">{project?.name ?? '—'}</span></Td>
                    <Td><span className="whitespace-nowrap text-[11px]">{formatDate(invoice.issueDate)}</span></Td>
                    <Td>
                      <span className={cn('whitespace-nowrap text-[11px]', status === 'Overdue' && 'font-medium text-danger')}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    </Td>
                    <Td align="right"><span className="whitespace-nowrap text-[11.5px] font-medium text-ink">{formatMoney(total)}</span></Td>
                    <Td align="right"><span className="whitespace-nowrap text-[11.5px] text-soft">{formatMoney(paid)}</span></Td>
                    <Td align="right">
                      <span className={cn('whitespace-nowrap text-[11.5px] font-medium', remaining > 0 ? 'text-accent-strong' : 'text-success')}>
                        {remaining > 0 ? formatMoney(remaining) : 'Settled'}
                      </span>
                    </Td>
                    <Td><StatusBadge status={status} /></Td>
                    <Td align="right">
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <ActionMenu
                          label={`Actions for ${invoice.id}`}
                          items={[
                            { label: 'View invoice', icon: Eye, onClick: () => setViewingId(invoice.id) },
                            { label: 'Edit invoice', icon: Pencil, onClick: () => openEdit(invoice) },
                            { label: 'Record payment', icon: Wallet, onClick: () => navigate(`/payments?create=1&invoice=${invoice.id}`) },
                            { label: 'Download PDF', icon: Download, onClick: () => handleDownload(invoice), separator: true },
                            { label: 'Print', icon: Printer, onClick: () => handlePrint(invoice) },
                            { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(invoice) },
                            { label: 'Delete invoice', icon: Trash2, onClick: () => setDeleting(invoice), danger: true, separator: true },
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

      {editor.open && (
        <InvoiceEditor
          initialInvoice={editor.invoice}
          prefillClientId={editor.clientId}
          prefillProjectId={editor.projectId}
          nextInvoiceId={getNextInvoiceId()}
          onClose={() => setEditor({ open: false, invoice: null })}
          onSaved={handleSaved}
        />
      )}

      {viewing && (
        <InvoicePreviewModal
          invoice={viewing}
          onClose={() => setViewingId(null)}
          onEdit={() => openEdit(viewing)}
          onPrint={() => handlePrint(viewing)}
          onDownload={() => handleDownload(viewing)}
          onRecordPayment={() => {
            setViewingId(null);
            navigate(`/payments?create=1&invoice=${viewing.id}`);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteInvoice(deleting.id);
            toast({ title: 'Invoice deleted', description: `${deleting.id} and its payments were removed.` });
          }
          setDeleting(null);
        }}
        title="Delete this invoice?"
        description={
          deleting
            ? `${deleting.id} will be permanently removed along with any payments recorded against it.`
            : ''
        }
        confirmLabel="Delete invoice"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Invoice preview modal                                                      */
/* -------------------------------------------------------------------------- */

function InvoicePreviewModal({
  invoice,
  onClose,
  onEdit,
  onPrint,
  onDownload,
  onRecordPayment,
}: {
  invoice: Invoice;
  onClose: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onRecordPayment: () => void;
}) {
  const { state } = useAppData();
  const client = getClient(state, invoice.clientId);
  const project = state.projects.find((item) => item.id === invoice.projectId);
  const paid = invoicePaid(invoice.id, state.payments);
  const total = invoiceTotal(invoice);
  const remaining = Math.max(0, total - paid);
  const status = invoiceStatus(invoice, state.payments);

  return (
    <Modal
      open
      onClose={onClose}
      title="Invoice preview"
      description={`${invoice.id} · ${client?.businessName ?? 'Client'}`}
      size="xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-[10.5px] text-muted">Remaining {formatMoney(remaining)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button variant="secondary" size="sm" onClick={onPrint}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="secondary" size="sm" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="primary" size="sm" onClick={onRecordPayment}>
              <Wallet className="h-3.5 w-3.5" /> Record payment
            </Button>
          </div>
        </div>
      }
    >
      <InvoiceSheet invoice={invoice} />
      {project && (
        <p className="mt-3 text-center text-[10.5px] text-muted">
          Billed against <span className="font-medium text-soft">{project.name}</span> · {project.code}
        </p>
      )}
    </Modal>
  );
}

function InvoiceSheet({ invoice }: { invoice: Invoice }) {
  const { state } = useAppData();
  const client = getClient(state, invoice.clientId);
  const project = state.projects.find((item) => item.id === invoice.projectId);
  const paid = invoicePaid(invoice.id, state.payments);
  const total = invoiceTotal(invoice);
  const remaining = Math.max(0, total - paid);
  const status = invoiceStatus(invoice, state.payments);
  const business = state.settings.invoice;

  return (
    <div className="rounded-xl border border-line bg-white p-5 text-[#080808] shadow-card sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[#EAEAEA] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C02050] to-[#9F1239] text-white">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold">{business.businessName || state.settings.profile.name}</p>
              <p className="text-[9.5px] text-[#666666]">{state.settings.profile.email}</p>
            </div>
          </div>
          {business.gstin && <p className="mt-2 text-[9.5px] text-[#666666]">GSTIN: {business.gstin}</p>}
        </div>
        <div className="sm:text-right">
          <Badge tone={status === 'Paid' ? 'green' : status === 'Overdue' ? 'red' : status === 'Draft' ? 'gray' : 'amber'} dot>
            {status}
          </Badge>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">INVOICE</p>
          <p className="font-mono text-[10px] text-[#666666]">{invoice.id}</p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-[#EAEAEA] py-4 sm:grid-cols-2">
        <div>
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-[#858585]">Bill to</p>
          <p className="mt-1 text-[12px] font-semibold">{client?.businessName ?? 'Client'}</p>
          <p className="text-[10px] text-[#666666]">{client?.name}</p>
          <p className="text-[10px] text-[#666666]">{client?.email}</p>
          <p className="text-[10px] text-[#666666]">{client?.phone}</p>
        </div>
        <div className="space-y-1 text-[10px] sm:text-right">
          <p><span className="text-[#858585]">Issued: </span>{formatDate(invoice.issueDate)}</p>
          <p><span className="text-[#858585]">Due: </span>{formatDate(invoice.dueDate)}</p>
          {project && <p><span className="text-[#858585]">Project: </span>{project.name}</p>}
          <p><span className="text-[#858585]">Terms: </span>{invoice.terms}</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr className="rounded bg-[#F7F7F7]">
              <th className="rounded-l-md px-2 py-2 text-[8.5px] font-semibold uppercase tracking-wide text-[#666666]">Description</th>
              <th className="px-2 py-2 text-right text-[8.5px] font-semibold uppercase tracking-wide text-[#666666]">Qty</th>
              <th className="px-2 py-2 text-right text-[8.5px] font-semibold uppercase tracking-wide text-[#666666]">Rate</th>
              <th className="rounded-r-md px-2 py-2 text-right text-[8.5px] font-semibold uppercase tracking-wide text-[#666666]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-[#EAEAEA] last:border-0">
                <td className="px-2 py-2.5 text-[10.5px]">{item.description || 'Item'}</td>
                <td className="px-2 py-2.5 text-right text-[10.5px] text-[#666666]">{item.quantity}</td>
                <td className="px-2 py-2.5 text-right text-[10.5px] text-[#666666]">{formatMoney(item.rate)}</td>
                <td className="px-2 py-2.5 text-right text-[10.5px] font-medium">{formatMoney(item.quantity * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-[260px] space-y-1.5 text-[10.5px]">
          <div className="flex justify-between text-[#666666]"><span>Subtotal</span><span>{formatMoney(invoiceSubtotal(invoice))}</span></div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-[#666666]"><span>Discount</span><span>− {formatMoney(invoice.discount)}</span></div>
          )}
          {invoice.taxRate > 0 && (
            <div className="flex justify-between text-[#666666]"><span>Tax ({invoice.taxRate}%)</span><span>{formatMoney(invoiceTax(invoice))}</span></div>
          )}
          <div className="flex justify-between border-t border-[#EAEAEA] pt-2 text-[12px] font-semibold"><span>Grand total</span><span>{formatMoney(total)}</span></div>
          <div className="flex justify-between text-[#666666]"><span>Amount paid</span><span>{formatMoney(paid)}</span></div>
          <div className="flex justify-between font-semibold text-[#9F1239]"><span>Balance due</span><span>{formatMoney(remaining)}</span></div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-[#EAEAEA] pt-4 sm:grid-cols-2">
        <div>
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-[#858585]">Notes</p>
          <p className="mt-1 text-[9.5px] leading-relaxed text-[#666666]">{invoice.notes || 'Thank you for your business.'}</p>
        </div>
        <div>
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-[#858585]">Payment details</p>
          <p className="mt-1 text-[9.5px] leading-relaxed text-[#666666]">{business.bankDetails}</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Invoice editor                                                             */
/* -------------------------------------------------------------------------- */

function InvoiceEditor({
  initialInvoice,
  prefillClientId,
  prefillProjectId,
  nextInvoiceId,
  onClose,
  onSaved,
}: {
  initialInvoice: Invoice | null;
  prefillClientId?: string;
  prefillProjectId?: string;
  nextInvoiceId: string;
  onClose: () => void;
  onSaved: (invoice: Invoice, isNew: boolean) => void;
}) {
  const { state } = useAppData();
  const [clientId, setClientId] = useState(initialInvoice?.clientId ?? prefillClientId ?? '');
  const [projectId, setProjectId] = useState(initialInvoice?.projectId ?? prefillProjectId ?? '');
  const [issueDate, setIssueDate] = useState(initialInvoice?.issueDate ?? todayISO());
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate ?? addDays(todayISO(), 15),
  );
  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items ?? [{ id: uid('itm'), description: '', quantity: 1, rate: 0 }],
  );
  const [discount, setDiscount] = useState(String(initialInvoice?.discount ?? 0));
  const [taxRate, setTaxRate] = useState(String(initialInvoice?.taxRate ?? state.settings.invoice.defaultTax));
  const [notes, setNotes] = useState(initialInvoice?.notes ?? '');
  const [terms, setTerms] = useState(initialInvoice?.terms ?? state.settings.invoice.paymentTerms);
  const [draft, setDraft] = useState(initialInvoice?.draft ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const projects = clientId
    ? state.projects.filter((project) => project.clientId === clientId)
    : state.projects;

  const invoicePreview: Invoice = {
    id: initialInvoice?.id ?? nextInvoiceId,
    clientId,
    projectId: projectId || undefined,
    issueDate,
    dueDate,
    items,
    discount: Number(discount) || 0,
    taxRate: Number(taxRate) || 0,
    notes,
    terms,
    draft,
    createdAt: initialInvoice?.createdAt ?? todayISO(),
  };

  const subtotal = invoiceSubtotal(invoicePreview);
  const tax = invoiceTax(invoicePreview);
  const total = invoiceTotal(invoicePreview);
  const client = getClient(state, clientId);
  const project = state.projects.find((item) => item.id === projectId);

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    setItems((current) => [...current, { id: uid('itm'), description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));
  };

  const save = (asDraft: boolean) => {
    const nextErrors: Record<string, string> = {};
    if (!clientId) nextErrors.clientId = 'Choose a client.';
    if (!issueDate) nextErrors.issueDate = 'Add an invoice date.';
    if (!dueDate) nextErrors.dueDate = 'Add a due date.';
    if (issueDate && dueDate && dueDate < issueDate) nextErrors.dueDate = 'Due date must be on or after the invoice date.';
    const validItems = items.filter((item) => item.description.trim());
    if (!validItems.length) nextErrors.items = 'Add at least one line item with a description.';
    if (items.some((item) => item.quantity <= 0)) nextErrors.items = 'Quantity must be greater than zero.';
    if (items.some((item) => item.rate < 0)) nextErrors.items = 'Rate cannot be negative.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    window.setTimeout(() => {
      const invoice: Invoice = {
        ...invoicePreview,
        clientId,
        projectId: projectId || undefined,
        items: items.map((item) => ({
          ...item,
          description: item.description.trim(),
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
        })),
        discount: Number(discount) || 0,
        taxRate: Number(taxRate) || 0,
        notes: notes.trim(),
        terms: terms.trim(),
        draft: asDraft,
      };
      onSaved(invoice, !initialInvoice);
      setSaving(false);
    }, 380);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={initialInvoice ? 'Edit invoice' : 'Create invoice'}
      description={initialInvoice ? `${initialInvoice.id} · Update the invoice and its line items.` : `${nextInvoiceId} · Build a professional invoice with a live preview.`}
      size="2xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="text-[10.5px] text-muted">
            Total <span className="ml-1 text-[12px] font-semibold text-ink">{formatMoney(total)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="secondary" size="sm" loading={saving} onClick={() => save(true)}>
              Save as draft
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={() => save(false)}>
              <Send className="h-3.5 w-3.5" />
              {initialInvoice ? 'Save invoice' : 'Create invoice'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Client" required error={errors.clientId}>
              <Select
                value={clientId}
                onChange={(event) => {
                  setClientId(event.target.value);
                  setProjectId('');
                }}
              >
                <option value="">Select a client</option>
                {state.clients.map((item) => (
                  <option key={item.id} value={item.id}>{item.businessName}</option>
                ))}
              </Select>
            </Field>
            <Field label="Project" hint="Optional — link this invoice to a project.">
              <Select
                value={projectId}
                onChange={(event) => {
                  const value = event.target.value;
                  setProjectId(value);
                  const nextProject = state.projects.find((item) => item.id === value);
                  if (nextProject && !clientId) setClientId(nextProject.clientId);
                }}
              >
                <option value="">No project</option>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Invoice date" required error={errors.issueDate}>
              <Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
            </Field>
            <Field label="Due date" required error={errors.dueDate}>
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </Field>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[12px] font-medium text-ink">Line items <span className="text-accent-strong">*</span></p>
              <Button variant="ghost" size="sm" onClick={addItem} className="text-accent-strong hover:text-accent-strong">
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </div>
            {errors.items && <p className="mb-2 text-[11px] text-danger">{errors.items}</p>}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-line bg-secondary/30 p-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-card text-[9px] font-semibold text-muted">
                      {index + 1}
                    </div>
                    <Input
                      value={item.description}
                      onChange={(event) => updateItem(item.id, { description: event.target.value })}
                      placeholder="Describe the work or service"
                      className="flex-1"
                    />
                    <IconButton
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      aria-label="Remove line item"
                      className="mt-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 pl-8">
                    <Field label="Qty">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })}
                      />
                    </Field>
                    <Field label="Rate">
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={item.rate}
                        onChange={(event) => updateItem(item.id, { rate: Number(event.target.value) })}
                      />
                    </Field>
                  </div>
                  <p className="mt-1 pl-8 text-right text-[10px] text-muted">
                    Amount <span className="font-semibold text-ink">{formatMoney((Number(item.quantity) || 0) * (Number(item.rate) || 0))}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Discount" hint="Flat amount deducted before tax.">
              <Input type="number" min="0" step="100" value={discount} onChange={(event) => setDiscount(event.target.value)} />
            </Field>
            <Field label="Tax rate (%)">
              <Input type="number" min="0" step="0.5" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Thank you for your business." className="min-h-[64px]" />
          </Field>
          <Field label="Payment terms">
            <Input value={terms} onChange={(event) => setTerms(event.target.value)} placeholder="Net 15" />
          </Field>

          <label className="flex items-start gap-2.5 rounded-lg border border-line bg-secondary/40 p-3">
            <input type="checkbox" checked={draft} onChange={(event) => setDraft(event.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-accent" />
            <span>
              <span className="block text-[11px] font-medium text-ink">Keep as draft</span>
              <span className="mt-0.5 block text-[10px] text-muted">Drafts are excluded from invoiced totals until you send them.</span>
            </span>
          </label>
        </div>

        <div className="xl:sticky xl:top-0 xl:self-start">
          <div className="rounded-xl border border-line bg-secondary/40 p-2">
            <div className="rounded-lg border border-line bg-white p-4 text-[#080808] shadow-card">
              <div className="flex items-start justify-between gap-2 border-b border-[#EAEAEA] pb-3">
                <div>
                  <p className="text-[11px] font-semibold">{state.settings.invoice.businessName || state.settings.profile.name}</p>
                  <p className="mt-0.5 text-[8.5px] text-[#666666]">{state.settings.profile.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-semibold uppercase tracking-wide text-[#858585]">Invoice</p>
                  <p className="font-mono text-[9px] text-[#666666]">{initialInvoice?.id ?? nextInvoiceId}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-[#EAEAEA] py-3">
                <div>
                  <p className="text-[8px] uppercase tracking-wide text-[#858585]">Bill to</p>
                  <p className="mt-0.5 text-[10px] font-semibold">{client?.businessName ?? 'Select a client'}</p>
                  <p className="text-[8.5px] text-[#666666]">{client?.name ?? '—'}</p>
                </div>
                <Badge tone={draft ? 'gray' : 'blue'}>{draft ? 'Draft' : 'Issued'}</Badge>
              </div>
              <div className="space-y-1.5 py-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 text-[8.5px]">
                    <span className="max-w-[65%] text-[#666666]">
                      {item.description || 'Line item'} <span className="text-[#858585]">× {item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatMoney((Number(item.quantity) || 0) * (Number(item.rate) || 0))}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 border-t border-[#EAEAEA] pt-2 text-[8.5px]">
                <div className="flex justify-between text-[#666666]"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
                {Number(discount) > 0 && <div className="flex justify-between text-[#666666]"><span>Discount</span><span>− {formatMoney(Number(discount))}</span></div>}
                {Number(taxRate) > 0 && <div className="flex justify-between text-[#666666]"><span>Tax ({taxRate}%)</span><span>{formatMoney(tax)}</span></div>}
                <div className="flex justify-between border-t border-[#EAEAEA] pt-1.5 text-[10px] font-semibold"><span>Total</span><span>{formatMoney(total)}</span></div>
              </div>
              <p className="mt-3 text-[8px] text-[#858585]">Due {formatDate(dueDate)} · {terms || 'No terms'}</p>
            </div>
          </div>
          <p className="mt-2 text-center text-[9.5px] text-muted">Live preview — updates as you type</p>
        </div>
      </div>
    </Drawer>
  );
}
