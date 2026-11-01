import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  ListChecks,
  Plus,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { TaskStatus } from '../types';
import {
  cn,
  formatDate,
  formatMoney,
  getMonthGrid,
  invoiceStatus,
  monthStart,
  toISO,
  todayISO,
} from '../lib/utils';
import { getClient, invoiceBalance, totalReceived } from '../lib/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionCard, StatCard } from '../components/shared/cards';
import {
  Badge,
  Button,
  IconButton,
  StatusBadge,
} from '../components/ui';

type CalendarEventType = 'task' | 'invoice' | 'payment' | 'project';

interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  label: string;
  title: string;
  meta: string;
  date: string;
  to: string;
  amount?: number;
  status?: TaskStatus;
  done?: boolean;
  refund?: boolean;
}

const EVENT_META: Record<
  CalendarEventType,
  {
    label: string;
    icon: LucideIcon;
    dot: string;
    chip: string;
    soft: string;
    text: string;
  }
> = {
  task: {
    label: 'Tasks',
    icon: ListChecks,
    dot: 'bg-blue-500',
    chip: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    soft: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
    text: 'text-blue-600 dark:text-blue-400',
  },
  invoice: {
    label: 'Invoices',
    icon: FileText,
    dot: 'bg-accent',
    chip: 'bg-accent-soft text-accent-strong',
    soft: 'bg-accent-soft text-accent-strong border-accent/20',
    text: 'text-accent-strong',
  },
  payment: {
    label: 'Payments',
    icon: Wallet,
    dot: 'bg-green-500',
    chip: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    soft: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/25',
    text: 'text-green-700 dark:text-green-400',
  },
  project: {
    label: 'Deadlines',
    icon: FolderKanban,
    dot: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    soft: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/25',
    text: 'text-violet-700 dark:text-violet-400',
  },
};

const MONTH_KEY = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export function CalendarPage() {
  const { state } = useAppData();
  const navigate = useNavigate();
  const today = todayISO();
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTypes, setActiveTypes] = useState<CalendarEventType[]>(['task', 'invoice', 'payment', 'project']);

  const days = useMemo(() => getMonthGrid(month.getFullYear(), month.getMonth()), [month]);
  const monthKey = MONTH_KEY(month);

  const events = useMemo(() => {
    const list: CalendarEvent[] = [];

    state.tasks.forEach((task) => {
      const client = getClient(state, task.clientId);
      const project = state.projects.find((item) => item.id === task.projectId);
      list.push({
        id: `task-${task.id}`,
        type: 'task',
        label: task.title,
        title: task.title,
        meta: project?.name ?? client?.businessName ?? 'Personal task',
        date: task.dueDate,
        to: `/tasks?task=${task.id}`,
        status: task.status,
        done: task.status === 'completed',
      });
    });

    state.invoices.forEach((invoice) => {
      const client = getClient(state, invoice.clientId);
      const status = invoiceStatus(invoice, state.payments);
      if (invoice.draft || status === 'Paid') return;
      list.push({
        id: `invoice-${invoice.id}`,
        type: 'invoice',
        label: `${client?.businessName ?? 'Invoice'} due`,
        title: `${client?.businessName ?? 'Invoice'} · ${invoice.id}`,
        meta: `${invoice.id} · ${formatMoney(invoiceBalance(invoice, state.payments))} outstanding`,
        date: invoice.dueDate,
        to: `/invoices?invoice=${invoice.id}`,
        amount: invoiceBalance(invoice, state.payments),
      });
    });

    state.payments.forEach((payment) => {
      const client = getClient(state, payment.clientId);
      const refund = payment.type === 'Refund';
      list.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        label: refund ? `Refund · ${formatMoney(payment.amount)}` : `Payment · ${formatMoney(payment.amount)}`,
        title: refund ? `Refund to ${client?.businessName ?? 'client'}` : `Payment from ${client?.businessName ?? 'client'}`,
        meta: `${payment.id} · ${payment.mode}${payment.reference ? ` · ${payment.reference}` : ''}`,
        date: payment.date,
        to: `/invoices?invoice=${payment.invoiceId}`,
        amount: payment.amount,
        refund,
      });
    });

    state.projects.forEach((project) => {
      const client = getClient(state, project.clientId);
      list.push({
        id: `project-${project.id}`,
        type: 'project',
        label: `${project.name} deadline`,
        title: `${project.name} deadline`,
        meta: `${client?.businessName ?? 'Project'} · ${project.code}`,
        date: project.endDate,
        to: `/projects/${project.id}`,
        status: undefined,
      });
    });

    return list;
  }, [state]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      if (!activeTypes.includes(event.type)) return;
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    });
    return map;
  }, [events, activeTypes]);

  const monthEvents = useMemo(
    () => events.filter((event) => event.date.startsWith(monthKey) && activeTypes.includes(event.type)),
    [events, monthKey, activeTypes],
  );

  const monthPayments = useMemo(
    () => state.payments.filter((payment) => payment.date.startsWith(monthKey)),
    [state.payments, monthKey],
  );

  const stats = useMemo(() => {
    const tasks = monthEvents.filter((event) => event.type === 'task' && !event.done);
    const invoices = monthEvents.filter((event) => event.type === 'invoice');
    const deadlines = monthEvents.filter((event) => event.type === 'project');
    return {
      tasks: tasks.length,
      overdueTasks: state.tasks.filter(
        (task) => task.status !== 'completed' && task.dueDate < today,
      ).length,
      invoices: invoices.length,
      invoiceValue: invoices.reduce((total, event) => total + (event.amount ?? 0), 0),
      received: totalReceived(monthPayments),
      deadlines: deadlines.length,
    };
  }, [monthEvents, state.tasks, today, monthPayments]);

  const typeCounts = useMemo(() => {
    const counts: Record<CalendarEventType, number> = { task: 0, invoice: 0, payment: 0, project: 0 };
    events.forEach((event) => {
      if (event.date.startsWith(monthKey)) counts[event.type] += 1;
    });
    return counts;
  }, [events, monthKey]);

  const selectedEvents = (byDate.get(selectedDate) ?? []).sort(
    (a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0),
  );

  const selectedDateObj = new Date(`${selectedDate}T00:00:00`);

  const goMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    const now = new Date();
    const isCurrentMonth = next.getFullYear() === now.getFullYear() && next.getMonth() === now.getMonth();
    setSelectedDate(isCurrentMonth ? today : toISO(next));
  };

  const goToday = () => {
    setMonth(monthStart(new Date()));
    setSelectedDate(today);
  };

  const toggleType = (type: CalendarEventType) => {
    setActiveTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        description="Tasks, payment dates, and project deadlines in one view."
        badge={<Badge tone="gray">{monthEvents.length} events this month</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={goToday}>
              <CalendarCheck className="h-3.5 w-3.5" />
              Today
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate('/tasks?create=1')}>
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label="Tasks Due"
          value={String(stats.tasks)}
          hint={`${stats.overdueTasks} overdue overall`}
          tone="accent"
        />
        <StatCard
          icon={FileText}
          label="Invoices Due"
          value={String(stats.invoices)}
          hint={`${formatMoney(stats.invoiceValue)} outstanding`}
        />
        <StatCard
          icon={Wallet}
          label="Payments Received"
          value={formatMoney(stats.received)}
          hint={`${monthPayments.length} entries this month`}
        />
        <StatCard
          icon={FolderKanban}
          label="Project Deadlines"
          value={String(stats.deadlines)}
          hint="Projects ending this month"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.keys(EVENT_META) as CalendarEventType[]).map((type) => {
          const meta = EVENT_META[type];
          const active = activeTypes.includes(type);
          const Icon = meta.icon;
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              onClick={() => toggleType(type)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                active
                  ? 'border-line bg-card text-ink shadow-card'
                  : 'border-transparent bg-secondary/60 text-muted hover:text-soft',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', active ? meta.dot : 'bg-muted')} />
              <Icon className={cn('h-3.5 w-3.5', active ? meta.text : 'text-muted')} />
              {meta.label}
              <span className="rounded bg-secondary px-1 py-0.5 text-[9px] text-muted">{typeCounts[type]}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SectionCard
          title={new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month)}
          description="Click any day to see its full agenda"
          icon={CalendarDays}
          action={
            <div className="flex items-center gap-1">
              <IconButton
                variant="secondary"
                size="icon-sm"
                onClick={() => goMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                variant="secondary"
                size="icon-sm"
                onClick={() => goMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          }
          bodyClassName="p-2.5 sm:p-3"
        >
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className="pb-1.5 text-center text-[9px] font-semibold uppercase tracking-wide text-muted"
              >
                {day}
              </div>
            ))}
            {days.map((day) => {
              const iso = toISO(day);
              const inMonth = day.getMonth() === month.getMonth();
              const dayEvents = byDate.get(iso) ?? [];
              const selected = iso === selectedDate;
              const isToday = iso === today;
              const visible = dayEvents.slice(0, 2);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  className={cn(
                    'flex min-h-[88px] flex-col rounded-lg border p-1 text-left transition sm:min-h-[100px]',
                    selected
                      ? 'border-accent bg-accent-soft/60'
                      : 'border-transparent hover:border-line hover:bg-secondary/50',
                    !inMonth && 'opacity-40',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                      isToday ? 'bg-accent text-white' : 'text-soft',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-0.5 flex w-full min-w-0 flex-col gap-0.5">
                    {visible.map((event) => {
                      const meta = EVENT_META[event.type];
                      return (
                        <span
                          key={event.id}
                          className={cn(
                            'block truncate rounded px-1 py-[3px] text-[7.5px] font-medium leading-none sm:text-[8px]',
                            meta.chip,
                            event.done && 'opacity-50 line-through',
                          )}
                          title={event.title}
                        >
                          {event.label}
                        </span>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="px-1 text-[7.5px] font-medium text-muted">+{dayEvents.length - 2} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            title={new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }).format(selectedDateObj)}
            description={`${selectedEvents.length} item${selectedEvents.length === 1 ? '' : 's'} scheduled`}
            icon={CalendarDays}
            action={selectedDate === today ? <Badge tone="orange" dot>Today</Badge> : undefined}
            bodyClassName="p-2"
          >
            {selectedEvents.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <CalendarDays className="mx-auto h-5 w-5 text-muted" />
                <p className="mt-2 text-[11px] font-medium text-ink">Nothing scheduled</p>
                <p className="mt-0.5 text-[10px] text-muted">This day is clear — a good time to get ahead.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {selectedEvents.map((event) => {
                  const meta = EVENT_META[event.type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => navigate(event.to)}
                      className="group flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition hover:bg-secondary/60"
                    >
                      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border', meta.soft)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block truncate text-[11px] font-medium text-ink', event.done && 'line-through opacity-60')}>
                          {event.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[9.5px] text-muted">{event.meta}</span>
                        {event.type === 'payment' && (
                          <span className={cn('mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[8.5px] font-medium', event.refund ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400')}>
                            {event.refund ? '−' : '+'}
                            {formatMoney(event.amount ?? 0)}
                          </span>
                        )}
                        {event.type === 'task' && event.status && (
                          <span className="mt-1 inline-flex">
                            <StatusBadge status={
                              event.status === 'todo' ? 'To Do'
                                : event.status === 'inprogress' ? 'In Progress'
                                : event.status === 'pending' ? 'Pending'
                                : 'Completed'
                            } />
                          </span>
                        )}
                      </span>
                      <ArrowUpRight className="mt-1 h-3 w-3 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Month at a glance" description="Everything due in this view" icon={CalendarCheck}>
            <div className="space-y-2">
              {(Object.keys(EVENT_META) as CalendarEventType[]).map((type) => {
                const meta = EVENT_META[type];
                const count = monthEvents.filter((event) => event.type === type).length;
                const Icon = meta.icon;
                return (
                  <div key={type} className="flex items-center gap-2.5">
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg border', meta.soft)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-[10.5px] text-soft">{meta.label}</span>
                    <span className="text-[11px] font-semibold text-ink">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3 text-[10px] text-muted">
              <span>Selected day</span>
              <span className="font-medium text-ink">{formatDate(selectedDate)}</span>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
