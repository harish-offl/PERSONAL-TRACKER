import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Grid3x3,
  Layers,
  List,
  Plus,
  Milestone as Timeline,
  Wallet,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { Project, ProjectStatus } from '../types';
import {
  addDays,
  cn,
  formatDate,
  formatMoney,
  getMonthGrid,
  nextSequence,
  parseISODate,
  toISO,
  todayISO,
  uid,
} from '../lib/utils';
import { getClient } from '../lib/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { ProjectCard, StatCard } from '../components/shared/cards';
import {
  ActionMenu,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  FilterMenu,
  Input,
  Modal,
  Progress,
  SearchInput,
  Select,
  StatusBadge,
  Tabs,
  TableRow,
  Td,
  Textarea,
  Th,
  useToast,
} from '../components/ui';

type ProjectView = 'grid' | 'list' | 'timeline' | 'calendar';
type ProjectSort = 'deadline' | 'progress' | 'value' | 'name';

export function ProjectsPage() {
  const { state, addProject, updateProject, deleteProject } = useAppData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ProjectView>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus[]>([]);
  const [sort, setSort] = useState<ProjectSort>('deadline');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  useEffect(() => {
    const create = searchParams.get('create');
    if (create) {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      next.delete('t');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.projects
      .filter((project) => {
        const client = getClient(state, project.clientId);
        const haystack = `${project.name} ${project.code} ${project.description} ${client?.businessName ?? ''}`.toLowerCase();
        return (
          (!q || haystack.includes(q)) &&
          (statusFilter.length === 0 || statusFilter.includes(project.status))
        );
      })
      .sort((a, b) => {
        if (sort === 'value') return b.value - a.value;
        if (sort === 'progress') return b.progress - a.progress;
        if (sort === 'name') return a.name.localeCompare(b.name);
        return a.endDate.localeCompare(b.endDate);
      });
  }, [state, search, statusFilter, sort]);

  const active = state.projects.filter((project) => project.status === 'Active');
  const completed = state.projects.filter((project) => project.status === 'Completed');
  const totalValue = state.projects.reduce((total, project) => total + project.value, 0);

  const handleSave = (project: Project, isNew: boolean) => {
    if (isNew) {
      addProject(project);
      toast({ title: 'Project created', description: `${project.code} · ${project.name}` });
    } else {
      updateProject(project);
      toast({ title: 'Project updated', description: project.name });
    }
    setFormOpen(false);
    setEditing(null);
  };

  const views = [
    { value: 'grid' as const, label: 'Grid', icon: Grid3x3 },
    { value: 'list' as const, label: 'List', icon: List },
    { value: 'timeline' as const, label: 'Timeline', icon: Timeline },
    { value: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Projects"
        description="Track your projects, timelines, and progress."
        badge={<Badge tone="gray">{state.projects.length} total</Badge>}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Project
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={String(state.projects.length)} hint="Across all clients" />
        <StatCard icon={Layers} label="Active Projects" value={String(active.length)} hint="Currently in motion" tone="accent" />
        <StatCard icon={FolderKanban} label="Completed Projects" value={String(completed.length)} hint="Delivered successfully" />
        <StatCard icon={Wallet} label="Total Project Value" value={formatMoney(totalValue, { compact: true })} hint="Combined portfolio" />
      </div>

      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <Tabs value={view} onChange={setView} options={views} className="w-fit" />
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search projects…"
            className="w-full sm:w-56"
          />
          <FilterMenu
            label="Status"
            options={(['Planning', 'Active', 'On Hold', 'Completed'] as ProjectStatus[]).map((status) => ({
              value: status,
              label: status,
              count: state.projects.filter((project) => project.status === status).length,
            }))}
            selected={statusFilter}
            onChange={setStatusFilter}
            onClear={() => setStatusFilter([])}
          />
          <div className="hidden sm:block">
            <Select value={sort} onChange={(event) => setSort(event.target.value as ProjectSort)} className="w-[148px]">
              <option value="deadline">Sort: Deadline</option>
              <option value="progress">Sort: Progress</option>
              <option value="value">Sort: Value</option>
              <option value="name">Sort: Name</option>
            </Select>
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Adjust your filters or create a project to start tracking your work."
          action={
            <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-3.5 w-3.5" />
              Create project
            </Button>
          }
        />
      )}

      {filtered.length > 0 && view === 'grid' && (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => navigate(`/projects/${project.id}`)}
              onEdit={() => {
                setEditing(project);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(project)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && view === 'list' && (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
          <DataTable minWidth={1080}>
            <thead>
              <tr>
                <Th>Project</Th>
                <Th>Client</Th>
                <Th>Timeline</Th>
                <Th>Progress</Th>
                <Th align="right">Value</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => {
                const client = getClient(state, project.clientId);
                return (
                  <TableRow key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>
                    <Td>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-ink">{project.name}</p>
                        <p className="mt-0.5 font-mono text-[9.5px] text-muted">{project.code}</p>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-[11px]">{client?.businessName ?? '—'}</span>
                    </Td>
                    <Td>
                      <span className="whitespace-nowrap text-[10.5px]">
                        {formatDate(project.startDate)} – {formatDate(project.endDate)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="w-20" />
                        <span className="text-[10px] font-medium text-soft">{project.progress}%</span>
                      </div>
                    </Td>
                    <Td align="right">
                      <span className="whitespace-nowrap text-[11.5px] font-medium text-ink">{formatMoney(project.value)}</span>
                    </Td>
                    <Td><StatusBadge status={project.status} /></Td>
                    <Td align="right">
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <ActionMenu
                          label={`Actions for ${project.name}`}
                          items={[
                            { label: 'Open project', onClick: () => navigate(`/projects/${project.id}`) },
                            { label: 'Edit project', onClick: () => { setEditing(project); setFormOpen(true); } },
                            { label: 'Delete project', onClick: () => setDeleting(project), danger: true, separator: true },
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

      {filtered.length > 0 && view === 'timeline' && <ProjectTimeline projects={filtered} onOpen={(id) => navigate(`/projects/${id}`)} />}

      {filtered.length > 0 && view === 'calendar' && <ProjectCalendar projects={filtered} onOpen={(id) => navigate(`/projects/${id}`)} />}

      {formOpen && (
        <ProjectFormModal
          initialProject={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteProject(deleting.id);
            toast({ title: 'Project removed', description: deleting.name });
          }
          setDeleting(null);
        }}
        title="Delete this project?"
        description={
          deleting
            ? `“${deleting.name}” will be removed along with its linked tasks and daily work entries. Invoices will stay in your records without a project.`
            : ''
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline                                                                   */
/* -------------------------------------------------------------------------- */

function ProjectTimeline({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  const { state } = useAppData();
  const data = useMemo(() => {
    if (!projects.length) return null;
    const starts = projects.map((project) => parseISODate(project.startDate).getTime());
    const ends = projects.map((project) => parseISODate(project.endDate).getTime());
    const min = new Date(Math.min(...starts));
    const max = new Date(Math.max(...ends));
    const windowStart = new Date(min.getFullYear(), min.getMonth(), 1);
    const windowEnd = new Date(max.getFullYear(), max.getMonth() + 1, 0);
    const totalDays = Math.max(
      1,
      Math.round((windowEnd.getTime() - windowStart.getTime()) / 86400000) + 1,
    );
    const months: { label: string; left: number; width: number }[] = [];
    let cursor = new Date(windowStart);
    while (cursor <= windowEnd) {
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const startOffset = Math.round((cursor.getTime() - windowStart.getTime()) / 86400000);
      const duration = Math.min(
        Math.round((monthEnd.getTime() - cursor.getTime()) / 86400000) + 1,
        totalDays - startOffset,
      );
      months.push({
        label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(cursor),
        left: (startOffset / totalDays) * 100,
        width: (duration / totalDays) * 100,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return { windowStart, totalDays, months };
  }, [projects]);

  if (!data) return null;

  const barColor: Record<ProjectStatus, string> = {
    Planning: 'bg-info/25',
    Active: 'bg-accent/20',
    'On Hold': 'bg-warning/20',
    Completed: 'bg-success/20',
  };
  const barInner: Record<ProjectStatus, string> = {
    Planning: 'bg-info',
    Active: 'bg-accent',
    'On Hold': 'bg-warning',
    Completed: 'bg-success',
  };

  return (
    <div className="rounded-xl border border-line bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
        <div>
          <p className="text-[12.5px] font-semibold text-ink">Portfolio timeline</p>
          <p className="mt-0.5 text-[10px] text-muted">Project schedules across your working window</p>
        </div>
        <div className="flex items-center gap-3 text-[9.5px] text-muted">
          {(['Active', 'Planning', 'On Hold', 'Completed'] as ProjectStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1">
              <span className={cn('h-2 w-2 rounded-full', barInner[status])} />
              {status}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="flex min-w-[820px] gap-3">
          <div className="w-56 shrink-0">
            <div className="h-8" />
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onOpen(project.id)}
                className="flex h-14 w-full flex-col justify-center border-t border-line-soft text-left transition hover:bg-secondary/40"
              >
                <span className="truncate text-[11px] font-medium text-ink">{project.name}</span>
                <span className="mt-0.5 truncate text-[9px] text-muted">
                  {getClient(state, project.clientId)?.businessName ?? 'Client'} · {project.code}
                </span>
              </button>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="relative h-8">
              {data.months.map((month, index) => (
                <span
                  key={`${month.label}-${index}`}
                  className="absolute top-1 text-[9px] font-medium uppercase tracking-wide text-muted"
                  style={{ left: `${month.left}%` }}
                >
                  {month.label}
                </span>
              ))}
            </div>
            {projects.map((project) => {
              const startOffset = Math.round(
                (parseISODate(project.startDate).getTime() - data.windowStart.getTime()) / 86400000,
              );
              const duration =
                Math.round(
                  (parseISODate(project.endDate).getTime() - parseISODate(project.startDate).getTime()) /
                    86400000,
                ) + 1;
              const left = Math.max(0, (startOffset / data.totalDays) * 100);
              const width = Math.min(100 - left, (duration / data.totalDays) * 100);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onOpen(project.id)}
                  className="relative flex h-14 w-full items-center border-t border-line-soft text-left transition hover:bg-secondary/30"
                >
                  <span className="absolute inset-y-0 flex w-full">
                    {data.months.map((month, index) => (
                      <span
                        key={`${month.label}-grid-${index}`}
                        className="absolute inset-y-0 border-l border-line-soft/60"
                        style={{ left: `${month.left}%` }}
                      />
                    ))}
                  </span>
                  <span
                    className={cn('absolute top-1/2 h-6 -translate-y-1/2 overflow-hidden rounded-md', barColor[project.status])}
                    style={{ left: `${left}%`, width: `${Math.max(1.5, width)}%` }}
                    title={`${project.name}: ${formatDate(project.startDate)} – ${formatDate(project.endDate)}`}
                  >
                    <span
                      className={cn('absolute inset-y-0 left-0 rounded-md opacity-90', barInner[project.status])}
                      style={{ width: `${project.progress}%` }}
                    />
                    <span className="relative z-10 block truncate px-1.5 text-[8.5px] font-semibold leading-6 text-white mix-blend-luminosity">
                      {project.progress}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar                                                                   */
/* -------------------------------------------------------------------------- */

function ProjectCalendar({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  const { state } = useAppData();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(todayISO());
  const days = useMemo(() => getMonthGrid(month.getFullYear(), month.getMonth()), [month]);
  const selectedProjects = projects.filter(
    (project) => selected >= project.startDate && selected <= project.endDate,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-xl border border-line bg-card p-3 shadow-card">
        <div className="flex items-center justify-between px-1 pb-3">
          <h2 className="text-[12.5px] font-semibold text-ink">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month)}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelected(todayISO()); }}>
              Today
            </Button>
            <Button variant="secondary" size="icon-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="pb-1 text-center text-[9px] font-semibold uppercase tracking-wide text-muted">{day}</div>
          ))}
          {days.map((day) => {
            const iso = toISO(day);
            const inMonth = day.getMonth() === month.getMonth();
            const running = projects.filter((project) => iso >= project.startDate && iso <= project.endDate);
            const starting = projects.filter((project) => project.startDate === iso);
            const ending = projects.filter((project) => project.endDate === iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={cn(
                  'min-h-[72px] rounded-lg border p-1.5 text-left transition',
                  selected === iso ? 'border-accent bg-accent-soft' : 'border-line-soft bg-card hover:border-line hover:bg-secondary/40',
                  !inMonth && 'opacity-40',
                )}
              >
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold', iso === todayISO() ? 'bg-accent text-white' : 'text-soft')}>
                  {day.getDate()}
                </span>
                {running.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {ending.slice(0, 1).map((project) => (
                      <span key={project.id} className="block truncate rounded bg-success/15 px-1 py-0.5 text-[8px] font-medium text-success">
                        {project.name} ends
                      </span>
                    ))}
                    {starting.slice(0, 1).map((project) => (
                      <span key={project.id} className="block truncate rounded bg-info/15 px-1 py-0.5 text-[8px] font-medium text-info">
                        {project.name} starts
                      </span>
                    ))}
                    {!starting.length && !ending.length && (
                      <span className="block text-[8px] text-muted">{running.length} active</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card shadow-card">
        <div className="border-b border-line-soft px-4 py-3">
          <p className="text-[12px] font-semibold text-ink">{formatDate(selected)}</p>
          <p className="mt-0.5 text-[10px] text-muted">{selectedProjects.length} active projects</p>
        </div>
        <div className="space-y-2 p-2">
          {selectedProjects.length === 0 && (
            <p className="px-3 py-10 text-center text-[11px] text-muted">No projects active on this day.</p>
          )}
          {selectedProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpen(project.id)}
              className="w-full rounded-lg border border-line bg-card p-2.5 text-left transition hover:border-accent/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-medium text-ink">{project.name}</p>
                <StatusBadge status={project.status} dot={false} />
              </div>
              <p className="mt-1 text-[9.5px] text-muted">
                {getClient(state, project.clientId)?.businessName} · {formatMoney(project.value)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={project.progress} />
                <span className="text-[9px] font-semibold text-soft">{project.progress}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Project form                                                               */
/* -------------------------------------------------------------------------- */

export function ProjectFormModal({
  initialProject,
  onClose,
  onSave,
}: {
  initialProject: Project | null;
  onClose: () => void;
  onSave: (project: Project, isNew: boolean) => void;
}) {
  const { state } = useAppData();
  const [name, setName] = useState(initialProject?.name ?? '');
  const [clientId, setClientId] = useState(initialProject?.clientId ?? '');
  const [description, setDescription] = useState(initialProject?.description ?? '');
  const [value, setValue] = useState(String(initialProject?.value ?? ''));
  const [startDate, setStartDate] = useState(initialProject?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState(initialProject?.endDate ?? addDays(todayISO(), 45));
  const [progress, setProgress] = useState(initialProject?.progress ?? 0);
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status ?? 'Planning');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Project name is required.';
    if (!clientId) nextErrors.clientId = 'Choose a client for this project.';
    if (!value || Number(value) <= 0) nextErrors.value = 'Enter a project value greater than zero.';
    if (!startDate) nextErrors.startDate = 'Add a start date.';
    if (!endDate) nextErrors.endDate = 'Add an end date.';
    if (startDate && endDate && endDate < startDate) nextErrors.endDate = 'End date must be after the start date.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    window.setTimeout(() => {
      const code = initialProject?.code ?? `PRJ-${String(nextSequence(state.projects.map((project) => project.code), 'PRJ')).padStart(3, '0')}`;
      const project: Project = {
        id: initialProject?.id ?? uid('project'),
        code,
        name: name.trim(),
        clientId,
        description: description.trim(),
        value: Number(value),
        startDate,
        endDate,
        progress: Math.max(0, Math.min(100, Number(progress))),
        status,
        createdAt: initialProject?.createdAt ?? todayISO(),
      };
      onSave(project, !initialProject);
      setSaving(false);
    }, 320);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initialProject ? 'Edit project' : 'Create project'}
      description={initialProject ? `${initialProject.code} · Update the project details.` : 'Set up a new project and track it from start to finish.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={submit}>
            {initialProject ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Project name" required error={errors.name} className="sm:col-span-2">
            <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Website Redesign" />
          </Field>
          <Field label="Client" required error={errors.clientId}>
            <Select value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Select a client</option>
              {state.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.businessName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Project value" required error={errors.value} hint="Total agreed project value.">
            <Input type="number" min="0" step="1000" value={value} onChange={(event) => setValue(event.target.value)} placeholder="180000" />
          </Field>
          <Field label="Start date" required error={errors.startDate}>
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </Field>
          <Field label="End date" required error={errors.endDate}>
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </Select>
          </Field>
          <Field label={`Progress — ${progress}%`}>
            <div className="flex h-9 items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
                className="h-1.5 flex-1 cursor-pointer accent-accent"
              />
              <span className="w-10 text-right text-[11px] font-semibold text-ink">{progress}%</span>
            </div>
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this project about?" />
        </Field>
      </form>
    </Modal>
  );
}
