import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  FolderKanban,
  HelpCircle,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import {
  cn,
  deadlineLabel,
  downloadJSON,
  formatMoney,
  invoicePaid,
  invoiceStatus,
  invoiceTotal,
  isOverdue,
} from '../../lib/utils';
import { getPageMeta } from '../../lib/navigation';
import { Avatar, Button, IconButton, Popover, useToast } from '../ui';

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  to: string;
  icon: typeof Clock3;
  tone: 'warning' | 'danger' | 'info';
}

export function Header({
  onOpenMobile,
  onOpenSearch,
}: {
  onOpenMobile: () => void;
  onOpenSearch: () => void;
}) {
  const { state, updateSettings } = useAppData();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [readIds, setReadIds] = useState<string[]>([]);

  const meta = getPageMeta(location.pathname);
  const theme = state.settings.theme;

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    state.tasks
      .filter((task) => task.status !== 'completed' && deadlineLabel(task.dueDate).includes('overdue'))
      .slice(0, 2)
      .forEach((task) => {
        items.push({
          id: `task-${task.id}`,
          title: 'Task overdue',
          detail: `${task.title} · ${deadlineLabel(task.dueDate)}`,
          to: '/tasks',
          icon: Clock3,
          tone: 'danger',
        });
      });
    state.tasks
      .filter((task) => task.status !== 'completed' && !isOverdue(task.dueDate))
      .slice(0, 1)
      .forEach((task) => {
        items.push({
          id: `task-soon-${task.id}`,
          title: 'Task due soon',
          detail: `${task.title} · ${deadlineLabel(task.dueDate)}`,
          to: '/tasks',
          icon: Clock3,
          tone: 'warning',
        });
      });
    state.invoices
      .filter((invoice) => invoiceStatus(invoice, state.payments) === 'Overdue')
      .slice(0, 2)
      .forEach((invoice) => {
        const remaining = invoiceTotal(invoice) - invoicePaid(invoice.id, state.payments);
        items.push({
          id: `invoice-${invoice.id}`,
          title: 'Invoice overdue',
          detail: `${invoice.id} · ${formatMoney(remaining)} outstanding`,
          to: '/invoices',
          icon: FileText,
          tone: 'danger',
        });
      });
    state.projects
      .filter((project) => project.status === 'Active')
      .slice(0, 1)
      .forEach((project) => {
        items.push({
          id: `project-${project.id}`,
          title: 'Active project',
          detail: `${project.name} · ${project.progress}% complete`,
          to: `/projects/${project.id}`,
          icon: FolderKanban,
          tone: 'info',
        });
      });
    return items.slice(0, 6);
  }, [state.tasks, state.invoices, state.payments, state.projects]);

  const unread = notifications.filter((item) => !readIds.includes(item.id)).length;

  const markAllRead = () => setReadIds(notifications.map((item) => item.id));

  const handlePrimaryAction = () => {
    if (!meta.action) return;
    const [path, query] = meta.action.to.split('?');
    const params = new URLSearchParams(query ?? '');
    params.set('t', String(Date.now()));
    navigate(`${path}?${params.toString()}`);
  };

  const toggleTheme = () => {
    updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });
  };

  const crumbs = [
    { label: 'Dashboard', to: '/' },
    ...(meta.parent ? [{ label: meta.parent.label, to: meta.parent.to }] : []),
    { label: meta.title, to: location.pathname },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-content/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <IconButton
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onOpenMobile}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </IconButton>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[12px]">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
                {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted/70" />}
                {last ? (
                  <span className="truncate font-medium text-ink">{crumb.label}</span>
                ) : (
                  <Link
                    to={crumb.to}
                    className="hidden shrink-0 text-soft transition hover:text-ink sm:inline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <IconButton
          variant="ghost"
          size="icon-sm"
          onClick={onOpenSearch}
          aria-label="Search workspace"
          title="Search workspace (Ctrl K)"
        >
          <Search className="h-4 w-4" />
        </IconButton>

        <Popover
          className="w-[340px] p-0"
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-soft transition hover:bg-secondary hover:text-ink"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-[7px] w-[7px] items-center justify-center rounded-full bg-accent ring-2 ring-content" />
              )}
            </button>
          )}
        >
          {({ close }) => (
            <div>
              <div className="flex items-center justify-between border-b border-line-soft px-3.5 py-3">
                <div>
                  <p className="text-[12.5px] font-semibold text-ink">Notifications</p>
                  <p className="text-[10.5px] text-muted">
                    {unread ? `${unread} unread updates` : 'You are all caught up'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-[10.5px] font-medium text-accent-strong hover:underline"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              </div>
              <div className="max-h-[340px] overflow-y-auto p-1.5">
                {notifications.length === 0 && (
                  <p className="px-3 py-6 text-center text-[11.5px] text-muted">
                    Nothing needs your attention right now.
                  </p>
                )}
                {notifications.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setReadIds((ids) => [...new Set([...ids, item.id])]);
                        close();
                        navigate(item.to);
                      }}
                      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-secondary"
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-secondary',
                          item.tone === 'danger' && 'text-danger',
                          item.tone === 'warning' && 'text-warning',
                          item.tone === 'info' && 'text-info',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-semibold text-ink">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[10.5px] text-soft">
                          {item.detail}
                        </span>
                      </span>
                      {!readIds.includes(item.id) && (
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Popover>

        <IconButton
          variant="ghost"
          size="icon-sm"
          className="hidden sm:inline-flex"
          onClick={() => navigate('/settings')}
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </IconButton>

        <IconButton
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </IconButton>

        <Popover
          className="w-[240px]"
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="ml-0.5 rounded-full outline-none ring-offset-2 ring-offset-content transition focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label="Profile menu"
            >
              <Avatar name={state.settings.profile.name} size="md" />
            </button>
          )}
        >
          {({ close }) => (
            <div>
              <div className="flex items-center gap-2.5 border-b border-line-soft px-2.5 py-2.5">
                <Avatar name={state.settings.profile.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-ink">
                    {state.settings.profile.name}
                  </p>
                  <p className="truncate text-[10px] text-muted">{state.settings.profile.email}</p>
                </div>
              </div>
              <div className="pt-1">
                <ProfileItem
                  icon={UserRound}
                  label="Profile & settings"
                  onClick={() => {
                    close();
                    navigate('/settings?tab=profile');
                  }}
                />
                <ProfileItem
                  icon={theme === 'dark' ? Sun : Moon}
                  label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
                  onClick={() => {
                    toggleTheme();
                    close();
                  }}
                />
                <ProfileItem
                  icon={HelpCircle}
                  label="Help & support"
                  onClick={() => {
                    close();
                    navigate('/help');
                  }}
                />
                <ProfileItem
                  icon={Download}
                  label="Download my data"
                  onClick={() => {
                    downloadJSON(`personal-tracker-${new Date().toISOString().slice(0, 10)}.json`, state);
                    toast({ title: 'Workspace exported', description: 'Your JSON backup has been downloaded.' });
                    close();
                  }}
                />
              </div>
            </div>
          )}
        </Popover>

        {meta.action && (
          <Button
            variant="primary"
            size="md"
            onClick={handlePrimaryAction}
            className="ml-1 hidden sm:inline-flex"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            {meta.action.label}
          </Button>
        )}
        {meta.action && (
          <IconButton
            variant="primary"
            size="icon"
            onClick={handlePrimaryAction}
            className="sm:hidden"
            aria-label={meta.action.label}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </IconButton>
        )}
      </div>
    </header>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof UserRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-soft transition hover:bg-secondary hover:text-ink"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
