import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Columns3,
  ListChecks,
  Plus,
  Timer,
  Trash2,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { WorkCategory, WorkEntry, WorkStatus } from '../types';
import {
  addDays,
  cn,
  endOfWeek,
  formatDate,
  formatDateLong,
  formatDuration,
  formatMonthYear,
  formatTime,
  getMonthGrid,
  isToday,
  nextSequence,
  parseISODate,
  startOfWeek,
  toISO,
  todayISO,
  uid,
  workDuration,
} from '../lib/utils';
import { getClient } from '../lib/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/shared/cards';
import {
  ActionMenu,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  Select,
  StatusBadge,
  Tabs,
  Textarea,
  useToast,
} from '../components/ui';

type WorkView = 'daily' | 'weekly' | 'monthly' | 'calendar';

const CATEGORIES: WorkCategory[] = [
  'Design',
  'Development',
  'Meetings',
  'Research',
  'Writing',
  'Administration',
  'Other',
];

const categoryTone: Record<WorkCategory, 'orange' | 'blue' | 'purple' | 'green' | 'gray' | 'amber'> = {
  Design: 'orange',
  Development: 'blue',
  Meetings: 'purple',
  Research: 'green',
  Writing: 'amber',
  Administration: 'gray',
  Other: 'gray',
};

export function DailyWorkPage() {
  const { state, addWork, updateWork, deleteWork } = useAppData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<WorkView>('daily');
  const [reference, setReference] = useState(todayISO());
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayISO());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkEntry | null>(null);
  const [defaultDate, setDefaultDate] = useState(todayISO());
  const [confirmEntry, setConfirmEntry] = useState<WorkEntry | null>(null);

  useEffect(() => {
    const create = searchParams.get('create');
    if (create) {
      setEditing(null);
      setDefaultDate(todayISO());
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      next.delete('t');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const todayMinutes = useMemo(
    () =>
      state.workEntries
        .filter((entry) => entry.date === todayISO() && entry.status !== 'Planned')
        .reduce((total, entry) => total + workDuration(entry.startTime, entry.endTime), 0),
    [state.workEntries],
  );

  const stats = useMemo(
    () => ({
      completed: state.workEntries.filter((entry) => entry.status === 'Completed').length,
      ongoing: state.workEntries.filter((entry) => entry.status === 'Ongoing').length,
    }),
    [state.workEntries],
  );

  const openCreate = (date = reference) => {
    setEditing(null);
    setDefaultDate(date);
    setFormOpen(true);
  };

  const openEdit = (entry: WorkEntry) => {
    setEditing(entry);
    setDefaultDate(entry.date);
    setFormOpen(true);
  };

  const shiftPeriod = (direction: 1 | -1) => {
    if (view === 'weekly') {
      setReference(addDays(reference, direction * 7));
      return;
    }
    if (view === 'monthly') {
      const date = parseISODate(reference);
      const next = new Date(date.getFullYear(), date.getMonth() + direction, 1);
      setReference(toISO(next));
      return;
    }
    setReference(addDays(reference, direction));
  };

  const goToday = () => {
    setReference(todayISO());
    setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setSelectedCalendarDate(todayISO());
  };

  const periodLabel = useMemo(() => {
    if (view === 'daily') {
      return formatDateLong(parseISODate(reference));
    }
    if (view === 'weekly') {
      const start = startOfWeek(parseISODate(reference));
      const end = endOfWeek(parseISODate(reference));
      return `${formatDate(toISO(start))} – ${formatDate(toISO(end))}`;
    }
    return formatMonthYear(parseISODate(reference));
  }, [reference, view]);

  const views = [
    { value: 'daily' as const, label: 'Daily', icon: Clock3 },
    { value: 'weekly' as const, label: 'Weekly', icon: Columns3 },
    { value: 'monthly' as const, label: 'Monthly', icon: ListChecks },
    { value: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  ];

  const handleSave = (entry: WorkEntry, isNew: boolean) => {
    if (isNew) {
      addWork(entry);
      toast({
        title: 'Work entry added',
        description: `${entry.title} · ${formatDuration(workDuration(entry.startTime, entry.endTime))}`,
      });
    } else {
      updateWork(entry);
      toast({ title: 'Work entry updated', description: entry.title });
    }
    setFormOpen(false);
    setEditing(null);
    setReference(entry.date);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Daily Work"
        description="Track what you work on every day, and build a clear record of your time."
        actions={
          <Button variant="primary" size="md" onClick={() => openCreate()}>
            <Plus className="h-3.5 w-3.5" />
            Add Work Entry
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Clock3}
          label="Today's Work Hours"
          value={formatDuration(todayMinutes)}
          hint={`${state.workEntries.filter((entry) => entry.date === todayISO()).length} entries logged today`}
          tone="accent"
        />
        <StatCard
          icon={ListChecks}
          label="Total Activities"
          value={String(state.workEntries.length)}
          hint="Across your personal workspace"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed Activities"
          value={String(stats.completed)}
          hint="Fully wrapped up"
        />
        <StatCard
          icon={Timer}
          label="Ongoing Activities"
          value={String(stats.ongoing)}
          hint="Currently in progress"
        />
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={view} onChange={setView} options={views} className="w-fit" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1 shadow-card">
            <IconButton variant="ghost" size="icon-sm" onClick={() => shiftPeriod(-1)} aria-label="Previous period">
              <ChevronLeft className="h-3.5 w-3.5" />
            </IconButton>
            <span className="min-w-[170px] px-2 text-center text-[10.5px] font-medium text-ink">
              {periodLabel}
            </span>
            <IconButton variant="ghost" size="icon-sm" onClick={() => shiftPeriod(1)} aria-label="Next period">
              <ChevronRight className="h-3.5 w-3.5" />
            </IconButton>
          </div>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>
      </div>

      {view === 'daily' && (
        <DailyView
          entries={state.workEntries.filter((entry) => entry.date === reference)}
          date={reference}
          onAdd={() => openCreate(reference)}
          onEdit={openEdit}
          onDelete={setConfirmEntry}
        />
      )}

      {view === 'weekly' && (
        <WeeklyView
          entries={state.workEntries}
          reference={reference}
          onAdd={(date) => openCreate(date)}
          onEdit={openEdit}
        />
      )}

      {view === 'monthly' && <MonthlyView entries={state.workEntries} reference={reference} onEdit={openEdit} onAdd={openCreate} />}

      {view === 'calendar' && (
        <CalendarView
          entries={state.workEntries}
          month={calendarMonth}
          setMonth={setCalendarMonth}
          selected={selectedCalendarDate}
          onSelect={setSelectedCalendarDate}
          onAdd={(date) => openCreate(date)}
          onEdit={openEdit}
        />
      )}

      {formOpen && (
        <WorkFormModal
          initialEntry={editing}
          defaultDate={defaultDate}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmEntry)}
        onClose={() => setConfirmEntry(null)}
        onConfirm={() => {
          if (confirmEntry) {
            deleteWork(confirmEntry.id);
            toast({ title: 'Work entry removed', description: confirmEntry.title });
          }
          setConfirmEntry(null);
        }}
        title="Delete this work entry?"
        description={
          confirmEntry
            ? `“${confirmEntry.title}” on ${formatDate(confirmEntry.date)} will be permanently removed.`
            : ''
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Daily view                                                                 */
/* -------------------------------------------------------------------------- */

function DailyView({
  entries,
  date,
  onAdd,
  onEdit,
  onDelete,
}: {
  entries: WorkEntry[];
  date: string;
  onAdd: () => void;
  onEdit: (entry: WorkEntry) => void;
  onDelete: (entry: WorkEntry) => void;
}) {
  const { state } = useAppData();
  const sorted = [...entries].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const total = sorted.reduce((sum, entry) => sum + workDuration(entry.startTime, entry.endTime), 0);

  return (
    <div className="rounded-xl border border-line bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <div>
          <p className="text-[12.5px] font-semibold text-ink">
            {isToday(date) ? 'Today' : formatDate(date)}
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted">
            {sorted.length} activities · {formatDuration(total)} logged
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add entry
        </Button>
      </div>

      <div className="p-4">
        {sorted.length === 0 ? (
          <EmptyState
            icon={Clock3}
            title="No work logged for this day"
            description="Add an entry to keep an accurate record of how you spend your time."
            action={
              <Button variant="primary" size="sm" onClick={onAdd}>
                <Plus className="h-3.5 w-3.5" />
                Add work entry
              </Button>
            }
            className="border-0 bg-transparent py-10"
          />
        ) : (
          <div className="relative space-y-3 before:absolute before:bottom-4 before:left-[71px] before:top-4 before:w-px before:bg-line sm:before:left-[91px]">
            {sorted.map((entry) => {
              const duration = workDuration(entry.startTime, entry.endTime);
              const client = getClient(state, entry.clientId);
              const project = state.projects.find((item) => item.id === entry.projectId);
              return (
                <div key={entry.id} className="relative flex gap-3 sm:gap-4">
                  <div className="w-[58px] shrink-0 pt-2 text-right sm:w-[78px]">
                    <p className="text-[10.5px] font-semibold text-ink">{formatTime(entry.startTime)}</p>
                    <p className="mt-0.5 text-[9.5px] text-muted">{formatTime(entry.endTime)}</p>
                  </div>
                  <span
                    className={cn(
                      'relative z-10 mt-3.5 h-[9px] w-[9px] shrink-0 rounded-full border-2 border-card',
                      entry.status === 'Completed'
                        ? 'bg-success'
                        : entry.status === 'Ongoing'
                          ? 'bg-accent'
                          : 'bg-info',
                    )}
                  />
                  <div className="group min-w-0 flex-1 rounded-xl border border-line bg-card p-3 shadow-card transition hover:border-accent/20 hover:shadow-soft">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[12px] font-semibold text-ink">{entry.title}</h3>
                        <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted">{entry.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge tone={categoryTone[entry.category]}>{entry.category}</Badge>
                        <StatusBadge status={entry.status} dot={false} />
                        <div className="opacity-0 transition group-hover:opacity-100">
                          <ActionMenu
                            items={[
                              { label: 'Edit entry', onClick: () => onEdit(entry) },
                              { label: 'Delete entry', onClick: () => onDelete(entry), danger: true, separator: true },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-2 text-[9.5px] text-muted">
                      <span className="inline-flex items-center gap-1 font-medium text-soft">
                        <Timer className="h-3 w-3" />
                        {formatDuration(duration)}
                      </span>
                      {client && (
                        <>
                          <span className="text-line">|</span>
                          <span>{client.businessName}</span>
                        </>
                      )}
                      {project && (
                        <>
                          <span className="text-line">|</span>
                          <span>{project.name}</span>
                        </>
                      )}
                      {entry.notes && (
                        <>
                          <span className="text-line">|</span>
                          <span className="line-clamp-1 italic">{entry.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Weekly view                                                                */
/* -------------------------------------------------------------------------- */

function WeeklyView({
  entries,
  reference,
  onAdd,
  onEdit,
}: {
  entries: WorkEntry[];
  reference: string;
  onAdd: (date: string) => void;
  onEdit: (entry: WorkEntry) => void;
}) {
  const start = startOfWeek(parseISODate(reference));
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    const iso = toISO(date);
    return {
      iso,
      date,
      entries: entries
        .filter((entry) => entry.date === iso)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    };
  });
  const weekTotal = days.reduce(
    (total, day) =>
      total + day.entries.reduce((sum, entry) => sum + workDuration(entry.startTime, entry.endTime), 0),
    0,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 shadow-card">
        <p className="text-[12px] font-semibold text-ink">Week overview</p>
        <p className="text-[10.5px] text-muted">
          Total logged: <span className="font-semibold text-ink">{formatDuration(weekTotal)}</span>
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => {
          const total = day.entries.reduce(
            (sum, entry) => sum + workDuration(entry.startTime, entry.endTime),
            0,
          );
          return (
            <div
              key={day.iso}
              className={cn(
                'rounded-xl border bg-card shadow-card',
                isToday(day.iso) ? 'border-accent/40 ring-1 ring-accent/20' : 'border-line',
              )}
            >
              <div className="flex items-center justify-between border-b border-line-soft px-3 py-2.5">
                <div>
                  <p className="text-[11px] font-semibold text-ink">
                    {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day.date)}
                    {isToday(day.iso) && <span className="ml-1 text-[9px] text-accent-strong">Today</span>}
                  </p>
                  <p className="text-[9px] text-muted">{formatDate(day.iso)}</p>
                </div>
                <Badge tone="gray">{formatDuration(total)}</Badge>
              </div>
              <div className="space-y-1.5 p-2">
                {day.entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="w-full rounded-lg border border-line-soft bg-secondary/30 px-2 py-1.5 text-left transition hover:border-accent/30 hover:bg-card"
                  >
                    <p className="truncate text-[10.5px] font-medium text-ink">{entry.title}</p>
                    <p className="mt-0.5 text-[9px] text-muted">
                      {entry.startTime} – {entry.endTime} · {formatDuration(workDuration(entry.startTime, entry.endTime))}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onAdd(day.iso)}
                  className="flex h-7 w-full items-center justify-center gap-1 rounded-lg border border-dashed border-line text-[9.5px] text-muted transition hover:border-accent/40 hover:text-accent-strong"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Monthly view                                                               */
/* -------------------------------------------------------------------------- */

function MonthlyView({
  entries,
  reference,
  onEdit,
  onAdd,
}: {
  entries: WorkEntry[];
  reference: string;
  onEdit: (entry: WorkEntry) => void;
  onAdd: (date: string) => void;
}) {
  const monthKey = reference.slice(0, 7);
  const monthEntries = entries.filter((entry) => entry.date.startsWith(monthKey));
  const byDate = new Map<string, WorkEntry[]>();
  monthEntries
    .filter((entry) => entry.date.startsWith(monthKey))
    .forEach((entry) => byDate.set(entry.date, [...(byDate.get(entry.date) ?? []), entry]));
  const days = Array.from(byDate.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const total = monthEntries.reduce(
    (sum, entry) => sum + workDuration(entry.startTime, entry.endTime),
    0,
  );
  const totalActivities = monthEntries.length;
  const maxDayMinutes = Math.max(
    1,
    ...Array.from(byDate.values()).map((items) =>
      items.reduce((sum, entry) => sum + workDuration(entry.startTime, entry.endTime), 0),
    ),
  );
  const activeDays = byDate.size;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-xl border border-line bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-4 py-3">
          <div>
            <p className="text-[12.5px] font-semibold text-ink">{formatMonthYear(parseISODate(reference))}</p>
            <p className="mt-0.5 text-[10px] text-muted">
              {totalActivities} activities across {activeDays} days · {formatDuration(total)}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onAdd(reference)}>
            <Plus className="h-3.5 w-3.5" />
            Add entry
          </Button>
        </div>
        <div className="divide-y divide-line-soft">
          {days.map(([date, items]) => {
            const dayTotal = items.reduce(
              (sum, entry) => sum + workDuration(entry.startTime, entry.endTime),
              0,
            );
            return (
              <div key={date} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-9 flex-col items-center justify-center rounded-lg border border-line bg-secondary/60">
                      <span className="text-[8px] uppercase tracking-wide text-muted">
                        {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parseISODate(date))}
                      </span>
                      <span className="text-[11px] font-semibold leading-none text-ink">
                        {parseISODate(date).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-ink">
                        {new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(parseISODate(date))}
                      </p>
                      <p className="text-[9.5px] text-muted">{formatDate(date)}</p>
                    </div>
                  </div>
                  <Badge tone="gray">{formatDuration(dayTotal)}</Badge>
                </div>
                <div className="mt-2 space-y-1">
                  {items
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onEdit(entry)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-secondary/60"
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', entry.status === 'Completed' ? 'bg-success' : entry.status === 'Ongoing' ? 'bg-accent' : 'bg-info')} />
                        <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink">{entry.title}</span>
                        <Badge tone={categoryTone[entry.category]}>{entry.category}</Badge>
                        <span className="w-16 text-right text-[9.5px] text-muted">
                          {formatDuration(workDuration(entry.startTime, entry.endTime))}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
          {days.length === 0 && (
            <div className="p-4">
              <EmptyState
                icon={Clock3}
                title="No work logged this month"
                description="Start logging your daily work to see a monthly overview here."
                className="border-0 bg-transparent py-8"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-card p-4 shadow-card">
          <p className="text-[12px] font-semibold text-ink">Daily distribution</p>
          <p className="mt-0.5 text-[10px] text-muted">Minutes logged per day</p>
          <div className="mt-4 flex h-[150px] items-end gap-1">
            {Array.from(byDate.entries())
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([date, items]) => {
                const minutes = items.reduce(
                  (sum, entry) => sum + workDuration(entry.startTime, entry.endTime),
                  0,
                );
                return (
                  <div key={date} className="group flex flex-1 flex-col items-center gap-1">
                    <span className="text-[8px] text-muted opacity-0 transition group-hover:opacity-100">
                      {Math.round(minutes / 60)}h
                    </span>
                    <div
                      className="w-full rounded-t bg-accent/80 transition hover:bg-accent"
                      style={{ height: `${Math.max(4, (minutes / maxDayMinutes) * 120)}px` }}
                      title={`${formatDate(date)} · ${formatDuration(minutes)}`}
                    />
                    <span className="text-[8px] text-muted">{parseISODate(date).getDate()}</span>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-card p-4 shadow-card">
          <p className="text-[12px] font-semibold text-ink">Category split</p>
          <div className="mt-3 space-y-2.5">
            {CATEGORIES.map((category) => {
              const minutes = monthEntries
                .filter((entry) => entry.category === category)
                .reduce((sum, entry) => sum + workDuration(entry.startTime, entry.endTime), 0);
              if (!minutes) return null;
              const percent = total ? (minutes / total) * 100 : 0;
              return (
                <div key={category}>
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span className="text-soft">{category}</span>
                    <span className="font-medium text-ink">{formatDuration(minutes)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar view                                                              */
/* -------------------------------------------------------------------------- */

function CalendarView({
  entries,
  month,
  setMonth,
  selected,
  onSelect,
  onAdd,
  onEdit,
}: {
  entries: WorkEntry[];
  month: Date;
  setMonth: (date: Date) => void;
  selected: string;
  onSelect: (date: string) => void;
  onAdd: (date: string) => void;
  onEdit: (entry: WorkEntry) => void;
}) {
  const days = useMemo(() => getMonthGrid(month.getFullYear(), month.getMonth()), [month]);
  const selectedEntries = entries.filter((entry) => entry.date === selected);
  const selectedTotal = selectedEntries.reduce(
    (sum, entry) => sum + workDuration(entry.startTime, entry.endTime),
    0,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-xl border border-line bg-card p-3 shadow-card">
        <div className="flex items-center justify-between px-1 pb-3">
          <h2 className="text-[12.5px] font-semibold text-ink">{formatMonthYear(month)}</h2>
          <div className="flex items-center gap-1">
            <IconButton
              variant="secondary"
              size="icon-sm"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </IconButton>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                onSelect(todayISO());
              }}
            >
              Today
            </Button>
            <IconButton
              variant="secondary"
              size="icon-sm"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="pb-1 text-center text-[9px] font-semibold uppercase tracking-wide text-muted">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const iso = toISO(day);
            const dayEntries = entries.filter((entry) => entry.date === iso);
            const minutes = dayEntries.reduce(
              (sum, entry) => sum + workDuration(entry.startTime, entry.endTime),
              0,
            );
            const inMonth = day.getMonth() === month.getMonth();
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelect(iso)}
                className={cn(
                  'min-h-[70px] rounded-lg border p-1.5 text-left transition',
                  selected === iso
                    ? 'border-accent bg-accent-soft'
                    : 'border-line-soft bg-card hover:border-line hover:bg-secondary/40',
                  !inMonth && 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                    iso === todayISO() ? 'bg-accent text-white' : 'text-soft',
                  )}
                >
                  {day.getDate()}
                </span>
                {minutes > 0 && (
                  <span className="mt-1 flex items-center gap-1 rounded bg-secondary px-1 py-0.5 text-[8px] font-medium text-soft">
                    <Clock3 className="h-2.5 w-2.5" />
                    {formatDuration(minutes)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
          <div>
            <p className="text-[12px] font-semibold text-ink">{formatDate(selected)}</p>
            <p className="mt-0.5 text-[10px] text-muted">
              {selectedEntries.length} entries · {formatDuration(selectedTotal)}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onAdd(selected)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        <div className="space-y-2 p-2">
          {selectedEntries.length === 0 && (
            <p className="px-3 py-10 text-center text-[11px] text-muted">No work logged on this day.</p>
          )}
          {selectedEntries
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onEdit(entry)}
                className="flex w-full items-start gap-2 rounded-lg border border-line bg-card p-2.5 text-left transition hover:border-accent/30"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium text-ink">{entry.title}</span>
                  <span className="mt-0.5 block text-[9.5px] text-muted">
                    {formatTime(entry.startTime)} – {formatTime(entry.endTime)} ·{' '}
                    {formatDuration(workDuration(entry.startTime, entry.endTime))}
                  </span>
                </span>
                <Badge tone={categoryTone[entry.category]}>{entry.category}</Badge>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Work entry form                                                            */
/* -------------------------------------------------------------------------- */

function WorkFormModal({
  initialEntry,
  defaultDate,
  onClose,
  onSave,
}: {
  initialEntry: WorkEntry | null;
  defaultDate: string;
  onClose: () => void;
  onSave: (entry: WorkEntry, isNew: boolean) => void;
}) {
  const { state } = useAppData();
  const [title, setTitle] = useState(initialEntry?.title ?? '');
  const [description, setDescription] = useState(initialEntry?.description ?? '');
  const [date, setDate] = useState(initialEntry?.date ?? defaultDate);
  const [startTime, setStartTime] = useState(initialEntry?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(initialEntry?.endTime ?? '10:30');
  const [category, setCategory] = useState<WorkCategory>(initialEntry?.category ?? 'Design');
  const [clientId, setClientId] = useState(initialEntry?.clientId ?? '');
  const [projectId, setProjectId] = useState(initialEntry?.projectId ?? '');
  const [status, setStatus] = useState<WorkStatus>(initialEntry?.status ?? 'Completed');
  const [notes, setNotes] = useState(initialEntry?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const duration = workDuration(startTime, endTime);
  const projects = clientId
    ? state.projects.filter((project) => project.clientId === clientId)
    : state.projects;

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Give this work entry a title.';
    if (!date) nextErrors.date = 'Select a date.';
    if (!startTime) nextErrors.startTime = 'Add a start time.';
    if (!endTime) nextErrors.endTime = 'Add an end time.';
    if (startTime && endTime && workDuration(startTime, endTime) <= 0) {
      nextErrors.endTime = 'End time must be later than start time.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    window.setTimeout(() => {
      const project = state.projects.find((item) => item.id === projectId);
      const entry: WorkEntry = {
        id: initialEntry?.id ?? `WORK-${String(nextSequence(state.workEntries.map((item) => item.id), 'WORK')).padStart(3, '0')}`,
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        category,
        clientId: clientId || project?.clientId || undefined,
        projectId: projectId || undefined,
        status,
        notes: notes.trim(),
      };
      onSave(entry, !initialEntry);
      setSaving(false);
    }, 300);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initialEntry ? 'Edit work entry' : 'Add work entry'}
      description="Log the time you spent, so your weekly and monthly overview stays accurate."
      size="lg"
      footer={
        <>
          <div className="mr-auto hidden items-center gap-1.5 rounded-lg border border-line bg-secondary/60 px-2.5 py-1.5 text-[10.5px] text-soft sm:flex">
            <Timer className="h-3 w-3" />
            Duration: <span className="font-semibold text-ink">{formatDuration(duration)}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={() => submit()}>
            {initialEntry ? 'Save changes' : 'Add entry'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Work title" required error={errors.title}>
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Homepage hero exploration"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What did you work on?"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Work date" required error={errors.date}>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Start time" required error={errors.startTime}>
            <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </Field>
          <Field label="End time" required error={errors.endTime}>
            <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line bg-secondary/40 px-3 py-2 text-[11px] sm:hidden">
          <span className="flex items-center gap-1.5 text-soft">
            <Timer className="h-3.5 w-3.5" /> Total duration
          </span>
          <span className="font-semibold text-ink">{formatDuration(duration)}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <Select value={category} onChange={(event) => setCategory(event.target.value as WorkCategory)}>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value as WorkStatus)}>
              <option value="Completed">Completed</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Planned">Planned</option>
            </Select>
          </Field>
          <Field label="Client">
            <Select
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value);
                if (!event.target.value) setProjectId('');
              }}
            >
              <option value="">Personal work</option>
              {state.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.businessName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project">
            <Select
              value={projectId}
              onChange={(event) => {
                const value = event.target.value;
                setProjectId(value);
                const project = state.projects.find((item) => item.id === value);
                if (project && !clientId) setClientId(project.clientId);
              }}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Notes" hint="Optional context for future you.">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Any blockers, follow-ups or ideas worth remembering."
            className="min-h-[64px]"
          />
        </Field>
      </form>
    </Modal>
  );
}
