import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Timer,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { cn } from '../../lib/utils';
import { Popover } from '../ui';
import { PageSkeleton } from '../layout/PageSkeleton';

interface NavEntry {
  label: string;
  to: string;
  icon: LucideIcon;
}

const groups: { label: string; items: NavEntry[] }[] = [
  {
    label: 'Work',
    items: [
      { label: 'Dashboard', to: '/work/dashboard', icon: LayoutDashboard },
      { label: 'Tasks', to: '/work/tasks', icon: BookOpenText },
      { label: 'Calendar', to: '/work/calendar', icon: CalendarDays },
      { label: 'Clients', to: '/work/clients', icon: Users },
      { label: 'Projects', to: '/work/projects', icon: FolderKanban },
      { label: 'Invoices', to: '/work/invoices', icon: FileText },
      { label: 'Payments', to: '/work/payments', icon: Wallet },
      { label: 'Documents', to: '/work/documents', icon: Library },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', to: '/work/reports', icon: BarChart3 },
    ],
  },
];

const meta: Record<string, { title: string; subtitle: string }> = {
  '/work/dashboard': { title: 'Good Morning, Annamalai', subtitle: "Here's your work overview for today." },
  '/work/tasks': { title: 'Tasks', subtitle: 'Manage your daily work and priorities' },
  '/work/calendar': { title: 'Calendar', subtitle: 'Deadlines, tasks and upcoming dates' },
  '/work/clients': { title: 'Clients', subtitle: 'Your client database and relationships' },
  '/work/projects': { title: 'Projects', subtitle: 'Track progress, value and deadlines' },
  '/work/invoices': { title: 'Invoices', subtitle: 'Generate, send and track invoices' },
  '/work/payments': { title: 'Payments', subtitle: 'Record payments and track outstanding' },
  '/work/documents': { title: 'Documents', subtitle: 'Store and manage project files' },
  '/work/reports': { title: 'Reports', subtitle: 'Revenue, expenses and net income' },
  '/work/settings': { title: 'Settings', subtitle: 'Profile, invoicing and preferences' },
  '/work/daily-work': { title: 'Daily Work', subtitle: 'Log your focused work sessions' },
  '/work/help': { title: 'Help & Support', subtitle: 'Guidance for your workspace' },
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function WorkShell() {
  const { state, isLoading, updateSettings } = useAppData();
  const { isAuthenticated, logout } = useAuth();
  if (!isAuthenticated('work')) return <Navigate to="/work/login" replace />;
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('personal-tracker:work-sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const page = meta[location.pathname] ?? meta['/work/dashboard'];
  const theme = state.settings.theme;

  useEffect(() => {
    try {
      localStorage.setItem('personal-tracker:work-sidebar', collapsed ? 'collapsed' : 'expanded');
    } catch {
      // Ignore storage limitations.
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  function signOut() {
    logout('work');
    navigate('/work/login', { replace: true });
  }

  function switchPortal() {
    navigate('/study/login');
  }

  const navContent = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center gap-2.5 px-3 pb-4 pt-4',
          collapsed && 'lg:justify-center lg:px-2',
        )}
      >
        <NavLink
          to="/work/dashboard"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#7C6FE0] via-[#6558D3] to-[#5649C0] text-white shadow-[0_8px_20px_-9px_rgba(101,88,211,0.75)]"
          aria-label="Work dashboard"
        >
          <span className="absolute inset-[3px] rounded-[7px] border border-white/25" />
          <SparklesIcon className="relative h-4 w-4" strokeWidth={2.1} />
        </NavLink>
        <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold tracking-[-0.015em]">Personal Tracker</span>
            <span className="rounded border border-line bg-card px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-muted">
              Work
            </span>
          </div>
          <p className="truncate text-[10.5px] text-muted">{state.settings.profile.workspace}</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-soft transition hover:bg-card hover:text-ink lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className={cn(
            'hidden rounded-lg p-1.5 text-muted transition hover:bg-card hover:text-ink lg:inline-flex',
            collapsed && 'lg:hidden',
          )}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p
              className={cn(
                'mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted',
                collapsed && 'lg:hidden',
              )}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[12px] font-medium transition-colors',
                      active
                        ? 'bg-accent-soft text-accent-strong'
                        : 'text-soft hover:bg-card hover:text-ink',
                      collapsed && 'lg:justify-center lg:px-0',
                    )}
                  >
                    <Icon
                      className={cn('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-muted group-hover:text-soft')}
                      strokeWidth={1.8}
                    />
                    <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                    {active && <span className={cn('ml-auto h-1 w-1 rounded-full bg-accent', collapsed && 'lg:hidden')} />}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-line p-3', collapsed && 'lg:px-2')}>
        <NavLink
          to="/work/settings"
          className={cn(
            'mb-2 flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[12px] font-medium text-soft transition hover:bg-card hover:text-ink',
            collapsed && 'lg:justify-center lg:px-0',
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.8} />
          <span className={cn(collapsed && 'lg:hidden')}>Settings</span>
        </NavLink>

        <div className={cn('flex items-center gap-2 rounded-xl border border-line bg-card p-2', collapsed && 'lg:hidden')}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-strong">
            {initials(state.settings.profile.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold">{state.settings.profile.name}</p>
            <p className="truncate text-[9px] text-muted">Workspace owner</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md p-1.5 text-muted transition hover:bg-secondary hover:text-danger"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mt-2 hidden h-8 w-full items-center justify-center rounded-lg text-muted hover:bg-card hover:text-ink lg:flex"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-app text-ink">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[244px] border-r border-line bg-sidebar transition-all duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[76px]' : 'lg:w-[244px]',
        )}
      >
        {navContent}
      </aside>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-300',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[244px]',
        )}
      >
        <header className="flex h-[62px] shrink-0 items-center gap-3 border-b border-line bg-app/85 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-soft transition hover:bg-card hover:text-ink lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.025em]">{page.title}</h1>
            <p className="truncate text-[10.5px] text-muted">{page.subtitle}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={switchPortal}
              className="hidden h-8 items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 text-[10.5px] font-medium text-soft shadow-card transition hover:border-accent hover:text-ink sm:flex"
              title="Switch to Study Space"
            >
              <ArrowLeftRight className="h-3 w-3" />
              Study
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card text-soft shadow-card transition hover:text-ink"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <Popover
              align="end"
              className="w-56"
              trigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-card pl-1 pr-2 shadow-card transition hover:border-accent"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-[9px] font-semibold text-accent-strong">
                    {initials(state.settings.profile.name)}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted" />
                </button>
              )}
            >
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-[11.5px] font-semibold">{state.settings.profile.name}</p>
                <p className="truncate text-[9.5px] text-muted">{state.settings.profile.email}</p>
              </div>
              <button
                type="button"
                onClick={switchPortal}
                className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium text-soft hover:bg-secondary hover:text-ink"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" /> Switch to Study Space
              </button>
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium text-danger hover:bg-danger-soft"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </Popover>
          </div>
        </header>

        <main ref={mainRef} className="relative flex-1 overflow-y-auto bg-content">
          {isLoading ? (
            <PageSkeleton />
          ) : (
            <div className="mx-auto w-full max-w-[1480px] px-4 pb-12 pt-5 sm:px-6 lg:px-7">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SparklesIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.4 4.4 15 6l1.6-1.6" />
      <path d="M15 10h4" />
      <path d="M15 14l-1.6 1.6-1.6-1.6" />
      <path d="M10 15v4" />
      <path d="M4.6 4.4 6 6l-1.6 1.6" />
      <path d="M6 10H2" />
      <path d="M2 14l1.6 1.6 1.6-1.6" />
      <path d="M10 5V1" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}
