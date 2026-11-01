import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
  FileText,
  Files,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Search,
  Users,
  Wallet,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Modal, Kbd } from '../ui';
import { cn, formatMoney, invoicePaid, invoiceStatus, invoiceTotal } from '../../lib/utils';

interface ResultItem {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  icon: typeof Clock3;
  type: string;
}

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state } = useAppData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const quickLinks: ResultItem[] = [
    { id: 'q1', title: 'Overview', subtitle: 'Dashboard workspace', to: '/', icon: LayoutDashboard, type: 'Page' },
    { id: 'q2', title: 'My Daily Work', subtitle: 'Log and review your day', to: '/daily-work', icon: Clock3, type: 'Page' },
    { id: 'q3', title: 'Tasks', subtitle: 'Kanban and task list', to: '/tasks', icon: ListChecks, type: 'Page' },
    { id: 'q4', title: 'Clients', subtitle: 'Personal client records', to: '/clients', icon: Users, type: 'Page' },
    { id: 'q5', title: 'Projects', subtitle: 'Timelines and progress', to: '/projects', icon: FolderKanban, type: 'Page' },
    { id: 'q6', title: 'Invoices', subtitle: 'Billing and collections', to: '/invoices', icon: FileText, type: 'Page' },
    { id: 'q7', title: 'Payments', subtitle: 'Received and outstanding', to: '/payments', icon: Wallet, type: 'Page' },
    { id: 'q8', title: 'Documents', subtitle: 'Files and assets', to: '/documents', icon: Files, type: 'Page' },
  ];

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quickLinks;

    const items: ResultItem[] = [];
    state.clients.forEach((client) => {
      const haystack = `${client.name} ${client.businessName} ${client.email} ${client.phone}`.toLowerCase();
      if (haystack.includes(q)) {
        items.push({
          id: client.id,
          title: client.businessName,
          subtitle: `${client.name} · ${client.status}`,
          to: `/clients/${client.id}`,
          icon: Users,
          type: 'Client',
        });
      }
    });
    state.projects.forEach((project) => {
      const client = state.clients.find((item) => item.id === project.clientId);
      const haystack = `${project.name} ${project.code} ${client?.businessName ?? ''}`.toLowerCase();
      if (haystack.includes(q)) {
        items.push({
          id: project.id,
          title: project.name,
          subtitle: `${project.code} · ${client?.businessName ?? 'No client'}`,
          to: `/projects/${project.id}`,
          icon: FolderKanban,
          type: 'Project',
        });
      }
    });
    state.tasks.forEach((task) => {
      const haystack = `${task.title} ${task.id} ${task.description}`.toLowerCase();
      if (haystack.includes(q)) {
        items.push({
          id: task.id,
          title: task.title,
          subtitle: `${task.id} · ${task.priority} priority`,
          to: `/tasks?task=${task.id}`,
          icon: ListChecks,
          type: 'Task',
        });
      }
    });
    state.invoices.forEach((invoice) => {
      const client = state.clients.find((item) => item.id === invoice.clientId);
      const haystack = `${invoice.id} ${client?.businessName ?? ''}`.toLowerCase();
      if (haystack.includes(q)) {
        const remaining = invoiceTotal(invoice) - invoicePaid(invoice.id, state.payments);
        items.push({
          id: invoice.id,
          title: invoice.id,
          subtitle: `${client?.businessName ?? 'Client'} · ${invoiceStatus(invoice, state.payments)} · ${formatMoney(remaining)} due`,
          to: `/invoices?invoice=${invoice.id}`,
          icon: FileText,
          type: 'Invoice',
        });
      }
    });
    state.documents.forEach((doc) => {
      const haystack = `${doc.name} ${doc.category}`.toLowerCase();
      if (haystack.includes(q)) {
        items.push({
          id: doc.id,
          title: doc.name,
          subtitle: `${doc.category} · ${doc.ext.toUpperCase()}`,
          to: `/documents?doc=${doc.id}`,
          icon: Files,
          type: 'Document',
        });
      }
    });

    return items.slice(0, 18);
  }, [query, quickLinks, state]);

  const grouped = useMemo(() => {
    const map = new Map<string, ResultItem[]>();
    results.forEach((item) => {
      map.set(item.type, [...(map.get(item.type) ?? []), item]);
    });
    return Array.from(map.entries());
  }, [results]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const go = (item: ResultItem) => {
    onClose();
    navigate(item.to);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((index) => Math.min(index + 1, results.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && results[selected]) {
      event.preventDefault();
      go(results[selected]);
    }
  };

  let flatIndex = -1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Search workspace"
      description="Find tasks, clients, projects, invoices and documents."
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-[10.5px] text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> open
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <Kbd>esc</Kbd> close
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      }
      className="min-h-[420px]"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search anything in your workspace…"
          className="h-10 w-full rounded-lg border border-line bg-secondary/60 pl-9 pr-3 text-[13px] text-ink outline-none transition placeholder:text-muted focus:border-accent/60 focus:bg-card focus:ring-2 focus:ring-accent/15"
        />
      </div>

      <div className="mt-3 max-h-[48vh] overflow-y-auto pr-1">
        {results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-secondary text-muted">
              <Search className="h-4 w-4" />
            </div>
            <p className="mt-3 text-[12.5px] font-semibold text-ink">No matches found</p>
            <p className="mt-1 text-[11px] text-soft">
              Try a client name, task title, invoice number or document.
            </p>
          </div>
        )}
        {grouped.map(([type, items]) => (
          <div key={type} className="mb-2">
            <p className="px-2 pb-1 pt-2 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              {type}
            </p>
            {items.map((item) => {
              flatIndex += 1;
              const index = flatIndex;
              const Icon = item.icon;
              return (
                <button
                  key={`${type}-${item.id}`}
                  type="button"
                  onMouseEnter={() => setSelected(index)}
                  onClick={() => go(item)}
                  className={cn(
                    'group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition',
                    selected === index ? 'bg-secondary' : 'hover:bg-secondary/70',
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-card text-soft">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-ink">{item.title}</span>
                    <span className="block truncate text-[10.5px] text-muted">{item.subtitle}</span>
                  </span>
                  <ArrowRight
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-muted transition',
                      selected === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Modal>
  );
}
