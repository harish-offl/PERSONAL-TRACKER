import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Clock,
  Download,
  FileText,
  FolderKanban,
  Printer,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { InvoiceStatus, ProjectStatus, TaskStatus } from '../types';
import {
  cn,
  downloadCSV,
  formatDateShort,
  formatDuration,
  formatMoney,
  invoicePaid,
  invoiceStatus,
  invoiceTotal,
  sum,
  workDuration,
} from '../lib/utils';
import { getClient, invoiceBalance, totalOutstanding, totalReceived } from '../lib/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionCard, StatCard } from '../components/shared/cards';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Progress,
  Select,
  StatusBadge,
  Tabs,
  Td,
  Th,
  TableRow,
  useToast,
} from '../components/ui';

type ReportRange = '30d' | '90d' | '12m' | 'all';
type ReportView = 'financial' | 'projects' | 'productivity';

const RANGE_LABEL: Record<ReportRange, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
  all: 'All time',
};

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  Paid: '#16A34A',
  'Partially Paid': '#F59E0B',
  Sent: '#3B82F6',
  Overdue: '#EF4444',
  Draft: '#858585',
};

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  Active: '#6558D3',
  Planning: '#3B82F6',
  'On Hold': '#F59E0B',
  Completed: '#16A34A',
};

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#858585',
  inprogress: '#3B82F6',
  pending: '#F59E0B',
  completed: '#16A34A',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  pending: 'Pending',
  completed: 'Completed',
};

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #EAEAEA',
  boxShadow: '0 8px 24px -12px rgba(16,24,40,0.2)',
  fontSize: 11,
  padding: '6px 10px',
  background: '#FFFFFF',
  color: '#080808',
};

const compactNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

function monthlySeries(payments: { date: string; amount: number; type: string }[], months: number) {
  const now = new Date();
  return Array.from({ length: months }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1) + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const rows = payments.filter((payment) => payment.date.startsWith(key));
    return {
      month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
      income: sum(rows.map((payment) => (payment.type === 'Refund' ? -payment.amount : payment.amount))),
    };
  });
}

export function ReportsPage() {
  const { state } = useAppData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [range, setRange] = useState<ReportRange>('90d');
  const [view, setView] = useState<ReportView>('financial');
  const [clientFilter, setClientFilter] = useState('all');

  const cutoff = useMemo(() => {
    if (range === 'all') return '0000-00-00';
    const date = new Date();
    if (range === '30d') date.setDate(date.getDate() - 30);
    if (range === '90d') date.setDate(date.getDate() - 90);
    if (range === '12m') date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().slice(0, 10);
  }, [range]);

  const inRange = (iso: string) => iso >= cutoff;

  const periodPayments = useMemo(
    () =>
      state.payments.filter(
        (payment) => inRange(payment.date) && (clientFilter === 'all' || payment.clientId === clientFilter),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.payments, cutoff, clientFilter],
  );

  const periodInvoices = useMemo(
    () =>
      state.invoices.filter(
        (invoice) => inRange(invoice.issueDate) && (clientFilter === 'all' || invoice.clientId === clientFilter),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.invoices, cutoff, clientFilter],
  );

  const periodWork = useMemo(
    () =>
      state.workEntries.filter(
        (entry) => inRange(entry.date) && (clientFilter === 'all' || entry.clientId === clientFilter),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.workEntries, cutoff, clientFilter],
  );

  const clientInvoices = useMemo(
    () => state.invoices.filter((invoice) => clientFilter === 'all' || invoice.clientId === clientFilter),
    [state.invoices, clientFilter],
  );

  const stats = useMemo(() => {
    const income = totalReceived(periodPayments);
    const invoiced = sum(periodInvoices.filter((invoice) => !invoice.draft).map(invoiceTotal));
    const outstanding = totalOutstanding(clientInvoices, state.payments);
    const refunds = sum(
      periodPayments.filter((payment) => payment.type === 'Refund').map((payment) => payment.amount),
    );
    const minutes = sum(periodWork.map((entry) => workDuration(entry.startTime, entry.endTime)));
    const hours = minutes / 60;
    const paymentCount = periodPayments.filter((payment) => payment.type === 'Payment').length;
    const avgPayment = paymentCount
      ? sum(periodPayments.filter((payment) => payment.type === 'Payment').map((payment) => payment.amount)) /
        paymentCount
      : 0;
    return { income, invoiced, outstanding, refunds, minutes, hours, avgPayment, paymentCount };
  }, [periodPayments, periodInvoices, clientInvoices, periodWork, state.payments]);

  const incomeSeries = useMemo(() => {
    const months = range === '30d' ? 3 : range === '90d' ? 6 : 12;
    return monthlySeries(periodPayments, months);
  }, [periodPayments, range]);

  const revenueByClient = useMemo(() => {
    return state.clients
      .filter((client) => clientFilter === 'all' || client.id === clientFilter)
      .map((client) => {
        const received = totalReceived(periodPayments.filter((payment) => payment.clientId === client.id));
        return { name: client.businessName, fullName: client.businessName, received, id: client.id };
      })
      .filter((row) => row.received > 0)
      .sort((a, b) => b.received - a.received)
      .slice(0, 7);
  }, [state.clients, periodPayments, clientFilter]);

  const invoiceStatusData = useMemo(() => {
    const order: InvoiceStatus[] = ['Paid', 'Partially Paid', 'Sent', 'Overdue', 'Draft'];
    return order
      .map((status) => ({
        name: status,
        value: clientInvoices.filter((invoice) => invoiceStatus(invoice, state.payments) === status).length,
        color: INVOICE_STATUS_COLORS[status],
      }))
      .filter((item) => item.value > 0);
  }, [clientInvoices, state.payments]);

  const clientPerformance = useMemo(() => {
    return state.clients
      .filter((client) => clientFilter === 'all' || client.id === clientFilter)
      .map((client) => {
        const projects = state.projects.filter((project) => project.clientId === client.id);
        const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id && !invoice.draft);
        const received = invoices.reduce(
          (total, invoice) => total + Math.min(invoiceTotal(invoice), invoicePaid(invoice.id, state.payments)),
          0,
        );
        const outstanding = invoices.reduce((total, invoice) => total + invoiceBalance(invoice, state.payments), 0);
        return {
          client,
          projects: projects.length,
          projectValue: projects.reduce((total, project) => total + project.value, 0),
          invoiced: invoices.reduce((total, invoice) => total + invoiceTotal(invoice), 0),
          received,
          outstanding,
        };
      })
      .sort((a, b) => b.received - a.received);
  }, [state, clientFilter]);

  const projectStatusData = useMemo(() => {
    const order: ProjectStatus[] = ['Active', 'Planning', 'On Hold', 'Completed'];
    return order
      .map((status) => ({
        name: status,
        value: state.projects
          .filter((project) => project.status === status && (clientFilter === 'all' || project.clientId === clientFilter))
          .reduce((total, project) => total + project.value, 0),
        count: state.projects.filter(
          (project) => project.status === status && (clientFilter === 'all' || project.clientId === clientFilter),
        ).length,
        color: PROJECT_STATUS_COLORS[status],
      }))
      .filter((item) => item.count > 0);
  }, [state.projects, clientFilter]);

  const projectRows = useMemo(() => {
    return state.projects
      .filter((project) => clientFilter === 'all' || project.clientId === clientFilter)
      .map((project) => {
        const invoices = state.invoices.filter((invoice) => invoice.projectId === project.id && !invoice.draft);
        const invoiced = invoices.reduce((total, invoice) => total + invoiceTotal(invoice), 0);
        const received = invoices.reduce(
          (total, invoice) => total + Math.min(invoiceTotal(invoice), invoicePaid(invoice.id, state.payments)),
          0,
        );
        return { project, invoiced, received };
      })
      .sort((a, b) => b.project.value - a.project.value);
  }, [state, clientFilter]);

  const categoryData = useMemo(() => {
    const groups = new Map<string, number>();
    periodWork.forEach((entry) => {
      const minutes = workDuration(entry.startTime, entry.endTime);
      groups.set(entry.category, (groups.get(entry.category) ?? 0) + minutes);
    });
    return Array.from(groups.entries())
      .map(([name, minutes]) => ({ name, hours: Math.round((minutes / 60) * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours);
  }, [periodWork]);

  const weeklyHours = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      const entries = periodWork.filter((entry) => entry.date === iso);
      const minutes = sum(entries.map((entry) => workDuration(entry.startTime, entry.endTime)));
      return {
        label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
        hours: Math.round((minutes / 60) * 10) / 10,
      };
    });
  }, [periodWork]);

  const taskStatusData = useMemo(() => {
    const order: TaskStatus[] = ['completed', 'inprogress', 'pending', 'todo'];
    const tasks = state.tasks.filter((task) => clientFilter === 'all' || task.clientId === clientFilter);
    return order.map((status) => ({
      name: TASK_STATUS_LABELS[status],
      value: tasks.filter((task) => task.status === status).length,
      color: TASK_STATUS_COLORS[status],
    }));
  }, [state.tasks, clientFilter]);

  const recentWork = useMemo(
    () => [...periodWork].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [periodWork],
  );

  const rangeOptions = (Object.keys(RANGE_LABEL) as ReportRange[]).map((value) => ({
    value,
    label: RANGE_LABEL[value],
  }));

  const exportReport = () => {
    downloadCSV(`personal-tracker-report-${range}.csv`, [
      ['Personal Tracker report', RANGE_LABEL[range]],
      [],
      ['Metric', 'Value'],
      ['Net income', stats.income],
      ['Invoiced', stats.invoiced],
      ['Outstanding', stats.outstanding],
      ['Refunds', stats.refunds],
      ['Hours logged', Math.round(stats.hours * 10) / 10],
      ['Average payment', Math.round(stats.avgPayment)],
      [],
      ['Client', 'Projects', 'Invoiced', 'Received', 'Outstanding'],
      ...clientPerformance.map((row) => [
        row.client.businessName,
        row.projects,
        row.invoiced,
        row.received,
        row.outstanding,
      ]),
    ]);
    toast({ title: 'Report exported', description: `${RANGE_LABEL[range]} · CSV download started.` });
  };

  useEffect(() => {
    if (searchParams.get('export') !== '1') return;
    exportReport();
    const next = new URLSearchParams(searchParams);
    next.delete('export');
    next.delete('t');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const viewOptions = [
    { value: 'financial' as const, label: 'Financial', icon: Wallet },
    { value: 'projects' as const, label: 'Projects', icon: FolderKanban },
    { value: 'productivity' as const, label: 'Productivity', icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Understand your income, projects, and productivity at a glance."
        badge={<Badge tone="gray">{RANGE_LABEL[range]}</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="primary" size="md" onClick={exportReport}>
              <Download className="h-3.5 w-3.5" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <Tabs value={view} onChange={setView} options={viewOptions} />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="w-[190px]">
            <option value="all">All clients</option>
            {state.clients.map((client) => (
              <option key={client.id} value={client.id}>{client.businessName}</option>
            ))}
          </Select>
          <Tabs value={range} onChange={setRange} options={rangeOptions} size="sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Net Income"
          value={formatMoney(stats.income)}
          hint={`${stats.paymentCount} payments in range`}
          tone="accent"
        />
        <StatCard
          icon={FileText}
          label="Invoiced"
          value={formatMoney(stats.invoiced)}
          hint={`${periodInvoices.filter((invoice) => !invoice.draft).length} invoices sent`}
        />
        <StatCard
          icon={Wallet}
          label="Outstanding"
          value={formatMoney(stats.outstanding)}
          hint="Across unpaid invoices"
        />
        <StatCard
          icon={Clock}
          label="Hours Logged"
          value={`${Math.round(stats.hours * 10) / 10}h`}
          hint={`${formatDuration(stats.minutes)} in selected period`}
        />
      </div>

      {view === 'financial' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SectionCard
              title="Income Trend"
              description={`Net received · ${RANGE_LABEL[range]}`}
              icon={TrendingUp}
              className="xl:col-span-2"
              action={<Badge tone="green">{formatMoney(stats.income)}</Badge>}
            >
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incomeSeries} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6558D3" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#6558D3" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#858585' }}
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#858585' }}
                      tickFormatter={(value) => `₹${compactNumber(Number(value))}`}
                      width={54}
                    />
                    <Tooltip
                      cursor={{ stroke: '#6558D3', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={tooltipStyle}
                      formatter={(value) => [formatMoney(Number(value)), 'Net income']}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#6558D3"
                      strokeWidth={2}
                      fill="url(#incomeFill)"
                      activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line-soft pt-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-muted">Avg payment</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-ink">{formatMoney(Math.round(stats.avgPayment))}</p>
                </div>
                <div className="border-l border-line-soft pl-2">
                  <p className="text-[9px] uppercase tracking-wide text-muted">Refunds</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-danger">{formatMoney(stats.refunds)}</p>
                </div>
                <div className="border-l border-line-soft pl-2">
                  <p className="text-[9px] uppercase tracking-wide text-muted">Collection rate</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-ink">
                    {stats.invoiced > 0 ? Math.round((stats.income / stats.invoiced) * 100) : 0}%
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Invoice Status" description="Current portfolio mix" icon={FileText}>
              {invoiceStatusData.length === 0 ? (
                <EmptyState icon={FileText} title="No invoices" description="Invoices will appear here once created." className="border-0 bg-transparent py-6" />
              ) : (
                <>
                  <div className="relative h-[170px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={invoiceStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={74}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {invoiceStatusData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} invoices`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[20px] font-semibold tracking-[-0.03em] text-ink">{clientInvoices.length}</span>
                      <span className="text-[9px] uppercase tracking-wide text-muted">invoices</span>
                    </div>
                  </div>
                  <div className="mt-1 space-y-1.5">
                    {invoiceStatusData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[10.5px] text-soft">
                          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-[10.5px] font-medium text-ink">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SectionCard title="Revenue by Client" description={`Received · ${RANGE_LABEL[range]}`} icon={Wallet}>
              {revenueByClient.length === 0 ? (
                <EmptyState icon={Wallet} title="No revenue yet" description="Record payments to see client revenue." className="border-0 bg-transparent py-6" />
              ) : (
                <div className="h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByClient} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        width={100}
                        tick={{ fontSize: 9.5, fill: '#666666' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(101,88,211,0.10)' }}
                        contentStyle={tooltipStyle}
                        formatter={(value) => [formatMoney(Number(value)), 'Received']}
                      />
                      <Bar dataKey="received" fill="#6558D3" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Client Performance"
              description="All-time financials"
              icon={FileText}
              className="xl:col-span-2"
              bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-line-soft bg-secondary/30">
                      <th className="px-4 py-2 text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Client</th>
                      <th className="px-4 py-2 text-right text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Projects</th>
                      <th className="px-4 py-2 text-right text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Invoiced</th>
                      <th className="px-4 py-2 text-right text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Received</th>
                      <th className="px-4 py-2 text-right text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {clientPerformance.map((row) => (
                      <tr key={row.client.id} className="transition hover:bg-secondary/30">
                        <td className="px-4 py-2.5">
                          <p className="text-[11px] font-medium text-ink">{row.client.businessName}</p>
                          <p className="text-[9.5px] text-muted">{row.client.name}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right text-[10.5px] text-soft">{row.projects}</td>
                        <td className="px-4 py-2.5 text-right text-[10.5px] text-soft">{formatMoney(row.invoiced)}</td>
                        <td className="px-4 py-2.5 text-right text-[10.5px] font-medium text-ink">{formatMoney(row.received)}</td>
                        <td className="px-4 py-2.5 text-right text-[10.5px] font-medium text-accent-strong">
                          {row.outstanding > 0 ? formatMoney(row.outstanding) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {clientPerformance.length === 0 && (
                <p className="px-4 py-8 text-center text-[11px] text-muted">No client activity in this period.</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {view === 'projects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SectionCard title="Project Value by Status" description="Current portfolio" icon={FolderKanban}>
              {projectStatusData.length === 0 ? (
                <EmptyState icon={FolderKanban} title="No projects" description="Add a project to start tracking." className="border-0 bg-transparent py-6" />
              ) : (
                <>
                  <div className="relative h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={54}
                          outerRadius={76}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {projectStatusData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatMoney(Number(value)), 'Value']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                        {formatMoney(sum(projectStatusData.map((item) => item.value)))}
                      </span>
                      <span className="text-[9px] uppercase tracking-wide text-muted">total value</span>
                    </div>
                  </div>
                  <div className="mt-1 space-y-1.5">
                    {projectStatusData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[10.5px] text-soft">
                          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                          {item.name} <span className="text-muted">({item.count})</span>
                        </span>
                        <span className="text-[10.5px] font-medium text-ink">{formatMoney(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </SectionCard>

            <SectionCard
              title="Project Portfolio"
              description="Progress and billing by project"
              icon={FileText}
              className="xl:col-span-2"
              bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-line-soft bg-secondary/30">
                      <th className="px-4 py-2 text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Project</th>
                      <th className="px-4 py-2 text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Status</th>
                      <th className="px-4 py-2 text-right text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Value</th>
                      <th className="px-4 py-2 text-right text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Invoiced</th>
                      <th className="px-4 py-2 text-right text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Received</th>
                      <th className="w-[130px] px-4 py-2 text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {projectRows.map(({ project, invoiced, received }) => (
                      <tr key={project.id} className="transition hover:bg-secondary/30">
                        <td className="px-4 py-2.5">
                          <p className="max-w-[220px] truncate text-[11px] font-medium text-ink">{project.name}</p>
                          <p className="text-[9.5px] text-muted">
                            {getClient(state, project.clientId)?.businessName} · {project.code}
                          </p>
                        </td>
                        <td className="px-4 py-2.5"><StatusBadge status={project.status} /></td>
                        <td className="px-4 py-2.5 text-right text-[10.5px] text-soft">{formatMoney(project.value)}</td>
                        <td className="px-4 py-2.5 text-right text-[10.5px] text-soft">{formatMoney(invoiced)}</td>
                        <td className="px-4 py-2.5 text-right text-[10.5px] font-medium text-ink">{formatMoney(received)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Progress value={project.progress} className="h-1.5 flex-1" />
                            <span className="text-[9.5px] text-muted">{project.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {projectRows.length === 0 && (
                <p className="px-4 py-8 text-center text-[11px] text-muted">No projects match this filter.</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {view === 'productivity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SectionCard title="Hours by Category" description={`${formatDuration(stats.minutes)} logged`} icon={Clock} className="xl:col-span-2">
              {categoryData.length === 0 ? (
                <EmptyState icon={Clock} title="No time logged" description="Add work entries to see category insights." className="border-0 bg-transparent py-6" />
              ) : (
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9.5, fill: '#666666' }} dy={6} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#858585' }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(101,88,211,0.10)' }}
                        contentStyle={tooltipStyle}
                        formatter={(value) => [`${value}h`, 'Logged']}
                      />
                      <Bar dataKey="hours" fill="#6558D3" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Task Status" description="Current task distribution" icon={FileText}>
              <div className="space-y-3">
                {taskStatusData.map((item) => {
                  const total = Math.max(1, sum(taskStatusData.map((row) => row.value)));
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="flex items-center gap-1.5 text-soft">
                          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                          {item.name}
                        </span>
                        <span className="font-medium text-ink">{item.value}</span>
                      </div>
                      <Progress
                        value={(item.value / total) * 100}
                        className="mt-1 h-1.5"
                        barClassName="bg-ink/70"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t border-line-soft pt-3">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-muted">Completion rate</span>
                  <span className="font-semibold text-ink">
                    {Math.round(
                      (taskStatusData.find((item) => item.name === 'Completed')?.value ?? 0) /
                        Math.max(1, sum(taskStatusData.map((row) => row.value))) *
                        100,
                    )}
                    %
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SectionCard title="Last 7 Days" description="Hours logged per day" icon={Clock}>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHours} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9.5, fill: '#666666' }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#858585' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value}h`, 'Logged']}
                    />
                    <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Work"
              description={`Latest entries · ${RANGE_LABEL[range]}`}
              icon={FileText}
              className="xl:col-span-2"
              bodyClassName="p-0"
            >
              <DataTable minWidth={640}>
                <thead>
                  <tr>
                    <Th>Work</Th>
                    <Th>Category</Th>
                    <Th>Client</Th>
                    <Th>Date</Th>
                    <Th align="right">Duration</Th>
                    <Th align="right">Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentWork.map((entry) => {
                    const client = getClient(state, entry.clientId);
                    return (
                      <TableRow key={entry.id}>
                        <Td><span className="block max-w-[220px] truncate text-[11px] font-medium text-ink">{entry.title}</span></Td>
                        <Td><Badge tone="gray">{entry.category}</Badge></Td>
                        <Td><span className="text-[10.5px] text-soft">{client?.businessName ?? 'Personal'}</span></Td>
                        <Td><span className="whitespace-nowrap text-[10.5px]">{formatDateShort(entry.date)}</span></Td>
                        <Td align="right"><span className="text-[10.5px] font-medium text-ink">{formatDuration(workDuration(entry.startTime, entry.endTime))}</span></Td>
                        <Td align="right"><StatusBadge status={entry.status} /></Td>
                      </TableRow>
                    );
                  })}
                </tbody>
              </DataTable>
              {recentWork.length === 0 && (
                <p className="px-4 py-8 text-center text-[11px] text-muted">No work entries in this period.</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      <div className={cn('rounded-xl border border-line bg-secondary/40 px-4 py-3 text-[10px] text-muted')}>
        Report generated from live workspace data · {state.clients.length} clients · {state.projects.length} projects ·{' '}
        {state.invoices.length} invoices. Refunds are netted from income.
      </div>
    </div>
  );
}
