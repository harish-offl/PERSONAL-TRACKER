import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  Files,
  FolderKanban,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { Client } from '../types';
import {
  cn,
  formatDate,
  formatDateShort,
  formatDuration,
  formatMoney,
  invoicePaid,
  invoiceStatus,
  invoiceTotal,
  workDuration,
} from '../lib/utils';
import {
  clientOutstanding,
  invoiceBalance,
  projectValueByClient,
  totalReceived,
} from '../lib/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { ProjectCard, SectionCard, StatCard, ActivityFeed } from '../components/shared/cards';
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
import { ClientFormModal } from './Clients';

type ProfileTab = 'overview' | 'projects' | 'invoices' | 'payments' | 'documents' | 'tasks' | 'work';

export function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, updateClient, deleteClient } = useAppData();
  const { toast } = useToast();
  const [tab, setTab] = useState<ProfileTab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const client = state.clients.find((item) => item.id === id);

  const data = useMemo(() => {
    if (!client) return null;
    const projects = state.projects.filter((project) => project.clientId === client.id);
    const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id);
    const invoiceIds = new Set(invoices.map((invoice) => invoice.id));
    const payments = state.payments.filter(
      (payment) => payment.clientId === client.id || invoiceIds.has(payment.invoiceId),
    );
    const documents = state.documents.filter((doc) => doc.clientId === client.id);
    const tasks = state.tasks.filter(
      (task) => task.clientId === client.id || (task.projectId && projects.some((project) => project.id === task.projectId)),
    );
    const work = state.workEntries.filter(
      (entry) => entry.clientId === client.id || (entry.projectId && projects.some((project) => project.id === entry.projectId)),
    );
    return { projects, invoices, payments, documents, tasks, work };
  }, [client, state]);

  if (!client || !data) {
    return (
      <div className="space-y-4">
        <Link to="/clients" className="inline-flex items-center gap-1.5 text-[11px] font-medium text-soft hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to clients
        </Link>
        <EmptyState
          icon={Users}
          title="Client not found"
          description="This client record may have been removed, or the link is out of date."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/clients')}>
              View all clients
            </Button>
          }
        />
      </div>
    );
  }

  const outstanding = clientOutstanding(state, client.id);
  const value = projectValueByClient(state, client.id);
  const received = totalReceived(data.payments);

  const handleSave = (updated: Client) => {
    updateClient(updated);
    setEditOpen(false);
    toast({ title: 'Client updated', description: updated.businessName });
  };

  const tabs = [
    { value: 'overview' as const, label: 'Overview' },
    { value: 'projects' as const, label: 'Projects', count: data.projects.length },
    { value: 'invoices' as const, label: 'Invoices', count: data.invoices.length },
    { value: 'payments' as const, label: 'Payments', count: data.payments.length },
    { value: 'documents' as const, label: 'Documents', count: data.documents.length },
    { value: 'tasks' as const, label: 'Tasks', count: data.tasks.length },
    { value: 'work' as const, label: 'Daily Work', count: data.work.length },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={client.businessName}
        description={`${client.name} · ${client.location || 'No location added'} · Client since ${formatDate(client.createdAt)}`}
        badge={<StatusBadge status={client.status} />}
        actions={
          <>
            <Button variant="secondary" size="md" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate(`/invoices?create=1&client=${client.id}`)}>
              <Plus className="h-3.5 w-3.5" />
              New Invoice
            </Button>
            <ActionMenu
              label="Client options"
              size="icon"
              items={[
                { label: 'Add task', onClick: () => navigate('/tasks?create=1') },
                { label: 'Upload document', onClick: () => navigate('/documents?upload=1') },
                { label: 'Delete client', icon: Trash2, onClick: () => setDeleteOpen(true), danger: true, separator: true },
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={String(data.projects.length)} hint={`${data.projects.filter((project) => project.status === 'Active').length} active right now`} />
        <StatCard icon={Wallet} label="Project Value" value={formatMoney(value)} hint="Across all projects" tone="accent" />
        <StatCard icon={FileText} label="Outstanding" value={formatMoney(outstanding)} hint="Unpaid invoice balance" />
        <StatCard icon={Users} label="Total Received" value={formatMoney(received)} hint={`${data.payments.length} payment records`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar name={client.businessName} size="xl" />
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-semibold text-ink">{client.businessName}</h2>
                <p className="truncate text-[11px] text-soft">{client.name}</p>
                <StatusBadge status={client.status} />
              </div>
            </div>
            <div className="mt-4 space-y-2.5 border-t border-line-soft pt-4">
              <InfoRow icon={Mail} label="Email" value={client.email} />
              <InfoRow icon={Phone} label="Phone" value={client.phone} />
              <InfoRow icon={MapPin} label="Location" value={client.location || 'Not added'} />
              <InfoRow icon={CalendarDays} label="Client since" value={formatDate(client.createdAt)} />
            </div>
            {client.notes && (
              <div className="mt-4 rounded-lg border border-line-soft bg-secondary/50 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">Notes</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-soft">{client.notes}</p>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3 w-3" /> Edit details
              </Button>
              <Button variant="secondary" size="icon-sm" onClick={() => setDeleteOpen(true)} aria-label="Delete client">
                <Trash2 className="h-3.5 w-3.5 text-danger" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card p-4 shadow-card">
            <p className="text-[11.5px] font-semibold text-ink">Billing health</p>
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-[10px]">
                <span className="text-muted">Collected</span>
                <span className="font-semibold text-ink">
                  {value ? Math.round((received / Math.max(value, 1)) * 100) : 0}%
                </span>
              </div>
              <Progress value={value ? (received / value) * 100 : 0} tone="success" />
              <div className="mt-2 flex items-center justify-between text-[9.5px] text-muted">
                <span>{formatMoney(received)} received</span>
                <span>{formatMoney(outstanding)} due</span>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <Tabs value={tab} onChange={setTab} options={tabs} className="w-full" />
          {tab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-2">
              <SectionCard title="Active projects" description="Work currently in motion" icon={FolderKanban} action={<Link to={`/clients/${client.id}`} onClick={(event) => { event.preventDefault(); setTab('projects'); }} className="text-[10.5px] font-medium text-accent-strong hover:underline">View all</Link>} bodyClassName="p-1.5">
                {data.projects.filter((project) => project.status !== 'Completed').slice(0, 4).map((project) => (
                  <button key={project.id} type="button" onClick={() => navigate(`/projects/${project.id}`)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-secondary/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-ink">{project.name}</p>
                      <p className="mt-0.5 text-[9px] text-muted">{project.code} · {formatMoney(project.value)}</p>
                    </div>
                    <div className="w-16">
                      <Progress value={project.progress} />
                    </div>
                    <span className="w-7 text-right text-[9px] font-semibold text-soft">{project.progress}%</span>
                  </button>
                ))}
                {data.projects.length === 0 && <p className="px-3 py-6 text-center text-[10.5px] text-muted">No projects yet.</p>}
              </SectionCard>

              <SectionCard title="Recent invoices" description="Billing history" icon={FileText} action={<button type="button" onClick={() => setTab('invoices')} className="text-[10.5px] font-medium text-accent-strong hover:underline">View all</button>} bodyClassName="p-1.5">
                {data.invoices.slice(0, 4).map((invoice) => {
                  const remaining = invoiceBalance(invoice, state.payments);
                  return (
                    <button key={invoice.id} type="button" onClick={() => navigate(`/invoices?invoice=${invoice.id}`)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-secondary/60">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-ink">{invoice.id}</p>
                        <p className="mt-0.5 text-[9px] text-muted">Due {formatDateShort(invoice.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10.5px] font-semibold text-ink">{formatMoney(invoiceTotal(invoice))}</p>
                        <p className="text-[9px] text-muted">{remaining > 0 ? `${formatMoney(remaining)} due` : 'Settled'}</p>
                      </div>
                      <StatusBadge status={invoiceStatus(invoice, state.payments)} dot={false} />
                    </button>
                  );
                })}
                {data.invoices.length === 0 && <p className="px-3 py-6 text-center text-[10.5px] text-muted">No invoices yet.</p>}
              </SectionCard>

              <SectionCard title="Open tasks" description="Work to keep moving" icon={ListChecks} action={<button type="button" onClick={() => setTab('tasks')} className="text-[10.5px] font-medium text-accent-strong hover:underline">View all</button>} bodyClassName="p-1.5">
                {data.tasks.filter((task) => task.status !== 'completed').slice(0, 4).map((task) => (
                  <button key={task.id} type="button" onClick={() => navigate(`/tasks?task=${task.id}`)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-secondary/60">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-ink">{task.title}</span>
                      <span className="mt-0.5 block text-[9px] text-muted">{task.id} · Due {formatDateShort(task.dueDate)}</span>
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </button>
                ))}
                {data.tasks.length === 0 && <p className="px-3 py-6 text-center text-[10.5px] text-muted">No tasks yet.</p>}
              </SectionCard>

              <SectionCard title="Recent activity" description="Latest from this relationship" icon={Clock3} bodyClassName="p-4">
                <ActivityFeed activities={state.activities.filter((activity) => activity.detail.toLowerCase().includes(client.businessName.toLowerCase()) || activity.detail.toLowerCase().includes(client.name.toLowerCase())).slice(0, 5)} compact />
                {state.activities.filter((activity) => activity.detail.toLowerCase().includes(client.businessName.toLowerCase())).length === 0 && (
                  <p className="py-6 text-center text-[10.5px] text-muted">No recent activity linked to this client.</p>
                )}
              </SectionCard>
            </div>
          )}

          {tab === 'projects' && (
            data.projects.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} onOpen={() => navigate(`/projects/${project.id}`)} />
                ))}
              </div>
            ) : (
              <EmptyState icon={FolderKanban} title="No projects yet" description="Create a project to start tracking work for this client." action={<Button variant="primary" size="sm" onClick={() => navigate('/projects?create=1')}><Plus className="h-3.5 w-3.5" />Create project</Button>} />
            )
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
                      <Th align="right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((invoice) => (
                      <TableRow key={invoice.id} onClick={() => navigate(`/invoices?invoice=${invoice.id}`)}>
                        <Td><span className="font-medium text-ink">{invoice.id}</span></Td>
                        <Td>{formatDate(invoice.issueDate)}</Td>
                        <Td>{formatDate(invoice.dueDate)}</Td>
                        <Td align="right"><span className="font-medium text-ink">{formatMoney(invoiceTotal(invoice))}</span></Td>
                        <Td align="right">{formatMoney(invoicePaid(invoice.id, state.payments))}</Td>
                        <Td align="right"><span className={cn(invoiceBalance(invoice, state.payments) > 0 ? 'text-accent-strong' : 'text-success')}>{formatMoney(invoiceBalance(invoice, state.payments))}</span></Td>
                        <Td><StatusBadge status={invoiceStatus(invoice, state.payments)} /></Td>
                        <Td align="right"><ActionMenu label="Invoice actions" items={[{ label: 'View invoice', onClick: () => navigate(`/invoices?invoice=${invoice.id}`) }]} /></Td>
                      </TableRow>
                    ))}
                  </tbody>
                </DataTable>
              ) : (
                <EmptyState icon={FileText} title="No invoices yet" description="Create an invoice for this client to start tracking payments." className="m-4 border-0" action={<Button variant="secondary" size="sm" onClick={() => navigate(`/invoices?create=1&client=${client.id}`)}>Create invoice</Button>} />
              )}
            </div>
          )}

          {tab === 'payments' && (
            <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
              {data.payments.length ? (
                <DataTable minWidth={860}>
                  <thead>
                    <tr>
                      <Th>Invoice</Th>
                      <Th>Date</Th>
                      <Th>Mode</Th>
                      <Th>Reference</Th>
                      <Th>Type</Th>
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
                        <Td><Badge tone={payment.type === 'Refund' ? 'purple' : 'green'}>{payment.type}</Badge></Td>
                        <Td align="right"><span className={cn('font-medium', payment.type === 'Refund' ? 'text-danger' : 'text-ink')}>{payment.type === 'Refund' ? '−' : ''}{formatMoney(payment.amount)}</span></Td>
                        <Td><StatusBadge status={payment.type === 'Refund' ? 'Refunded' : 'Paid'} /></Td>
                      </TableRow>
                    ))}
                  </tbody>
                </DataTable>
              ) : (
                <EmptyState icon={Wallet} title="No payments yet" description="Payments recorded against this client's invoices will appear here." className="m-4 border-0" />
              )}
            </div>
          )}

          {tab === 'documents' && (
            data.documents.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {data.documents.map((doc) => (
                  <button key={doc.id} type="button" onClick={() => navigate(`/documents?doc=${doc.id}`)} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 text-left shadow-card transition hover:border-accent/30">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-secondary text-soft"><Files className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-medium text-ink">{doc.name}</span>
                      <span className="mt-0.5 block text-[9.5px] text-muted">{doc.category} · {doc.ext.toUpperCase()} · {formatDateShort(doc.uploadDate)}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={Files} title="No documents yet" description="Upload contracts, proposals and brand assets for this client." action={<Button variant="secondary" size="sm" onClick={() => navigate('/documents?upload=1')}>Upload files</Button>} />
            )
          )}

          {tab === 'tasks' && (
            <div className="rounded-xl border border-line bg-card shadow-card">
              {data.tasks.length ? (
                <div className="divide-y divide-line-soft">
                  {data.tasks.map((task) => (
                    <button key={task.id} type="button" onClick={() => navigate(`/tasks?task=${task.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-secondary/50">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', task.status === 'completed' ? 'bg-success' : task.status === 'inprogress' ? 'bg-info' : task.status === 'pending' ? 'bg-warning' : 'bg-muted')} />
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-[11.5px] font-medium text-ink', task.status === 'completed' && 'line-through text-muted')}>{task.title}</p>
                        <p className="mt-0.5 text-[9.5px] text-muted">{task.id} · Due {formatDate(task.dueDate)}</p>
                      </div>
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status === 'inprogress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status === 'pending' ? 'Pending' : 'Completed'} />
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState icon={ListChecks} title="No tasks yet" description="Create a task linked to this client." className="m-4 border-0" action={<Button variant="secondary" size="sm" onClick={() => navigate('/tasks?create=1')}>Create task</Button>} />
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
                        <p className="mt-0.5 text-[9.5px] text-muted">{entry.startTime} – {entry.endTime} · {entry.category} · {formatDuration(workDuration(entry.startTime, entry.endTime))}</p>
                      </div>
                      <StatusBadge status={entry.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Clock3} title="No work logged" description="Daily work entries linked to this client will appear here." className="m-4 border-0" />
              )}
            </div>
          )}
        </div>
      </div>

      {editOpen && (
        <ClientFormModal
          initialClient={client}
          onClose={() => setEditOpen(false)}
          onSave={(updated) => handleSave(updated)}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteClient(client.id);
          toast({ title: 'Client removed', description: client.businessName });
          navigate('/clients');
        }}
        title="Delete this client?"
        description={`“${client.businessName}” and all related records will be permanently removed. This cannot be undone.`}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-secondary/60 text-muted">
        <Icon className="h-3 w-3" />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate text-[10.5px] font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
