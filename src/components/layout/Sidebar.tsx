import { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { cn, invoiceStatus } from '../../lib/utils';
import { Avatar, Kbd, Popover } from '../ui';
import { mainNavigation, toolNavigation } from '../../lib/navigation';

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onOpenSearch,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSearch: () => void;
}) {
  const { state } = useAppData();
  const location = useLocation();
  const navigate = useNavigate();

  const pendingTasks = useMemo(
    () => state.tasks.filter((task) => task.status !== 'completed').length,
    [state.tasks],
  );
  const overdueInvoices = useMemo(
    () =>
      state.invoices.filter(
        (invoice) => !invoice.draft && invoiceStatus(invoice, state.payments) === 'Overdue',
      ).length,
    [state.invoices, state.payments],
  );

  const counts: Record<string, number> = {
    '/tasks': pendingTasks,
    '/invoices': overdueInvoices,
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-line bg-sidebar transition-all duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[76px]' : 'lg:w-[244px]',
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex shrink-0 items-center gap-2.5 px-3 pb-3 pt-4',
            collapsed && 'lg:justify-center lg:px-2',
          )}
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#7C6FE0] via-[#6558D3] to-[#5649C0] text-white shadow-[0_6px_16px_-6px_rgba(8,8,8,0.35)]">
            <span className="absolute inset-[3px] rounded-[7px] border border-white/25" />
            <Sparkles className="relative h-4 w-4" strokeWidth={2.2} />
          </div>
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-ink">
                Personal Tracker
              </span>
              <span className="rounded border border-line bg-card px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-muted">
                Pro
              </span>
            </div>
            <p className="truncate text-[10.5px] text-muted">{state.settings.profile.workspace}</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-soft transition hover:bg-card hover:text-ink lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              'hidden rounded-lg p-1.5 text-muted transition hover:bg-card hover:text-ink lg:inline-flex',
              collapsed && 'lg:hidden',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className={cn('px-3 pb-1', collapsed && 'lg:px-2')}>
          <button
            type="button"
            onClick={onOpenSearch}
            className={cn(
              'group flex w-full items-center gap-2 rounded-lg border border-line bg-card/70 px-2.5 py-2 text-left text-[12px] text-muted shadow-card transition hover:border-line hover:bg-card hover:text-soft',
              collapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className={cn('flex-1', collapsed && 'lg:hidden')}>Search workspace…</span>
            <span className={cn('hidden items-center sm:flex', collapsed && 'lg:hidden')}>
              <Kbd>/</Kbd>
            </span>
          </button>
          {collapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="mt-2 hidden w-full items-center justify-center rounded-lg p-1.5 text-muted transition hover:bg-card hover:text-ink lg:flex"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-3">
          <SidebarSectionLabel collapsed={collapsed}>Workspace</SidebarSectionLabel>
          <div className="space-y-0.5">
            {mainNavigation.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={collapsed}
                count={counts[item.to]}
                active={
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
                }
                onNavigate={onCloseMobile}
              />
            ))}
          </div>

          <div className="my-4 h-px bg-line-soft" />
          <SidebarSectionLabel collapsed={collapsed}>Tools</SidebarSectionLabel>
          <div className="space-y-0.5">
            {toolNavigation.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={collapsed}
                active={location.pathname === item.to}
                onNavigate={onCloseMobile}
              />
            ))}
          </div>
        </nav>

        {/* Profile */}
        <div className={cn('shrink-0 border-t border-line-soft p-3', collapsed && 'lg:px-2')}>
          <Popover
            align="start"
            className="w-[230px]"
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl border border-line bg-card p-2 text-left shadow-card transition hover:bg-card/90',
                  collapsed && 'lg:justify-center lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none',
                )}
              >
                <Avatar name={state.settings.profile.name} size="md" />
                <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
                  <p className="truncate text-[12px] font-semibold text-ink">
                    {state.settings.profile.name}
                  </p>
                  <p className="truncate text-[10px] text-muted">{state.settings.profile.email}</p>
                </div>
                <ChevronsUpDown
                  className={cn('h-3.5 w-3.5 shrink-0 text-muted', collapsed && 'lg:hidden')}
                />
              </button>
            )}
          >
            {({ close }) => (
              <div>
                <div className="flex items-center gap-2.5 border-b border-line-soft px-2 py-2.5">
                  <Avatar name={state.settings.profile.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-ink">
                      {state.settings.profile.name}
                    </p>
                    <p className="truncate text-[10px] text-muted">{state.settings.profile.role}</p>
                  </div>
                </div>
                <div className="pt-1">
                  <MenuItem
                    label="Profile & settings"
                    onClick={() => {
                      close();
                      navigate('/settings?tab=profile');
                    }}
                  />
                  <MenuItem
                    label="Appearance"
                    onClick={() => {
                      close();
                      navigate('/settings?tab=appearance');
                    }}
                  />
                  <MenuItem
                    label="Help & support"
                    onClick={() => {
                      close();
                      navigate('/help');
                    }}
                  />
                </div>
              </div>
            )}
          </Popover>
        </div>
      </aside>
    </>
  );
}

function SidebarSectionLabel({
  children,
  collapsed,
}: {
  children: string;
  collapsed: boolean;
}) {
  return (
    <p
      className={cn(
        'mb-1.5 mt-1 px-2.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted',
        collapsed && 'lg:hidden',
      )}
    >
      {children}
    </p>
  );
}

function SidebarLink({
  item,
  collapsed,
  active,
  count,
  onNavigate,
}: {
  item: { label: string; to: string; icon: typeof mainNavigation[number]['icon'] };
  collapsed: boolean;
  active: boolean;
  count?: number;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg border px-2.5 py-[7px] text-[12.5px] font-medium transition-all duration-150',
        collapsed && 'lg:justify-center lg:px-0',
        active
          ? 'border-line bg-card text-ink shadow-card'
          : 'border-transparent text-soft hover:bg-card/60 hover:text-ink',
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r-full bg-accent" />
      )}
      <Icon
        className={cn(
          'h-[15px] w-[15px] shrink-0 transition-colors',
          active ? 'text-ink' : 'text-muted group-hover:text-soft',
        )}
        strokeWidth={active ? 2.1 : 1.9}
      />
      <span className={cn('flex-1 truncate', collapsed && 'lg:hidden')}>{item.label}</span>
      {count !== undefined && count > 0 && (
        <>
          <span
            className={cn(
              'flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 text-[9.5px] font-semibold text-white',
              collapsed && 'lg:hidden',
            )}
          >
            {count}
          </span>
          <span className="absolute right-2 top-2 hidden h-1.5 w-1.5 rounded-full bg-accent lg:block" />
        </>
      )}
    </NavLink>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-soft transition hover:bg-secondary hover:text-ink"
    >
      {label}
    </button>
  );
}
