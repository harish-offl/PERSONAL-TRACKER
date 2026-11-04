import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Grid3x3,
  List,
  Plus,
  Users,
  UserRoundCheck,
  UserRoundPlus,
  UserRoundSearch,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { Client, ClientStatus } from '../types';
import {
  cn,
  formatDate,
  formatMoney,
  uid,
} from '../lib/utils';
import { clientOutstanding, projectValueByClient } from '../lib/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { ClientCard, StatCard } from '../components/shared/cards';
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  FilterMenu,
  Input,
  Modal,
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

type ClientView = 'table' | 'cards';
type ClientSort = 'name' | 'newest' | 'value';

export function ClientsPage() {
  const { state, addClient, updateClient, deleteClient } = useAppData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ClientView>('cards');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus[]>([]);
  const [sort, setSort] = useState<ClientSort>('name');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

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
    return state.clients
      .filter((client) => {
        const haystack = `${client.name} ${client.businessName} ${client.email} ${client.phone} ${client.location}`.toLowerCase();
        return (
          (!q || haystack.includes(q)) &&
          (statusFilter.length === 0 || statusFilter.includes(client.status))
        );
      })
      .sort((a, b) => {
        if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
        if (sort === 'value') return projectValueByClient(state, b.id) - projectValueByClient(state, a.id);
        return a.businessName.localeCompare(b.businessName);
      });
  }, [state, search, statusFilter, sort]);

  const counts = {
    active: state.clients.filter((client) => client.status === 'Active').length,
    completed: state.clients.filter((client) => client.status === 'Completed').length,
    potential: state.clients.filter((client) => client.status === 'Potential').length,
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSave = (client: Client, isNew: boolean) => {
    if (isNew) {
      addClient(client);
      toast({ title: 'Client added', description: `${client.businessName} is now in your workspace.` });
    } else {
      updateClient(client);
      toast({ title: 'Client updated', description: client.businessName });
    }
    setFormOpen(false);
    setEditing(null);
  };

  const views = [
    { value: 'cards' as const, label: 'Cards', icon: Grid3x3 },
    { value: 'table' as const, label: 'Table', icon: List },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clients"
        description="Manage your personal client records and relationships."
        badge={<Badge tone="gray">{state.clients.length} total</Badge>}
        actions={
          <Button variant="primary" size="md" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Add Client
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Clients" value={String(state.clients.length)} hint="Your personal client list" />
        <StatCard icon={UserRoundCheck} label="Active Clients" value={String(counts.active)} hint="Currently working together" tone="accent" />
        <StatCard icon={Building2} label="Completed Clients" value={String(counts.completed)} hint="Projects delivered" />
        <StatCard icon={UserRoundSearch} label="Potential Clients" value={String(counts.potential)} hint="In conversation" />
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={view} onChange={setView} options={views} className="w-fit" />
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search clients…"
            className="w-full sm:w-56"
          />
          <FilterMenu
            label="Status"
            options={(['Active', 'Completed', 'Potential'] as ClientStatus[]).map((status) => ({
              value: status,
              label: status,
              count: state.clients.filter((client) => client.status === status).length,
            }))}
            selected={statusFilter}
            onChange={setStatusFilter}
            onClear={() => setStatusFilter([])}
          />
          <div className="hidden sm:block">
            <Select value={sort} onChange={(event) => setSort(event.target.value as ClientSort)} className="w-[142px]">
              <option value="name">Sort: Name</option>
              <option value="newest">Sort: Newest</option>
              <option value="value">Sort: Value</option>
            </Select>
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={UserRoundPlus}
          title="No clients found"
          description="Adjust your filters or add your first client to start tracking projects, invoices and payments."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Add client
            </Button>
          }
        />
      )}

      {filtered.length > 0 && view === 'cards' && (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onOpen={() => navigate(`/work//clients/${client.id}`)}
              onDelete={() => setDeleting(client)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && view === 'table' && (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
          <DataTable minWidth={1120}>
            <thead>
              <tr>
                <Th>Client Name</Th>
                <Th>Business Name</Th>
                <Th>Phone</Th>
                <Th align="right">Total Projects</Th>
                <Th align="right">Project Value</Th>
                <Th align="right">Outstanding</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const projects = state.projects.filter((project) => project.clientId === client.id);
                const outstanding = clientOutstanding(state, client.id);
                return (
                  <TableRow key={client.id} onClick={() => navigate(`/work//clients/${client.id}`)}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={client.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-ink">{client.name}</p>
                          <p className="truncate text-[9.5px] text-muted">{client.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-[11.5px] font-medium text-ink">{client.businessName}</span>
                      <p className="text-[9.5px] text-muted">{client.location}</p>
                    </Td>
                    <Td>
                      <span className="whitespace-nowrap text-[11px]">{client.phone}</span>
                    </Td>
                    <Td align="right">
                      <span className="text-[11.5px] font-medium text-ink">{projects.length}</span>
                    </Td>
                    <Td align="right">
                      <span className="whitespace-nowrap text-[11.5px] font-medium text-ink">
                        {formatMoney(projectValueByClient(state, client.id))}
                      </span>
                    </Td>
                    <Td align="right">
                      <span
                        className={cn(
                          'whitespace-nowrap text-[11.5px] font-medium',
                          outstanding > 0 ? 'text-accent-strong' : 'text-success',
                        )}
                      >
                        {outstanding > 0 ? formatMoney(outstanding) : 'Clear'}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={client.status} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <ActionMenu
                          label={`Actions for ${client.businessName}`}
                          items={[
                            { label: 'Open profile', onClick: () => navigate(`/work//clients/${client.id}`) },
                            {
                              label: 'Edit client',
                              onClick: () => {
                                setEditing(client);
                                setFormOpen(true);
                              },
                            },
                            {
                              label: 'Create invoice',
                              onClick: () => navigate(`/work//invoices?create=1&client=${client.id}`),
                            },
                            { label: 'Delete client', onClick: () => setDeleting(client), danger: true, separator: true },
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

      {formOpen && (
        <ClientFormModal
          initialClient={editing}
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
            deleteClient(deleting.id);
            toast({ title: 'Client removed', description: deleting.businessName });
          }
          setDeleting(null);
        }}
        title="Delete this client?"
        description={
          deleting
            ? `“${deleting.businessName}” will be removed along with their projects, tasks, invoices, payments and documents. This cannot be undone.`
            : ''
        }
      />
    </div>
  );
}

export function ClientFormModal({
  initialClient,
  onClose,
  onSave,
}: {
  initialClient: Client | null;
  onClose: () => void;
  onSave: (client: Client, isNew: boolean) => void;
}) {
  const [name, setName] = useState(initialClient?.name ?? '');
  const [businessName, setBusinessName] = useState(initialClient?.businessName ?? '');
  const [email, setEmail] = useState(initialClient?.email ?? '');
  const [phone, setPhone] = useState(initialClient?.phone ?? '');
  const [status, setStatus] = useState<ClientStatus>(initialClient?.status ?? 'Active');
  const [location, setLocation] = useState(initialClient?.location ?? '');
  const [notes, setNotes] = useState(initialClient?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Client name is required.';
    if (!businessName.trim()) nextErrors.businessName = 'Business name is required.';
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!phone.trim()) nextErrors.phone = 'Phone number is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    window.setTimeout(() => {
      const client: Client = {
        id: initialClient?.id ?? uid('client'),
        name: name.trim(),
        businessName: businessName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status,
        location: location.trim(),
        notes: notes.trim(),
        createdAt: initialClient?.createdAt ?? new Date().toISOString().slice(0, 10),
      };
      onSave(client, !initialClient);
      setSaving(false);
    }, 300);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initialClient ? 'Edit client' : 'Add client'}
      description={initialClient ? 'Update the client record and contact details.' : 'Keep your personal client relationships organised in one place.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={submit}>
            {initialClient ? 'Save changes' : 'Add client'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client name" required error={errors.name}>
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Priya Sharma"
            />
          </Field>
          <Field label="Business name" required error={errors.businessName}>
            <Input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="e.g. Horizon Studio"
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98450 12345"
            />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value as ClientStatus)}>
              <option value="Active">Active</option>
              <option value="Potential">Potential</option>
              <option value="Completed">Completed</option>
            </Select>
          </Field>
          <Field label="Location">
            <Input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City, State"
            />
          </Field>
        </div>
        <Field label="Notes" hint="Personal reminders, preferences or context.">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Preferred check-in day, payment habits, key contacts…"
          />
        </Field>
      </form>
    </Modal>
  );
}

export function formatClientSince(client: Client) {
  return formatDate(client.createdAt);
}
