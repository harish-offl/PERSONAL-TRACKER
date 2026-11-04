import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  Files,
  FolderKanban,
  ListChecks,
  Mail,
  Pencil,
  Plus,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { Project } from '../types';
import {
  cn,
  deadlineLabel,
  formatDate,
  formatDateShort,
  formatDuration,
  formatMoney,
  invoicePaid,
  invoiceStatus,
  invoiceTotal,
  isOverdue,
  workDuration,
} from '../lib/utils';
import { getClient, invoiceBalance, totalReceived } from '../lib/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { ActivityFeed, SectionCard, StatCard } from '../components/shared/cards';
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  PriorityBadge,
  Progress,
  StatusBadge,
  Tabs,
  TableRow,
  Td,
  Th,
  useToast,
} from '../components/ui';
import { ProjectFormModal } from './Projects';

type ProjectTab = 'overview' | 'tasks' | 'work' | 'invoices' | 'payments' | 'documents' | 'activity';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, updateProject, deleteProject, updateTask } = useAppData();
  const { toast } = useToast();
  const [tab, setTab] = useState<ProjectTab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const project = state.projects.find((item) => item.id === id);

  const data = useMemo(() => {
    if (!project) return null;
    const invoices = state.invoices.filter((invoice) => invoice.projectId === project.id);
    const invoiceIds = new Set(invoices.map((invoice) => invoice.id));
    const payments = state.payments.filter(
      (payment) => invoiceIds.has(payment.invoiceId) || payment.clientId === project.clientId,
    );
    return {
      tasks: state.tasks.filter((task) => task.projectId === project.id),
      work: state.workEntries.filter((entry) => entry.projectId === project.id),
      invoices,
      payments,
      documents: state.documents.filter((doc) => doc.projectId === project.id),
    };
  }, [project, state]);

  if (!project || !data) {
    return (
      <div className="space-y-4">
        <Link to="/work//projects" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-soft hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>
        <EmptyState
          icon={FolderKanban}
          title="Project not found"
          description="This project may have been removed, or the link is out of date."
          action={<Button variant="primary" size="sm" onClick={() => navigate('/work/projects')}>View all projects</Button>}
        />
      </div>
    );
  }

  const client = getClient(state, project.clientId);
  const completedTasks = data.tasks.filter((task) => task.status === 'completed').length;
  const received = totalReceived(data.payments);
  const outstanding = data.invoices
    .filter((invoice) => !invoice.draft)
    .reduce((total, invoice) => total + invoiceBalance(invoice, state.payments), 0);
  const workMinutes = data.work.reduce(
    (total, entry) => total + workDuration(entry.startTime, entry.endTime),
    0,
  );

  const tabs = [
    { value: 'overview' as const, label: 'Overview' },
    { value: 'tasks' as const, label: 'Tasks', count: data.tasks.length },
    { value: 'work' as const, label: 'Daily Work', count: data.work.length },
    { value: 'invoices' as const, label: 'Invoices', count: data.invoices.length },
    { value: 'payments' as const, label: 'Payments', count: data.payments.length },
    { value: 'documents' as const, label: 'Documents', count: data.documents.length },
    { value: 'activity' as const, label: 'Activity History' },
  ];

  const projectActivity = state.activities.filter((activity) => {
    const text = `${activity.message} ${activity.detail}`.toLowerCase();
    return text.includes(project.name.toLowerCase()) || text.includes(project.code.toLowerCase());
  });

  const handleUpdate = (updated: Project) => {
    updateProject(updated);
    setEditOpen(false);
    toast({ title: 'Project updated', description: updated.name });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={project.name}
        description={`${project.code} Â· ${client?.businessName ?? 'Personal project'} Â· ${formatDate(project.startDate)} â€“ ${formatDate(project.endDate)}`}
        badge={<StatusBadge status={project.status} />}
        actions={
          <>
            <Button variant="secondary" size="md" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate('/work/tasks?create=1')}>
              <Plus className="h-3.5 w-3.5" />
              New Task
            </Button>
            <ActionMenu
              label="Project options"
              size="icon"
              items={[
                { label: 'Create invoice', onClick: () => navigate(`/work//invoices?create=1&client=${project.clientId}&project=${project.id}`) },
                { label: 'Upload document', onClick: () => navigate('/work/documents?upload=1') },
                { label: 'Delete project', icon: Trash2, onClick: () => setDeleteOpen(true), danger: true, separator: true },
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Project Value" value={formatMoney(project.value)} hint="Agreed project total" tone="accent" />
        <StatCard icon={Wallet} label="Received" value={formatMoney(received)} hint="Payments linked to this project" />
        <StatCard icon={FileText} label="Outstanding" value={formatMoney(outstanding)} hint="Remaining invoice balance" />
        <StatCard icon={ListChecks} label="Tasks Completed" value={`${completedTasks}/${data.tasks.length}`} hint={`${formatDuration(workMinutes)} of work logged`} />
      </div>

      <div className="rounded-xl border border-line bg-card p-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {client && <Avatar name={client.businessName} size="lg" />}
            <div>
              <p className="text-[12px] font-semibold text-ink">{client?.businessName ?? 'Personal project'}</p>
              <p className="mt-0.5 text-[10.5px] text-muted">
                {client?.name ?? 'No client'} {client?.phone ? `Â· ${client.phone}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-3 sm:max-w-md">
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between text-[10px]">
                <span className="text-muted">Overall progress</span>
                <span className="font-semibold text-ink">{project.progress}%</span>
              </div>
              <Progress value={project.progress} tone={project.status === 'Completed' ? 'success' : 'accent'} />
            </div>
            <Badge tone={isOverdue(project.endDate) && project.status !== 'Completed' ? 'red' : 'gray'}>
              {project.status === 'Completed' ? 'Delivered' : deadlineLabel(project.endDate)}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} options={tabs} className="w-full" />

      {tab === 'overview' && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <SectionCard title="About this project" description="Scope and working notes" icon={FolderKanban} bodyClassName="p-4">
              <p className="text-[12px] leading-relaxed text-soft">
                {project.description || 'No project description has been added yet.'}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoBox label="Start date" value={formatDate(project.startDate)} />
                <InfoBox label="End date" value={formatDate(project.endDate)} warning={isOverdue(project.endDate) && project.status !== 'Completed'} />
                <InfoBox label="Status" value={project.status} />
                <InfoBox label="Project code" value={project.code} />
              </div>
            </SectionCard>

            <SectionCard title="Recent tasks" description="The next pieces of work" icon={ListChecks} action={<button type="button" onClick={() => setTab('tasks')} className="text-[10.5px] font-medium text-accent-strong hover:underline">View all</button>} bodyClassName="p-2">
              {data.tasks.length ? (
                <div className="divide-y divide-line-soft">
                  {data.tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-2.5 px-2 py-2.5">
                      <button
                        type="button"
                        onClick={() => updateTask({ ...task, status: task.status === 'completed' ? 'todo' : 'completed' })}
                        className={cn(
                          'flex h-[17px] w-[17px] items-center justify-center rounded-full border text-transparent transition',
                          task.status === 'completed' ? 'border-success bg-success text-white' : 'border-line hover:border-success hover:text-success',
                        )}
                        aria-label="Toggle complete"
                      >
                        <CheckMark />
                      </button>
                      <button type="button" onClick={() => navigate(`/work//tasks?task=${task.id}`)} className="min-w-0 flex-1 text-left">
                        <p className={cn('truncate text-[11px] font-medium text-ink', task.status === 'completed' && 'line-through text-muted')}>{task.title}</p>
                        <p className="mt-0.5 text-[9.5px] text-muted">{task.id} Â· Due {formatDateShort(task.dueDate)}</p>
                      </button>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-6 text-center text-[10.5px] text-muted">No tasks linked to this project yet.</p>
              )}
            </SectionCard>

            <SectionCard title="Recent daily work" description="Time logged against this project" icon={Clock3} action={<button type="button" onClick={() => setTab('work')} className="text-[10.5px] font-medium text-accent-strong hover:underline">View all</button>} bodyClassName="p-2">
              {data.work.length ? (
                <div className="divide-y divide-line-soft">
                  {data.work.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2.5 px-2 py-2.5">
                      <div className="flex h-8 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-secondary/60">
                        <span className="text-[8px] uppercase tracking-wide text-muted">{formatDateShort(entry.date).split(' ')[0]}</span>
                        <span className="text-[11px] font-semibold leading-none text-ink">{formatDateShort(entry.date).split(' ')[1].replace(',', '')}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-ink">{entry.title}</p>
                        <p className="mt-0.5 text-[9.5px] text-muted">{entry.startTime} â€“ {entry.endTime} Â· {formatDuration(workDuration(entry.startTime, entry.endTime))}</p>
                      </div>
                      <Badge tone="gray">{entry.category}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-6 text-center text-[10.5px] text-muted">No daily work logged for this project yet.</p>
              )}
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="Financial overview" description="Billing and collection" icon={Wallet} bodyClassName="p-4">
              <div className="space-y-3">
                <MoneyRow label="Project value" value={formatMoney(project.value)} />
                <MoneyRow label="Received" value={formatMoney(received)} tone="success" />
                <MoneyRow label="Outstanding" value={formatMoney(outstanding)} tone={outstanding > 0 ? 'accent' : 'success'} />
                <div className="border-t border-line-soft pt-3">
                  <div className="mb-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-muted">Collected</span>
                    <span className="font-semibold text-ink">{project.value ? Math.round((received / Math.max(project.value, 1)) * 100) : 0}%</span>
                  </div>
                  <Progress value={project.value ? (received / project.value) * 100 : 0} tone="success" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Client" description="Your contact for this project" icon={Users} bodyClassName="p-4">
              {client ? (
                <div>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={client.businessName} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-ink">{client.businessName}</p>
                      <p className="truncate text-[10.5px] text-muted">{client.name}</p>
                      <StatusBadge status={client.status} />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 border-t border-line-soft pt-3 text-[10.5px] text-soft">
                    <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted" />{client.email}</p>
                    <p className="flex items-center gap-2"><Users className="h-3 w-3 text-muted" />{client.phone}</p>
                    <p className="flex items-center gap-2"><CalendarDays className="h-3 w-3 text-muted" />Client since {formatDate(client.createdAt)}</p>
                  </div>
                  <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => navigate(`/work//clients/${client.id}`)}>
                    Open client profile
                  </Button>
                </div>
              ) : (
                <p className="text-[11px] text-muted">No client linked.</p>
              )}
            </SectionCard>

            <SectionCard title="Recent activity" description="Latest changes on this project" icon={Clock3} bodyClassName="p-4">
              <ActivityFeed activities={projectActivity.slice(0, 5)} compact />
              {projectActivity.length === 0 && (
                <p className="py-5 text-center text-[10.5px] text-muted">No activity recorded yet.</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="rounded-xl border border-line bg-card shadow-card">
          {data.tasks.length ? (
            <div className="divide-y divide-line-soft">
              {data.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => updateTask({ ...task, status: task.status === 'completed' ? 'todo' : 'completed' })}
                    className={cn(
                      'flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border text-transparent transition',
                      task.status === 'completed' ? 'border-success bg-success text-white' : 'border-line hover:border-success hover:text-success',
                    )}
                    aria-label="Toggle complete"
                  >
                    <CheckMark />
                  </button>
                  <button type="button" onClick={() => navigate(`/work//tasks?task=${task.id}`)} className="min-w-0 flex-1 text-left">
                    <p className={cn('truncate text-[11.5px] font-medium text-ink', task.status === 'completed' && 'line-through text-muted')}>{task.title}</p>
                    <p className="mt-0.5 text-[9.5px] text-muted">{task.id} Â· Due {formatDate(task.dueDate)}</p>
                  </button>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status === 'inprogress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status === 'pending' ? 'Pending' : 'Completed'} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ListChecks} title="No tasks yet" description="Create a task to start breaking down this project." className="m-4 border-0" action={<Button variant="secondary" size="sm" onClick={() => navigate('/work/tasks?create=1')}>Create task</Button>} />
          )}
        </div>
      )}

      {tab === 'work' && (
        <div className="rounded-xl border border-line bg-card shadow-card">
          {data.work.length ? (
            <div className="divide-y divide-line-soft">
              {data.work.sort((a, b) => b.date.localeCompare(a.date)).map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-secondary/60">
                    <span className="text-[8px] uppercase tracking-wide text-muted">{formatDateShort(entry.date).split(' ')[0]}</span>
                    <span className="text-[11px] font-semibold leading-none text-ink">{formatDateShort(entry.date).split(' ')[1].replace(',', '')}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-medium text-ink">{entry.title}</p>
                    <p className="mt-0.5 text-[9.5px] text-muted">{entry.startTime} â€“ {entry.endTime} Â· {entry.category} Â· {formatDuration(workDuration(entry.startTime, entry.endTime))}</p>
                  </div>
                  <Badge tone="gray">{entry.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Clock3} title="No work logged" description="Daily work entries linked to this project will appear here." className="m-4 border-0" />
          )}
        </div>
      )}

      {tab === 'invoices' && (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
          {data.invoices.length ? (
            <DataTable minWidth={900}>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Issue date</Th>
                  <Th>Due date</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Paid</Th>
                  <Th align="right">Remaining</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <TableRow key={invoice.id} onClick={() => navigate(`/work//invoices?invoice=${invoice.id}`)}>
                    <Td><span className="font-medium text-ink">{invoice.id}</span></Td>
                    <Td>{formatDate(invoice.issueDate)}</Td>
                    <Td>{formatDate(invoice.dueDate)}</Td>
                    <Td align="right"><span className="font-medium text-ink">{formatMoney(invoiceTotal(invoice))}</span></Td>
                    <Td align="right">{formatMoney(invoicePaid(invoice.id, state.payments))}</Td>
                    <Td align="right"><span className={cn(invoiceBalance(invoice, state.payments) > 0 ? 'text-accent-strong' : 'text-success')}>{formatMoney(invoiceBalance(invoice, state.payments))}</span></Td>
                    <Td><StatusBadge status={invoiceStatus(invoice, state.payments)} /></Td>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <EmptyState icon={FileText} title="No invoices yet" description="Create an invoice to bill this project." className="m-4 border-0" action={<Button variant="secondary" size="sm" onClick={() => navigate(`/work//invoices?create=1&client=${project.clientId}&project=${project.id}`)}>Create invoice</Button>} />
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
          {data.payments.length ? (
            <DataTable minWidth={760}>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Date</Th>
                  <Th>Mode</Th>
                  <Th>Reference</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <Td><span className="font-medium text-ink">{payment.invoiceId}</span></Td>
                    <Td>{formatDate(payment.date)}</Td>
                    <Td>{payment.mode}</Td>
                    <Td><span className="font-mono text-[10.5px]">{payment.reference}</span></Td>
                    <Td align="right"><span className={cn('font-medium', payment.type === 'Refund' ? 'text-danger' : 'text-ink')}>{payment.type === 'Refund' ? 'âˆ’' : ''}{formatMoney(payment.amount)}</span></Td>
                    <Td><StatusBadge status={payment.type === 'Refund' ? 'Refunded' : 'Recorded'} /></Td>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <EmptyState icon={Wallet} title="No payments yet" description="Payments recorded against this project will appear here." className="m-4 border-0" />
          )}
        </div>
      )}

      {tab === 'documents' && (
        data.documents.length ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {data.documents.map((doc) => (
              <button key={doc.id} type="button" onClick={() => navigate(`/work//documents?doc=${doc.id}`)} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 text-left shadow-card transition hover:border-accent/30">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-secondary text-soft"><Files className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-medium text-ink">{doc.name}</span>
                  <span className="mt-0.5 block text-[9.5px] text-muted">{doc.category} Â· {formatDateShort(doc.uploadDate)}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Files} title="No documents yet" description="Upload project briefs, brand assets and contracts." action={<Button variant="secondary" size="sm" onClick={() => navigate('/work/documents?upload=1')}>Upload files</Button>} />
        )
      )}

      {tab === 'activity' && (
        <SectionCard title="Activity history" description="Every recorded update for this project" icon={Clock3} bodyClassName="p-4">
          <ActivityFeed activities={projectActivity} />
          {projectActivity.length === 0 && (
            <EmptyState icon={Clock3} title="No activity yet" description="Updates to this project and its records will appear here." className="border-0 bg-transparent" />
          )}
        </SectionCard>
      )}

      {editOpen && (
        <ProjectFormModal
          initialProject={project}
          onClose={() => setEditOpen(false)}
          onSave={(updated) => handleUpdate(updated)}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteProject(project.id);
          toast({ title: 'Project removed', description: project.name });
          navigate('/work/projects');
        }}
        title="Delete this project?"
        description={`â€œ${project.name}â€ will be removed along with its linked tasks and daily work entries. Invoices will remain without a project.`}
      />
    </div>
  );
}

function InfoBox({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-secondary/40 p-2.5">
      <p className="text-[9px] uppercase tracking-wide text-muted">{label}</p>
      <p className={cn('mt-1 text-[11.5px] font-medium', warning ? 'text-danger' : 'text-ink')}>{value}</p>
    </div>
  );
}

function MoneyRow({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'accent' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-soft">{label}</span>
      <span className={cn('text-[12px] font-semibold', tone === 'success' ? 'text-success' : tone === 'accent' ? 'text-accent-strong' : 'text-ink')}>
        {value}
      </span>
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6.2 4.6 8.8 10 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

