import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  List,
  ListChecks,
  Plus,
  Trash2,
  Milestone as Timeline,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { Priority, Task, TaskStatus } from '../types';
import {
  PRIORITY_ORDER,
  TASK_STATUS_LABEL,
  addDays,
  cn,
  downloadCSV,
  formatDate,
  formatDateShort,
  getMonthGrid,
  isOverdue,
  nextSequence,
  parseISODate,
  toISO,
  todayISO,
  uid,
} from '../lib/utils';
import { getClient } from '../lib/selectors';
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
  PriorityBadge,
  SearchInput,
  Select,
  StatusBadge,
  Tabs,
  Td,
  Textarea,
  Th,
  TableRow,
  useToast,
} from '../components/ui';
import { KanbanColumn, KANBAN_COLUMNS, TaskCard } from '../components/shared/cards';
import { PageHeader } from '../components/layout/PageHeader';

type TaskView = 'kanban' | 'list' | 'timeline' | 'calendar';
type SortKey = 'due' | 'priority' | 'newest' | 'title';

interface TaskFormState {
  open: boolean;
  task: Task | null;
  status: TaskStatus;
}

export function TasksPage() {
  const { state, addTask, updateTask, deleteTask } = useAppData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<TaskView>('kanban');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [sort, setSort] = useState<SortKey>('due');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [form, setForm] = useState<TaskFormState>({ open: false, task: null, status: 'todo' });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const taskId = searchParams.get('task');
    const create = searchParams.get('create');
    const status = searchParams.get('status') as TaskStatus | null;
    if (taskId) {
      const task = state.tasks.find((item) => item.id === taskId);
      if (task) setDetailId(task.id);
    }
    if (create) {
      setForm({
        open: true,
        task: null,
        status: status && ['todo', 'inprogress', 'pending', 'completed'].includes(status) ? status : 'todo',
      });
    }
    if (taskId || create || status) {
      const next = new URLSearchParams(searchParams);
      next.delete('task');
      next.delete('create');
      next.delete('status');
      next.delete('t');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const detailTask = detailId ? state.tasks.find((task) => task.id === detailId) ?? null : null;

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = state.tasks.filter((task) => {
      const project = state.projects.find((item) => item.id === task.projectId);
      const client = getClient(state, task.clientId);
      const haystack = `${task.title} ${task.description} ${task.id} ${project?.name ?? ''} ${client?.businessName ?? ''}`.toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(task.priority);
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(task.status);
      return matchesSearch && matchesPriority && matchesStatus;
    });
    return list.sort((a, b) => {
      if (sort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sort === 'title') return a.title.localeCompare(b.title);
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [state.tasks, state.projects, state.clients, search, priorityFilter, statusFilter, sort]);

  const openCreate = (status: TaskStatus = 'todo') => {
    setForm({ open: true, task: null, status });
  };

  const openEdit = (task: Task) => {
    setDetailId(null);
    setForm({ open: true, task, status: task.status });
  };

  const completeTask = (task: Task) => {
    updateTask({ ...task, status: task.status === 'completed' ? 'todo' : 'completed' });
    toast({
      title: task.status === 'completed' ? 'Task reopened' : 'Task completed',
      description: task.title,
      variant: 'success',
    });
  };

  const handleDrop = (status: TaskStatus, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/task-id') || draggingId;
    const task = state.tasks.find((item) => item.id === id);
    if (task && task.status !== status) {
      updateTask({ ...task, status });
      toast({ title: 'Task moved', description: `${task.title} → ${TASK_STATUS_LABEL[status]}`, variant: 'success' });
    }
    setDraggingId(null);
    setDragOver(null);
  };

  const exportTasks = () => {
    downloadCSV('personal-tracker-tasks.csv', [
      ['Task ID', 'Title', 'Description', 'Priority', 'Due date', 'Status', 'Project', 'Client'],
      ...filteredTasks.map((task) => [
        task.id,
        task.title,
        task.description,
        task.priority,
        task.dueDate,
        TASK_STATUS_LABEL[task.status],
        state.projects.find((project) => project.id === task.projectId)?.name ?? '',
        getClient(state, task.clientId)?.businessName ?? '',
      ]),
    ]);
    toast({ title: 'Tasks exported', description: 'A CSV file has been downloaded.' });
  };

  const clearCompleted = () => {
    const completed = state.tasks.filter((task) => task.status === 'completed');
    completed.forEach((task) => deleteTask(task.id));
    setConfirmClear(false);
    toast({
      title: 'Completed tasks cleared',
      description: `${completed.length} task${completed.length === 1 ? '' : 's'} removed.`,
    });
  };

  const views = [
    { value: 'kanban' as const, label: 'Kanban', icon: Columns3 },
    { value: 'list' as const, label: 'List', icon: List },
    { value: 'timeline' as const, label: 'Timeline', icon: Timeline },
    { value: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tasks"
        description="Manage your daily activities and upcoming responsibilities."
        badge={<Badge tone="gray">{filteredTasks.length} shown</Badge>}
        actions={
          <Button variant="primary" size="md" onClick={() => openCreate()}>
            <Plus className="h-3.5 w-3.5" />
            Create Task
          </Button>
        }
      />

      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <Tabs value={view} onChange={setView} options={views} className="w-fit" />
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search tasks…"
            className="w-full sm:w-52"
          />
          <FilterMenu
            label="Priority"
            options={( ['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map((priority) => ({
              value: priority,
              label: priority,
              count: state.tasks.filter((task) => task.priority === priority).length,
            }))}
            selected={priorityFilter}
            onChange={setPriorityFilter}
            onClear={() => setPriorityFilter([])}
          />
          <FilterMenu
            label="Status"
            options={(['todo', 'inprogress', 'pending', 'completed'] as TaskStatus[]).map((status) => ({
              value: status,
              label: TASK_STATUS_LABEL[status],
              count: state.tasks.filter((task) => task.status === status).length,
            }))}
            selected={statusFilter}
            onChange={setStatusFilter}
            onClear={() => setStatusFilter([])}
          />
          <div className="hidden sm:block">
            <Select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="w-[136px]">
              <option value="due">Sort: Due date</option>
              <option value="priority">Sort: Priority</option>
              <option value="newest">Sort: Newest</option>
              <option value="title">Sort: Title</option>
            </Select>
          </div>
          <ActionMenu
            label="Task options"
            size="icon"
            items={[
              { label: 'Export CSV', icon: Download, onClick: exportTasks },
              { label: 'Clear completed', icon: Trash2, onClick: () => setConfirmClear(true), danger: true, separator: true },
            ]}
          />
          <Button variant="secondary" size="md" onClick={() => openCreate()} className="hidden md:inline-flex">
            <Plus className="h-3.5 w-3.5" />
            New Task
          </Button>
        </div>
      </div>

      {filteredTasks.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title="No tasks match your view"
          description="Adjust the filters or create a new task to get started."
          action={
            <Button variant="primary" size="sm" onClick={() => openCreate()}>
              <Plus className="h-3.5 w-3.5" />
              Create task
            </Button>
          }
        />
      )}

      {filteredTasks.length > 0 && view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {KANBAN_COLUMNS.map((column) => {
            const tasks = filteredTasks.filter((task) => task.status === column.key);
            return (
              <KanbanColumn
                key={column.key}
                status={column.key}
                label={column.label}
                color={column.color}
                count={tasks.length}
                onAdd={() => openCreate(column.key)}
                isOver={dragOver === column.key}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(column.key);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(event) => handleDrop(column.key, event)}
                onClearCompleted={
                  column.key === 'completed'
                    ? () => setConfirmClear(true)
                    : undefined
                }
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
                      setDragOver(null);
                    }}
                    onOpen={() => setDetailId(task.id)}
                    onEdit={() => openEdit(task)}
                    onDelete={() => setConfirmTask(task)}
                    onToggleComplete={() => completeTask(task)}
                  />
                ))}
                {tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-card/40 py-8 text-center">
                    <p className="text-[10.5px] text-muted">No tasks here</p>
                  </div>
                )}
              </KanbanColumn>
            );
          })}
        </div>
      )}

      {filteredTasks.length > 0 && view === 'list' && (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
          <DataTable minWidth={920}>
            <thead>
              <tr>
                <Th className="w-10" />
                <Th>Task</Th>
                <Th>Project</Th>
                <Th>Client</Th>
                <Th>Priority</Th>
                <Th>Due date</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const project = state.projects.find((item) => item.id === task.projectId);
                const client = getClient(state, task.clientId);
                return (
                  <TableRow key={task.id} onClick={() => setDetailId(task.id)}>
                    <Td>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          completeTask(task);
                        }}
                        className={cn(
                          'flex h-[17px] w-[17px] items-center justify-center rounded-full border transition',
                          task.status === 'completed'
                            ? 'border-success bg-success text-white'
                            : 'border-line bg-card text-transparent hover:border-success hover:text-success',
                        )}
                        aria-label={task.status === 'completed' ? 'Reopen task' : 'Complete task'}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </button>
                    </Td>
                    <Td>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'truncate text-[12px] font-medium text-ink',
                            task.status === 'completed' && 'text-muted line-through',
                          )}
                        >
                          {task.title}
                        </p>
                        <p className="mt-0.5 font-mono text-[9.5px] text-muted">{task.id}</p>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-[11px]">{project?.name ?? '—'}</span>
                    </Td>
                    <Td>
                      <span className="text-[11px]">{client?.businessName ?? '—'}</span>
                    </Td>
                    <Td>
                      <PriorityBadge priority={task.priority} />
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'whitespace-nowrap text-[11px]',
                          isOverdue(task.dueDate) && task.status !== 'completed' && 'text-danger',
                        )}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge
                        status={
                          task.status === 'inprogress'
                            ? 'In Progress'
                            : task.status === 'todo'
                              ? 'To Do'
                              : task.status === 'pending'
                                ? 'Pending'
                                : 'Completed'
                        }
                      />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <ActionMenu
                          label={`Actions for ${task.title}`}
                          items={[
                            { label: 'View details', onClick: () => setDetailId(task.id) },
                            { label: 'Edit task', onClick: () => openEdit(task) },
                            {
                              label: task.status === 'completed' ? 'Reopen task' : 'Mark complete',
                              icon: CheckCircle2,
                              onClick: () => completeTask(task),
                            },
                            { label: 'Delete task', onClick: () => setConfirmTask(task), danger: true, separator: true },
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

      {filteredTasks.length > 0 && view === 'timeline' && (
        <TaskTimeline tasks={filteredTasks} onOpen={(task) => setDetailId(task.id)} />
      )}

      {filteredTasks.length > 0 && view === 'calendar' && (
        <TaskCalendar tasks={filteredTasks} onOpen={(task) => setDetailId(task.id)} />
      )}

      {form.open && (
        <TaskFormModal
          initialTask={form.task}
          defaultStatus={form.status}
          onClose={() => setForm((current) => ({ ...current, open: false }))}
          onSaved={(task) => {
            setForm((current) => ({ ...current, open: false }));
            setDetailId(task.id);
          }}
          onCreated={(task) => {
            addTask(task);
            toast({ title: 'Task created', description: `${task.id} · ${task.title}` });
            setForm((current) => ({ ...current, open: false }));
          }}
          onUpdated={(task) => {
            updateTask(task);
            toast({ title: 'Task updated', description: task.title });
          }}
        />
      )}

      <TaskDetailDrawer
        task={detailTask}
        onClose={() => setDetailId(null)}
        onEdit={(task) => openEdit(task)}
        onDelete={(task) => {
          setDetailId(null);
          setConfirmTask(task);
        }}
        onStatusChange={(task, status) => {
          updateTask({ ...task, status });
          toast({ title: 'Task updated', description: `Moved to ${TASK_STATUS_LABEL[status]}` });
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmTask)}
        onClose={() => setConfirmTask(null)}
        onConfirm={() => {
          if (confirmTask) {
            deleteTask(confirmTask.id);
            toast({ title: 'Task deleted', description: confirmTask.title, variant: 'success' });
          }
          setConfirmTask(null);
        }}
        title="Delete this task?"
        description={
          confirmTask
            ? `“${confirmTask.title}” will be removed from your board. This action cannot be undone.`
            : ''
        }
      />

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearCompleted}
        title="Clear completed tasks?"
        description="All completed tasks will be permanently removed from your workspace. You can keep them if you may need the history."
        confirmLabel="Clear tasks"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Task form                                                                  */
/* -------------------------------------------------------------------------- */

function TaskFormModal({
  initialTask,
  defaultStatus,
  onClose,
  onCreated,
  onUpdated,
  onSaved,
}: {
  initialTask: Task | null;
  defaultStatus: TaskStatus;
  onClose: () => void;
  onCreated: (task: Task) => void;
  onUpdated: (task: Task) => void;
  onSaved: (task: Task) => void;
}) {
  const { state } = useAppData();
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [description, setDescription] = useState(initialTask?.description ?? '');
  const [priority, setPriority] = useState<Priority>(initialTask?.priority ?? 'Medium');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status ?? defaultStatus);
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? addDays(todayISO(), 7));
  const [clientId, setClientId] = useState(initialTask?.clientId ?? '');
  const [projectId, setProjectId] = useState(initialTask?.projectId ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const projects = clientId
    ? state.projects.filter((project) => project.clientId === clientId)
    : state.projects;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'A task title is required.';
    if (!dueDate) nextErrors.dueDate = 'Choose a due date.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    window.setTimeout(() => {
      const project = state.projects.find((item) => item.id === projectId);
      const resolvedClient = clientId || project?.clientId || '';
      if (initialTask) {
        const updated: Task = {
          ...initialTask,
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          dueDate,
          clientId: resolvedClient || undefined,
          projectId: projectId || undefined,
        };
        onUpdated(updated);
        onSaved(updated);
        onClose();
      } else {
        const sequence = nextSequence(state.tasks.map((task) => task.id), 'TASK');
        const task: Task = {
          id: `TASK-${String(sequence).padStart(3, '0')}`,
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          dueDate,
          clientId: resolvedClient || undefined,
          projectId: projectId || undefined,
          comments: 0,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        onCreated(task);
        onSaved(task);
      }
      setSaving(false);
    }, 320);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initialTask ? 'Edit task' : 'Create task'}
      description={initialTask ? `${initialTask.id} · Update the details below.` : 'Add a new item to your personal task board.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSubmit}>
            {initialTask ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Task title" required error={errors.title}>
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Complete homepage design"
          />
        </Field>
        <Field label="Description" hint="A short note about what needs to be done.">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Finish the responsive homepage layout and hand off the desktop frames."
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Priority">
            <Select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </Select>
          </Field>
          <Field label="Due date" required error={errors.dueDate}>
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </Field>
          <Field label="Client" hint="Optional — link this task to a client.">
            <Select
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value);
                if (!event.target.value) setProjectId('');
              }}
            >
              <option value="">No client</option>
              {state.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.businessName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project" hint="Optional — choose the related project.">
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
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Task detail drawer                                                         */
/* -------------------------------------------------------------------------- */

function TaskDetailDrawer({
  task,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  const { state } = useAppData();
  if (!task) return null;
  const client = getClient(state, task.clientId);
  const project = state.projects.find((item) => item.id === task.projectId);

  return (
    <Drawer
      open={Boolean(task)}
      onClose={onClose}
      title="Task details"
      description={`${task.id} · Created ${formatDate(task.createdAt)}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onDelete(task)} className="mr-auto text-danger hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={() => onEdit(task)}>
            Edit task
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge
              status={
                task.status === 'inprogress'
                  ? 'In Progress'
                  : task.status === 'todo'
                    ? 'To Do'
                    : task.status === 'pending'
                      ? 'Pending'
                      : 'Completed'
              }
            />
            <span className="font-mono text-[10px] text-muted">{task.id}</span>
          </div>
          <h2 className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink">
            {task.title}
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-soft">
            {task.description || 'No description added yet.'}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-secondary/40 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Move to</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {(['todo', 'inprogress', 'pending', 'completed'] as TaskStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(task, status)}
                className={cn(
                  'rounded-lg border px-2 py-1.5 text-[10.5px] font-medium transition',
                  task.status === status
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-card text-soft hover:border-accent/30 hover:text-ink',
                )}
              >
                {TASK_STATUS_LABEL[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Detail label="Due date" value={formatDate(task.dueDate)} warning={isOverdue(task.dueDate) && task.status !== 'completed'} />
          <Detail label="Created" value={formatDate(task.createdAt)} />
          <Detail label="Client" value={client?.businessName ?? 'Personal'} />
          <Detail label="Project" value={project?.name ?? 'No project'} />
          <Detail label="Comments" value={String(task.comments)} />
          <Detail label="Status" value={TASK_STATUS_LABEL[task.status]} />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Activity</p>
          <div className="mt-2 rounded-lg border border-line bg-card p-3">
            <p className="text-[11px] text-soft">
              This task is part of <span className="font-medium text-ink">{project?.name ?? 'your personal workspace'}</span>
              {client ? ` for ${client.businessName}` : ''}. Update the status or edit the details as your work progresses.
            </p>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function Detail({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-card p-2.5">
      <p className="text-[9px] uppercase tracking-wide text-muted">{label}</p>
      <p className={cn('mt-1 text-[11.5px] font-medium', warning ? 'text-danger' : 'text-ink')}>{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline view                                                              */
/* -------------------------------------------------------------------------- */

function TaskTimeline({ tasks, onOpen }: { tasks: Task[]; onOpen: (task: Task) => void }) {
  const { state } = useAppData();
  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    [...tasks]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .forEach((task) => map.set(task.dueDate, [...(map.get(task.dueDate) ?? []), task]));
    return Array.from(map.entries());
  }, [tasks]);

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-card">
      <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line">
        {groups.map(([date, items]) => (
          <div key={date} className="relative pl-6">
            <span
              className={cn(
                'absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[3px] border-card',
                isOverdue(date) ? 'bg-danger' : 'bg-accent',
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12px] font-semibold text-ink">{formatDate(date)}</p>
              <span className={cn('text-[10px] font-medium', isOverdue(date) ? 'text-danger' : 'text-muted')}>
                {formatDateShort(date)} · {items.length} task{items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {items.map((task) => {
                const client = getClient(state, task.clientId);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onOpen(task)}
                    className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2.5 text-left transition hover:border-accent/30 hover:shadow-card"
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-[11.5px] font-medium text-ink', task.status === 'completed' && 'line-through text-muted')}>
                        {task.title}
                      </p>
                      <p className="mt-0.5 truncate text-[9.5px] text-muted">
                        {task.id} · {client?.businessName ?? 'Personal'}
                      </p>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar view                                                              */
/* -------------------------------------------------------------------------- */

function TaskCalendar({ tasks, onOpen }: { tasks: Task[]; onOpen: (task: Task) => void }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(todayISO());
  const days = useMemo(() => getMonthGrid(month.getFullYear(), month.getMonth()), [month]);
  const selectedTasks = tasks.filter((task) => task.dueDate === selected);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-xl border border-line bg-card p-3 shadow-card">
        <div className="flex items-center justify-between px-1 pb-3">
          <h2 className="text-[12.5px] font-semibold text-ink">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month)}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                setSelected(todayISO());
              }}
            >
              Today
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
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
            const dayTasks = tasks.filter((task) => task.dueDate === iso);
            const inMonth = day.getMonth() === month.getMonth();
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={cn(
                  'min-h-[76px] rounded-lg border p-1.5 text-left transition',
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
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 2).map((task) => (
                    <span
                      key={task.id}
                      className={cn(
                        'line-clamp-1 block rounded px-1 py-0.5 text-[8.5px] font-medium',
                        task.priority === 'Urgent'
                          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                          : task.priority === 'High'
                            ? 'bg-accent-soft text-accent-strong'
                            : 'bg-secondary text-soft',
                      )}
                    >
                      {task.title}
                    </span>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="block px-1 text-[8px] text-muted">+{dayTasks.length - 2} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card shadow-card">
        <div className="border-b border-line-soft px-4 py-3">
          <p className="text-[12px] font-semibold text-ink">{formatDate(selected)}</p>
          <p className="mt-0.5 text-[10px] text-muted">
            {selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'} due
          </p>
        </div>
        <div className="space-y-2 p-2">
          {selectedTasks.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <CalendarDays className="h-5 w-5 text-muted" />
              <p className="mt-2 text-[11px] text-muted">No tasks due on this day.</p>
            </div>
          )}
          {selectedTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpen(task)}
              className="flex w-full items-start gap-2 rounded-lg border border-line bg-card p-2.5 text-left transition hover:border-accent/30"
            >
              <span
                className={cn(
                  'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                  task.status === 'completed'
                    ? 'bg-success'
                    : task.priority === 'Urgent'
                      ? 'bg-danger'
                      : task.priority === 'High'
                        ? 'bg-accent'
                        : 'bg-info',
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium text-ink">{task.title}</span>
                <span className="mt-0.5 block text-[9.5px] text-muted">
                  {task.id} · {TASK_STATUS_LABEL[task.status]}
                </span>
              </span>
              <PriorityBadge priority={task.priority} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
