import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity as ActivityIcon,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Columns3,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Sparkles,
  Milestone as Timeline,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { useAppData } from '../context/AppDataContext';
import {
  cn,
  deadlineLabel,
  formatDate,
  formatDateLong,
  formatDateShort,
  formatDuration,
  formatMoney,
  getMonthGrid,
  invoicePaid,
  invoiceStatus,
  invoiceTotal,
  isOverdue,
  monthStart,
  parseISODate,
  todayISO,
  toISO,
  workDuration,
  addDays,
} from '../lib/utils';
import {
  getClient,
  invoiceBalance,
  monthlyIncomeSeries,
  outstandingInvoices,
  totalInvoiced,
  totalOutstanding,
  totalReceived,
} from '../lib/selectors';
import {
  ActivityFeed,
  KanbanColumn,
  KANBAN_COLUMNS,
  QuickActions,
  SectionCard,
  StatCard,
  TaskCard,
  TaskRow,
  ViewAllLink,
} from '../components/shared/cards';
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  PriorityBadge,
  Progress,
  StatusBadge,
  Tabs,
} from '../components/ui';
import type { Task, TaskStatus } from '../types';

type DashboardView = 'overview' | 'kanban' | 'timeline' | 'calendar' | 'activity';

export function OverviewPage() {
  const { state, updateTask } = useAppData();
  const navigate = useNavigate();
  const [view, setView] = useState<DashboardView>('overview');
  const [bannerVisible, setBannerVisible] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const today = todayISO();
  const profile = state.settings.profile;
  const firstName = profile.name.split(' ')[0];

  const activeProjects = useMemo(
    () => state.projects.filter((project) => project.status === 'Active'),
    [state.projects],
  );
  const pendingTasks = useMemo(
    () => state.tasks.filter((task) => task.status !== 'completed'),
    [state.tasks],
  );
  const received = useMemo(() => totalReceived(state.payments), [state.payments]);
  const invoiced = useMemo(() => totalInvoiced(state.invoices), [state.invoices]);
  const outstanding = useMemo(
    () => totalOutstanding(state.invoices, state.payments),
    [state.invoices, state.payments],
  );
  const pendingPayments = useMemo(
    () => outstandingInvoices(state.invoices, state.payments),
    [state.invoices, state.payments],
  );
  const incomeSeries = useMemo(() => monthlyIncomeSeries(state.payments, 6), [state.payments]);

  const focusTasks = useMemo(
    () =>
      pendingTasks
        .filter((task) => task.dueDate <= addDays(today, 2))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    [pendingTasks, today],
  );

  const recentWork = useMemo(
    () =>
      [...state.workEntries]
        .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
        .slice(0, 4),
    [state.workEntries],
  );

  const deadlines = useMemo(() => {
    const taskItems = pendingTasks
      .filter((task) => task.dueDate <= addDays(today, 8))
      .map((task) => ({
        id: `task-${task.id}`,
        date: task.dueDate,
        title: task.title,
        type: 'Task',
        to: `/tasks?task=${task.id}`,
        tone: task.priority,
      }));
    const invoiceItems = state.invoices
      .filter(
        (invoice) =>
          !invoice.draft &&
          invoiceStatus(invoice, state.payments) !== 'Paid' &&
          invoice.dueDate <= addDays(today, 8),
      )
      .map((invoice) => ({
        id: `inv-${invoice.id}`,
        date: invoice.dueDate,
        title: `${invoice.id} · ${getClient(state, invoice.clientId)?.businessName ?? 'Client'}`,
        type: 'Invoice',
        to: '/invoices',
        tone: invoiceStatus(invoice, state.payments),
      }));
    return [...taskItems, ...invoiceItems].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [pendingTasks, state, today]);

  const recentThisMonth = useMemo(
    () =>
      state.clients.filter((client) => client.createdAt >= addDays(today, -30)).length,
    [state.clients, today],
  );

  const incomeTrend = useMemo(() => {
    const recent = state.payments.filter((payment) => payment.date >= addDays(today, -30));
    const previous = state.payments.filter(
      (payment) => payment.date >= addDays(today, -60) && payment.date < addDays(today, -30),
    );
    const recentNet = recent.reduce(
      (total, payment) => total + (payment.type === 'Refund' ? -payment.amount : payment.amount),
      0,
    );
    const previousNet = previous.reduce(
      (total, payment) => total + (payment.type === 'Refund' ? -payment.amount : payment.amount),
      0,
    );
    if (!previousNet || !recentNet) return undefined;
    const change = ((recentNet - previousNet) / previousNet) * 100;
    return { value: `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`, positive: change >= 0 };
  }, [state.payments, today]);

  const dueToday = pendingTasks.filter(
    (task) => task.dueDate === today || isOverdue(task.dueDate),
  ).length;

  const completeTask = (task: Task) => {
    updateTask(
      task.status === 'completed'
        ? { ...task, status: 'todo' }
        : { ...task, status: 'completed' },
    );
  };

  const handleDrop = (status: TaskStatus, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/task-id') || draggingId;
    const task = state.tasks.find((item) => item.id === id);
    if (task && task.status !== status) updateTask({ ...task, status });
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const tabs = [
    { value: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { value: 'kanban' as const, label: 'Kanban', icon: Columns3 },
    { value: 'timeline' as const, label: 'Timeline', icon: Timeline },
    { value: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
    { value: 'activity' as const, label: 'Recent Activity', icon: ActivityIcon },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[26px]">
            Welcome Back, {firstName}!
          </h1>
          <p className="mt-1 text-[12.5px] text-soft">
            Stay on top of your daily work, manage your projects, and track your progress.
          </p>
        </div>
        <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-[11px] font-medium text-soft shadow-card">
          <CalendarDays className="h-3.5 w-3.5 text-muted" />
          {formatDateLong()}
        </div>
      </div>

      {/* Banner */}
      {bannerVisible && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-secondary/80 px-3 py-2.5 sm:px-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#C02050] to-[#9F1239] text-white shadow-[0_6px_14px_-8px_rgba(8,8,8,0.35)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 text-[11.5px] text-soft">
            <span className="font-semibold text-ink">Your workspace is ready.</span> Review your{' '}
            <span className="font-medium text-ink">{pendingTasks.length} pending tasks</span> and{' '}
            <span className="font-medium text-ink">{activeProjects.length} active projects</span>{' '}
            for upcoming deadlines.
          </p>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="hidden shrink-0 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[10.5px] font-medium text-ink shadow-card transition hover:bg-card/80 sm:inline-flex"
          >
            Review now
          </button>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            className="shrink-0 rounded-md p-1 text-muted transition hover:bg-card hover:text-ink"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Clients"
          value={String(state.clients.length)}
          to="/clients"
          hint={`${state.clients.filter((client) => client.status === 'Active').length} active · ${recentThisMonth} new this month`}
          trend={recentThisMonth > 0 ? { value: `+${recentThisMonth}`, positive: true } : undefined}
        />
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={String(activeProjects.length)}
          to="/projects"
          hint={`${formatMoney(activeProjects.reduce((total, project) => total + project.value, 0))} in flight`}
        />
        <StatCard
          icon={ListChecks}
          label="Pending Tasks"
          value={String(pendingTasks.length)}
          to="/tasks"
          hint={`${dueToday} due today or overdue`}
        />
        <StatCard
          icon={Wallet}
          label="Total Received"
          value={formatMoney(received)}
          to="/payments"
          tone="accent"
          trend={incomeTrend}
          hint={`${formatMoney(outstanding)} still outstanding`}
        />
      </div>

      {/* View switcher */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onChange={setView} options={tabs} className="w-full sm:w-auto" stretch />
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-[10.5px] text-muted">
            {view === 'overview' ? 'A calm view of your day' : 'Switch views without leaving the dashboard'}
          </span>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[10.5px] font-medium text-soft shadow-card transition hover:text-ink"
          >
            Reports
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {view === 'overview' && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <SectionCard
              title="Today's Tasks"
              description="Due today and in the next 48 hours"
              icon={ListChecks}
              action={<ViewAllLink to="/tasks" />}
              bodyClassName="space-y-0.5 p-2.5"
            >
              {focusTasks.length === 0 ? (
                <EmptyState
                  icon={ListChecks}
                  title="Nothing urgent today"
                  description="Your next tasks are comfortably scheduled. Take a moment to plan ahead."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => navigate('/tasks?create=1')}>
                      Add a task
                    </Button>
                  }
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                focusTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => completeTask(task)}
                    onOpen={() => navigate(`/tasks?task=${task.id}`)}
                  />
                ))
              )}
            </SectionCard>

            <SectionCard
              title="Active Projects"
              description="Progress across your current work"
              icon={FolderKanban}
              action={<ViewAllLink to="/projects" />}
              bodyClassName="divide-y divide-line-soft p-0"
            >
              {activeProjects.slice(0, 4).map((project) => {
                const client = getClient(state, project.clientId);
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-secondary/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[11.5px] font-semibold text-ink">
                          {project.name}
                        </span>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-muted">
                        {client?.businessName ?? 'Personal'} · {project.code} · ends{' '}
                        {formatDateShort(project.endDate)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={project.progress} className="max-w-[220px]" />
                        <span className="shrink-0 text-[9.5px] font-semibold text-soft">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-semibold text-ink">{formatMoney(project.value)}</p>
                      <p className="mt-0.5 text-[9.5px] text-muted">{deadlineLabel(project.endDate)}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
                  </button>
                );
              })}
              {activeProjects.length === 0 && (
                <div className="p-4">
                  <EmptyState
                    icon={FolderKanban}
                    title="No active projects"
                    description="Create a project to start tracking progress and value."
                    action={
                      <Button variant="secondary" size="sm" onClick={() => navigate('/projects?create=1')}>
                        Create project
                      </Button>
                    }
                    className="border-0 bg-transparent py-6"
                  />
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Recent Daily Work"
              description="What you have been working on"
              icon={ActivityIcon}
              action={<ViewAllLink to="/daily-work" />}
              bodyClassName="p-1.5"
            >
              <div className="divide-y divide-line-soft">
                {recentWork.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2.5 px-2 py-2.5">
                    <div className="flex h-8 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-secondary/60">
                      <span className="text-[8px] uppercase tracking-wide text-muted">
                        {formatDateShort(entry.date).split(' ')[0]}
                      </span>
                      <span className="text-[11px] font-semibold leading-none text-ink">
                        {parseISODate(entry.date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-medium text-ink">{entry.title}</p>
                      <p className="mt-0.5 truncate text-[9.5px] text-muted">
                        {entry.startTime} – {entry.endTime} · {getClient(state, entry.clientId)?.businessName ?? 'Personal'} ·{' '}
                        {formatDuration(workDuration(entry.startTime, entry.endTime))}
                      </p>
                    </div>
                    <Badge tone="gray">{entry.category}</Badge>
                    <StatusBadge status={entry.status} dot={false} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Upcoming Deadlines"
              description="Tasks and invoices that need attention"
              icon={CalendarDays}
              action={<ViewAllLink to="/calendar" />}
              bodyClassName="p-1.5"
            >
              <div className="divide-y divide-line-soft">
                {deadlines.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-secondary/60"
                  >
                    <div className="flex h-8 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-card">
                      <span className="text-[8px] uppercase tracking-wide text-muted">
                        {formatDateShort(item.date).split(' ')[0]}
                      </span>
                      <span className="text-[11px] font-semibold leading-none text-ink">
                        {parseISODate(item.date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-medium text-ink">{item.title}</p>
                      <p className="mt-0.5 text-[9.5px] text-muted">{formatDate(item.date)}</p>
                    </div>
                    <Badge tone={item.type === 'Invoice' ? 'orange' : 'gray'}>{item.type}</Badge>
                    <span
                      className={cn(
                        'w-20 text-right text-[9.5px] font-medium',
                        isOverdue(item.date) ? 'text-danger' : 'text-muted',
                      )}
                    >
                      {deadlineLabel(item.date)}
                    </span>
                  </Link>
                ))}
                {deadlines.length === 0 && (
                  <p className="px-3 py-6 text-center text-[11px] text-muted">
                    No deadlines in the next week.
                  </p>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard
              title="Financial Summary"
              description="Received against total invoiced"
              icon={Wallet}
              action={<ViewAllLink to="/payments" />}
              bodyClassName="p-4"
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Received</p>
                  <p className="mt-1 text-[21px] font-semibold tracking-[-0.03em] text-ink">
                    {formatMoney(received)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted">Outstanding</p>
                  <p className="mt-1 text-[14px] font-semibold text-accent-strong">
                    {formatMoney(outstanding)}
                  </p>
                </div>
              </div>
              <Progress
                value={invoiced ? (received / invoiced) * 100 : 0}
                className="mt-3 h-2"
                tone="success"
              />
              <div className="mt-1.5 flex items-center justify-between text-[9.5px] text-muted">
                <span>{invoiced ? Math.round((received / invoiced) * 100) : 0}% collected</span>
                <span>{formatMoney(invoiced)} invoiced</span>
              </div>

              <div className="mt-4 h-[104px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeSeries} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#858585' }}
                      dy={4}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(159,18,57,0.12)' }}
                      formatter={(value: number) => [`₹${value}k`, 'Income']}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #EAEAEA',
                        boxShadow: '0 8px 24px -12px rgba(16,24,40,0.2)',
                        fontSize: 11,
                        padding: '6px 10px',
                      }}
                    />
                    <Bar dataKey="income" fill="#9F1239" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line-soft pt-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-muted">Payments</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-ink">
                    {state.payments.filter((payment) => payment.type === 'Payment').length}
                  </p>
                </div>
                <div className="border-l border-line-soft pl-2">
                  <p className="text-[9px] uppercase tracking-wide text-muted">Open invoices</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-ink">
                    {state.invoices.filter((invoice) => invoiceStatus(invoice, state.payments) !== 'Paid' && !invoice.draft).length}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Pending Payments"
              description="Balances waiting to be collected"
              icon={ListChecks}
              action={<ViewAllLink to="/payments" />}
              bodyClassName="p-1.5"
            >
              <div className="divide-y divide-line-soft">
                {pendingPayments.slice(0, 3).map((invoice) => {
                  const client = getClient(state, invoice.clientId);
                  const paid = invoicePaid(invoice.id, state.payments);
                  return (
                    <Link
                      key={invoice.id}
                      to="/payments"
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition hover:bg-secondary/60"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                        <Wallet className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-ink">{client?.businessName}</p>
                        <p className="mt-0.5 text-[9.5px] text-muted">
                          {invoice.id} · {Math.round((paid / Math.max(1, invoiceTotal(invoice))) * 100)}% paid
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-ink">
                          {formatMoney(invoiceBalance(invoice, state.payments))}
                        </p>
                        <p className="mt-0.5 text-[9px] text-muted">due {formatDateShort(invoice.dueDate)}</p>
                      </div>
                    </Link>
                  );
                })}
                {pendingPayments.length === 0 && (
                  <p className="px-3 py-6 text-center text-[11px] text-muted">
                    Every invoice is fully paid.
                  </p>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Activities"
              description="Latest updates in your workspace"
              icon={ActivityIcon}
              action={
                <button
                  type="button"
                  onClick={() => setView('activity')}
                  className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-accent-strong transition hover:gap-1"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              }
              bodyClassName="p-4"
            >
              <ActivityFeed activities={state.activities} limit={5} compact />
            </SectionCard>

            <SectionCard
              title="Quick Actions"
              description="Jump straight into your next step"
              icon={ArrowRight}
              bodyClassName="p-3"
            >
              <QuickActions />
            </SectionCard>
          </div>
        </div>
      )}

      {view === 'kanban' && (
        <SectionCard
          title="Dashboard Kanban"
          description="Drag cards to update task status"
          icon={Columns3}
          action={<ViewAllLink to="/tasks" label="Open full board" />}
          bodyClassName="p-3"
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
            {KANBAN_COLUMNS.map((column) => {
              const tasks = state.tasks.filter((task) => task.status === column.key);
              return (
                <KanbanColumn
                  key={column.key}
                  status={column.key}
                  label={column.label}
                  color={column.color}
                  count={tasks.length}
                  onAdd={() => navigate(`/tasks?create=1&status=${column.key}`)}
                  isOver={dragOverColumn === column.key}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverColumn(column.key);
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(event) => handleDrop(column.key, event)}
                >
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      draggable
                      dragging={draggingId === task.id}
                      onDragStart={(event) => {
                        setDraggingId(task.id);
                        event.dataTransfer.setData('text/task-id', task.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverColumn(null);
                      }}
                      onOpen={() => navigate(`/tasks?task=${task.id}`)}
                      onToggleComplete={() => completeTask(task)}
                    />
                  ))}
                </KanbanColumn>
              );
            })}
          </div>
        </SectionCard>
      )}

      {view === 'timeline' && <TimelineView />}

      {view === 'calendar' && <DashboardCalendar />}

      {view === 'activity' && (
        <SectionCard
          title="Recent Activity"
          description="Everything that has happened in your workspace"
          icon={ActivityIcon}
          action={<ViewAllLink to="/reports" label="Explore reports" />}
          bodyClassName="p-4"
        >
          <ActivityFeed activities={state.activities} limit={25} />
        </SectionCard>
      )}
    </div>
  );
}

function TimelineView() {
  const { state } = useAppData();
  const navigate = useNavigate();
  const groups = useMemo(() => {
    const sorted = [...state.tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const map = new Map<string, Task[]>();
    sorted.forEach((task) => {
      map.set(task.dueDate, [...(map.get(task.dueDate) ?? []), task]);
    });
    return Array.from(map.entries());
  }, [state.tasks]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <SectionCard
        title="Task Timeline"
        description="Tasks grouped by due date"
        icon={Timeline}
        bodyClassName="p-4"
      >
        <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line">
          {groups.map(([date, tasks]) => (
            <div key={date} className="relative pl-6">
              <span
                className={cn(
                  'absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[3px] border-card',
                  isOverdue(date) ? 'bg-danger' : 'bg-accent',
                )}
              />
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11.5px] font-semibold text-ink">{formatDate(date)}</p>
                <span
                  className={cn(
                    'text-[9.5px] font-medium',
                    isOverdue(date) ? 'text-danger' : 'text-muted',
                  )}
                >
                  {deadlineLabel(date)}
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => navigate(`/tasks?task=${task.id}`)}
                    className="flex w-full items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-left transition hover:border-accent/30 hover:shadow-card"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-medium text-ink">
                        {task.title}
                      </span>
                      <span className="mt-0.5 block text-[9.5px] text-muted">
                        {task.id} · {getClient(state, task.clientId)?.businessName ?? 'Personal'}
                      </span>
                    </span>
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status === 'inprogress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status === 'pending' ? 'Pending' : 'Completed'} dot={false} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Project Milestones" description="Upcoming delivery dates" icon={FolderKanban} bodyClassName="p-1.5">
        <div className="divide-y divide-line-soft">
          {[...state.projects]
            .filter((project) => project.status !== 'Completed')
            .sort((a, b) => a.endDate.localeCompare(b.endDate))
            .slice(0, 7)
            .map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition hover:bg-secondary/60"
              >
                <div className="flex h-8 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-secondary/60">
                  <span className="text-[8px] uppercase tracking-wide text-muted">
                    {formatDateShort(project.endDate).split(' ')[0]}
                  </span>
                  <span className="text-[11px] font-semibold leading-none text-ink">
                    {parseISODate(project.endDate).getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-ink">{project.name}</p>
                  <p className="mt-0.5 text-[9.5px] text-muted">{deadlineLabel(project.endDate)}</p>
                </div>
                <span className="text-[9.5px] font-semibold text-soft">{project.progress}%</span>
              </Link>
            ))}
        </div>
      </SectionCard>
    </div>
  );
}

function DashboardCalendar() {
  const { state } = useAppData();
  const navigate = useNavigate();
  const today = todayISO();
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(today);
  const days = useMemo(
    () => getMonthGrid(month.getFullYear(), month.getMonth()),
    [month],
  );

  const eventsFor = (date: string) => {
    const tasks = state.tasks
      .filter((task) => task.dueDate === date && task.status !== 'completed')
      .map((task) => ({ id: task.id, title: task.title, tone: 'task' as const, to: `/tasks?task=${task.id}` }));
    const invoices = state.invoices
      .filter((invoice) => invoice.dueDate === date && !invoice.draft && invoiceStatus(invoice, state.payments) !== 'Paid')
      .map((invoice) => ({ id: invoice.id, title: `${invoice.id} due`, tone: 'invoice' as const, to: '/invoices' }));
    const projects = state.projects
      .filter((project) => project.endDate === date && project.status !== 'Completed')
      .map((project) => ({ id: project.id, title: `${project.name} due`, tone: 'project' as const, to: `/projects/${project.id}` }));
    return [...tasks, ...invoices, ...projects];
  };

  const selectedEvents = eventsFor(selectedDate);

  const toneClasses = {
    task: 'bg-blue-500',
    invoice: 'bg-accent',
    project: 'bg-violet-500',
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <SectionCard
        title="Calendar"
        description="Your tasks, invoices and project deadlines"
        icon={CalendarDays}
        action={
          <div className="flex items-center gap-1">
            <IconButton
              variant="secondary"
              size="icon-sm"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </IconButton>
            <span className="min-w-[120px] text-center text-[11px] font-semibold text-ink">
              {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month)}
            </span>
            <IconButton
              variant="secondary"
              size="icon-sm"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        }
        bodyClassName="p-3"
      >
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div
              key={day}
              className="pb-1 text-center text-[9px] font-semibold uppercase tracking-wide text-muted"
            >
              {day}
            </div>
          ))}
          {days.map((day) => {
            const iso = toISO(day);
            const inMonth = day.getMonth() === month.getMonth();
            const events = eventsFor(iso);
            const selected = iso === selectedDate;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                className={cn(
                  'flex min-h-[64px] flex-col rounded-lg border p-1.5 text-left transition',
                  selected
                    ? 'border-accent bg-accent-soft'
                    : 'border-transparent hover:border-line hover:bg-secondary/50',
                  !inMonth && 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                    iso === today ? 'bg-accent text-white' : 'text-soft',
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {events.slice(0, 3).map((event) => (
                    <span key={event.id} className={cn('h-1.5 w-1.5 rounded-full', toneClasses[event.tone])} />
                  ))}
                </div>
                {events[0] && (
                  <span className="mt-auto line-clamp-1 text-[8.5px] leading-tight text-muted">
                    {events[0].title}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title={formatDate(selectedDate)}
        description={`${selectedEvents.length} scheduled item${selectedEvents.length === 1 ? '' : 's'}`}
        icon={ListChecks}
        bodyClassName="p-2"
      >
        {selectedEvents.length === 0 ? (
          <p className="px-3 py-8 text-center text-[11px] text-muted">
            Nothing scheduled for this day.
          </p>
        ) : (
          <div className="divide-y divide-line-soft">
            {selectedEvents.map((event) => (
              <button
                key={`${event.tone}-${event.id}`}
                type="button"
                onClick={() => navigate(event.to)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition hover:bg-secondary/60"
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', toneClasses[event.tone])} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">
                  {event.title}
                </span>
                <Badge tone="gray">{event.tone}</Badge>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
