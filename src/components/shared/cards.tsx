import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Files,
  FolderKanban,
  IndianRupee,
  ListChecks,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Activity, Client, Project, Task } from '../../types';
import {
  cn,
  deadlineLabel,
  formatDate,
  formatDateShort,
  formatDuration,
  formatMoney,
  invoiceStatus,
  isOverdue,
  relativeTime,
  workDuration,
} from '../../lib/utils';
import { clientOutstanding, getClient, projectValueByClient } from '../../lib/selectors';
import { useAppData } from '../../context/AppDataContext';
import {
  ActionMenu,
  Avatar,
  Badge,
  PriorityBadge,
  Progress,
  StatusBadge,
} from '../ui';

/* -------------------------------------------------------------------------- */
/* Section card                                                               */
/* -------------------------------------------------------------------------- */

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  icon?: LucideIcon;
}) {
  return (
    <section className={cn('rounded-xl border border-line bg-card shadow-card', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-line-soft px-4 py-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-secondary text-soft">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <div>
            <h2 className="text-[12.5px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[10.5px] text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function ViewAllLink({ to, label = 'View all' }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-accent-strong transition hover:gap-1"
    >
      {label}
      <ChevronRight className="h-3 w-3" />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat card                                                                  */
/* -------------------------------------------------------------------------- */

export function StatCard({
  label,
  value,
  icon: Icon,
  to,
  trend,
  hint,
  tone = 'dark',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  to?: string;
  trend?: { value: string; positive?: boolean };
  hint?: string;
  tone?: 'dark' | 'accent';
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[10px] shadow-sm',
            tone === 'accent'
              ? 'bg-accent text-white shadow-[0_6px_14px_-8px_rgba(8,8,8,0.35)]'
              : 'bg-ink text-card',
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        {to ? (
          <span className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-muted transition group-hover:text-soft">
            View details
            <ChevronRight className="h-3 w-3" />
          </span>
        ) : (
          <span className="h-9" />
        )}
      </div>
      <div className="mt-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-[24px] font-semibold leading-none tracking-[-0.035em] text-ink">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold',
                trend.positive === false
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                  : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
              )}
            >
              {trend.positive === false ? (
                <TrendingDown className="h-2.5 w-2.5" />
              ) : (
                <TrendingUp className="h-2.5 w-2.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[11.5px] font-medium text-soft">{label}</p>
        {hint && <p className="mt-0.5 text-[10px] text-muted">{hint}</p>}
      </div>
    </>
  );

  const classes =
    'group block min-w-0 rounded-xl border border-line bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-soft';

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
}

/* -------------------------------------------------------------------------- */
/* Task card                                                                  */
/* -------------------------------------------------------------------------- */

const statusDot: Record<Task['status'], string> = {
  todo: 'bg-slate-400',
  inprogress: 'bg-blue-500',
  pending: 'bg-amber-500',
  completed: 'bg-green-500',
};

export function TaskCard({
  task,
  onOpen,
  onToggleComplete,
  onEdit,
  onDelete,
  draggable = false,
  onDragStart,
  onDragEnd,
  dragging = false,
}: {
  task: Task;
  onOpen: () => void;
  onToggleComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
}) {
  const { state } = useAppData();
  const project = state.projects.find((item) => item.id === task.projectId);
  const client = getClient(state, task.clientId);
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        'group/card relative cursor-pointer rounded-xl border border-line bg-card p-3.5 shadow-card outline-none transition-all duration-150 hover:-translate-y-0.5 hover:border-line hover:shadow-soft focus-visible:ring-2 focus-visible:ring-accent/30',
        dragging && 'rotate-[0.5deg] opacity-50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDot[task.status])} />
          <span className="truncate font-mono text-[9.5px] font-medium tracking-wide text-muted">
            {task.id}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <PriorityBadge priority={task.priority} />
          {(onEdit || onDelete) && (
            <div className="opacity-0 transition group-hover/card:opacity-100">
              <ActionMenu
                items={[
                  ...(onEdit ? [{ label: 'Edit task', onClick: onEdit }] : []),
                  ...(onToggleComplete
                    ? [
                        {
                          label:
                            task.status === 'completed' ? 'Reopen task' : 'Mark as completed',
                          onClick: onToggleComplete,
                        },
                      ]
                    : []),
                  ...(onDelete
                    ? [{ label: 'Delete task', onClick: onDelete, danger: true, separator: true }]
                    : []),
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <h3 className="mt-2 line-clamp-2 text-[12.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">
        {task.title}
      </h3>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-muted">
          {task.description}
        </p>
      )}

      {(project || client) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {project && (
            <span className="rounded border border-line bg-secondary/70 px-1.5 py-0.5 text-[9.5px] font-medium text-soft">
              {project.code}
            </span>
          )}
          {client && (
            <span className="truncate rounded border border-line bg-secondary/70 px-1.5 py-0.5 text-[9.5px] font-medium text-soft">
              {client.businessName}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-medium',
            overdue ? 'text-danger' : 'text-muted',
          )}
        >
          <Calendar className="h-3 w-3" />
          {formatDateShort(task.dueDate)}
          <span className={cn('hidden sm:inline', overdue ? 'text-danger/80' : 'text-muted/80')}>
            · {deadlineLabel(task.dueDate)}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted">
            <MessageSquare className="h-3 w-3" />
            {task.comments}
          </span>
          {onToggleComplete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleComplete();
              }}
              aria-label={task.status === 'completed' ? 'Reopen task' : 'Complete task'}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border transition',
                task.status === 'completed'
                  ? 'border-success bg-success text-white'
                  : 'border-line bg-card text-transparent hover:border-success hover:text-success',
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Kanban column                                                              */
/* -------------------------------------------------------------------------- */

export const KANBAN_COLUMNS: {
  key: Task['status'];
  label: string;
  color: string;
  badge: 'gray' | 'blue' | 'amber' | 'green';
}[] = [
  { key: 'todo', label: 'To Do', color: 'bg-slate-400', badge: 'gray' },
  { key: 'inprogress', label: 'In Progress', color: 'bg-blue-500', badge: 'blue' },
  { key: 'pending', label: 'Pending', color: 'bg-amber-500', badge: 'amber' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500', badge: 'green' },
];

export function KanbanColumn({
  status,
  label,
  color,
  count,
  children,
  onAdd,
  onDrop,
  isOver,
  onDragOver,
  onDragLeave,
  onClearCompleted,
}: {
  status: Task['status'];
  label: string;
  color: string;
  count: number;
  children: ReactNode;
  onAdd: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  isOver: boolean;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onClearCompleted?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex min-w-[272px] flex-1 flex-col rounded-xl border border-transparent transition-colors',
        isOver && 'border-dashed border-accent/40 bg-accent-soft/40',
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between gap-2 px-2 pb-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', color)} />
          <h3 className="truncate text-[11.5px] font-semibold text-ink">{label}</h3>
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-line bg-card px-1 text-[9.5px] font-semibold text-soft">
            {count}
          </span>
        </div>
        <ActionMenu
          items={[
            { label: 'Add task', onClick: onAdd },
            ...(status === 'completed' && onClearCompleted
              ? [{ label: 'Clear completed', onClick: onClearCompleted, danger: true, separator: true }]
              : []),
          ]}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 min-h-[120px]">
        {children}
        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-card/40 text-[10.5px] font-medium text-muted transition hover:border-accent/40 hover:bg-card hover:text-accent-strong"
        >
          <Plus className="h-3 w-3" />
          Add task
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Project card                                                               */
/* -------------------------------------------------------------------------- */

export function ProjectCard({
  project,
  onOpen,
  onDelete,
  onEdit,
}: {
  project: Project;
  onOpen: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const { state } = useAppData();
  const client = getClient(state, project.clientId);
  const daysLeft = deadlineLabel(project.endDate);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen();
      }}
      className="group flex cursor-pointer flex-col rounded-xl border border-line bg-card p-4 shadow-card outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-accent/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9.5px] font-medium tracking-wide text-muted">
            {project.code}
          </span>
          <StatusBadge status={project.status} />
        </div>
        {(onDelete || onEdit) && (
          <div className="opacity-0 transition group-hover:opacity-100">
            <ActionMenu
              items={[
                ...(onEdit ? [{ label: 'Edit project', onClick: onEdit }] : []),
                ...(onDelete
                  ? [{ label: 'Delete project', onClick: onDelete, danger: true, separator: true }]
                  : []),
              ]}
            />
          </div>
        )}
      </div>

      <h3 className="mt-2.5 text-[13px] font-semibold tracking-[-0.01em] text-ink">{project.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-[30px] text-[10.5px] leading-relaxed text-muted">
        {project.description}
      </p>

      <div className="mt-3 flex items-center gap-2">
        {client && <Avatar name={client.businessName} size="xs" />}
        <span className="truncate text-[10.5px] font-medium text-soft">
          {client?.businessName ?? 'Personal project'}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[10px]">
          <span className="text-muted">Progress</span>
          <span className="font-semibold text-ink">{project.progress}%</span>
        </div>
        <Progress
          value={project.progress}
          tone={project.status === 'Completed' ? 'success' : project.progress > 60 ? 'accent' : 'blue'}
        />
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-2 border-t border-line-soft pt-3">
        <div>
          <p className="text-[9.5px] uppercase tracking-wide text-muted">Project value</p>
          <p className="mt-0.5 text-[12px] font-semibold text-ink">{formatMoney(project.value)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9.5px] uppercase tracking-wide text-muted">Timeline</p>
          <p className="mt-0.5 text-[10.5px] font-medium text-soft">
            {formatDateShort(project.startDate)} – {formatDateShort(project.endDate)}
          </p>
          <p
            className={cn(
              'mt-0.5 text-[9.5px]',
              project.status === 'Completed'
                ? 'text-green-600 dark:text-green-400'
                : isOverdue(project.endDate)
                  ? 'text-danger'
                  : 'text-muted',
            )}
          >
            {project.status === 'Completed' ? 'Delivered' : daysLeft}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Client card                                                                */
/* -------------------------------------------------------------------------- */

export function ClientCard({
  client,
  onOpen,
  onDelete,
}: {
  client: Client;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  const { state } = useAppData();
  const projects = state.projects.filter((project) => project.clientId === client.id);
  const value = projectValueByClient(state, client.id);
  const outstanding = clientOutstanding(state, client.id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen();
      }}
      className="group cursor-pointer rounded-xl border border-line bg-card p-4 shadow-card outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-accent/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={client.businessName} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-[12.5px] font-semibold text-ink">{client.businessName}</h3>
            <p className="truncate text-[10.5px] text-soft">{client.name}</p>
            <StatusBadge status={client.status} />
          </div>
        </div>
        {onDelete && (
          <div className="opacity-0 transition group-hover:opacity-100">
            <ActionMenu items={[{ label: 'Delete client', onClick: onDelete, danger: true }]} />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10.5px] text-soft">
        <span className="truncate">{client.phone}</span>
        <span className="text-muted">·</span>
        <span className="truncate text-muted">{client.location}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-line-soft bg-secondary/50 p-2.5">
        <div>
          <p className="text-[9px] uppercase tracking-wide text-muted">Projects</p>
          <p className="mt-0.5 text-[12px] font-semibold text-ink">{projects.length}</p>
        </div>
        <div className="border-x border-line-soft px-2">
          <p className="text-[9px] uppercase tracking-wide text-muted">Value</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-ink">{formatMoney(value)}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-muted">Due</p>
          <p
            className={cn(
              'mt-0.5 truncate text-[11px] font-semibold',
              outstanding > 0 ? 'text-danger' : 'text-success',
            )}
          >
            {outstanding > 0 ? formatMoney(outstanding) : 'Clear'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-muted">Client since {formatDateShort(client.createdAt)}</span>
        <span className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-accent-strong opacity-0 transition group-hover:opacity-100">
          Open profile <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Activity feed                                                              */
/* -------------------------------------------------------------------------- */

const activityIcon = {
  task: CheckCircle2,
  payment: Wallet,
  invoice: FileText,
  client: Users,
  project: FolderKanban,
  work: Clock3,
  document: Files,
  system: Sparkles,
};

const activityTone = {
  task: 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400',
  payment: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
  invoice: 'text-accent-strong bg-accent-soft',
  client: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',
  project: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400',
  work: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-400',
  document: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
  system: 'text-soft bg-secondary',
};

export function ActivityFeed({
  activities,
  limit,
  compact = false,
}: {
  activities: Activity[];
  limit?: number;
  compact?: boolean;
}) {
  const items = limit ? activities.slice(0, limit) : activities;
  return (
    <div className={cn('relative', compact ? 'space-y-2.5' : 'space-y-3')}>
      {items.map((activity) => {
        const Icon = activityIcon[activity.type] ?? Sparkles;
        return (
          <div key={activity.id} className="flex items-start gap-2.5">
            <span
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                activityTone[activity.type] ?? activityTone.system,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-medium leading-tight text-ink">{activity.message}</p>
              <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-relaxed text-muted">
                {activity.detail}
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap pt-0.5 text-[9.5px] text-muted">
              {relativeTime(activity.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Quick actions                                                              */
/* -------------------------------------------------------------------------- */

export function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { label: 'New task', icon: Plus, to: '/tasks?create=1', tint: 'text-accent-strong bg-accent-soft' },
    { label: 'Log work', icon: Clock3, to: '/daily-work?create=1', tint: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' },
    { label: 'New invoice', icon: FileText, to: '/invoices?create=1', tint: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400' },
    { label: 'Upload file', icon: Upload, to: '/documents?upload=1', tint: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            onClick={() => navigate(action.to)}
            className="flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-2 text-left text-[10.5px] font-medium text-soft transition hover:border-accent/30 hover:text-ink"
          >
            <span className={cn('flex h-6 w-6 items-center justify-center rounded-md', action.tint)}>
              <Icon className="h-3 w-3" />
            </span>
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Task row (dashboard / lists)                                               */
/* -------------------------------------------------------------------------- */

export function TaskRow({
  task,
  onToggle,
  onOpen,
}: {
  task: Task;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { state } = useAppData();
  const project = state.projects.find((item) => item.id === task.projectId);
  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-1 py-2 transition hover:bg-secondary/60">
      <button
        type="button"
        onClick={onToggle}
        aria-label={task.status === 'completed' ? 'Reopen task' : 'Complete task'}
        className={cn(
          'flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border transition',
          task.status === 'completed'
            ? 'border-success bg-success text-white'
            : 'border-line bg-card text-transparent hover:border-success hover:text-success',
        )}
      >
        <CheckCircle2 className="h-3 w-3" />
      </button>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p
          className={cn(
            'truncate text-[11.5px] font-medium text-ink',
            task.status === 'completed' && 'text-muted line-through',
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[9.5px] text-muted">
          {project?.code && <span>{project.code}</span>}
          <span className={cn(isOverdue(task.dueDate) && task.status !== 'completed' && 'text-danger')}>
            Due {formatDateShort(task.dueDate)}
          </span>
        </p>
      </button>
      <PriorityBadge priority={task.priority} />
      <ArrowUpRight className="h-3 w-3 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Invoice summary strip                                                      */
/* -------------------------------------------------------------------------- */

export function financialStatusTone(status: string) {
  if (status === 'Paid') return 'text-success';
  if (status === 'Overdue') return 'text-danger';
  if (status === 'Partially Paid') return 'text-warning';
  return 'text-soft';
}

export { invoiceStatus, formatDuration, workDuration };
