import {
  BarChart3,
  CalendarDays,
  Clock3,
  FileText,
  Files,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const mainNavigation: NavItem[] = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'My Daily Work', to: '/daily-work', icon: Clock3 },
  { label: 'Tasks', to: '/tasks', icon: ListChecks },
  { label: 'Calendar', to: '/calendar', icon: CalendarDays },
  { label: 'Clients', to: '/clients', icon: Users },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Invoices', to: '/invoices', icon: FileText },
  { label: 'Payments', to: '/payments', icon: Wallet },
  { label: 'Documents', to: '/documents', icon: Files },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
];

export const toolNavigation: NavItem[] = [
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'Help & Support', to: '/help', icon: LifeBuoy },
];

export interface PageMeta {
  title: string;
  parent?: { label: string; to: string };
  action?: { label: string; to: string };
}

const exact: Record<string, PageMeta> = {
  '/': { title: 'Overview', action: { label: 'Create Task', to: '/tasks?create=1' } },
  '/daily-work': {
    title: 'My Daily Work',
    action: { label: 'Add Work Entry', to: '/daily-work?create=1' },
  },
  '/tasks': { title: 'Tasks', action: { label: 'Create Task', to: '/tasks?create=1' } },
  '/calendar': {
    title: 'Calendar',
    action: { label: 'Create Task', to: '/tasks?create=1' },
  },
  '/clients': { title: 'Clients', action: { label: 'Add Client', to: '/clients?create=1' } },
  '/projects': {
    title: 'Projects',
    action: { label: 'Create Project', to: '/projects?create=1' },
  },
  '/invoices': {
    title: 'Invoices',
    action: { label: 'Create Invoice', to: '/invoices?create=1' },
  },
  '/payments': {
    title: 'Payments',
    action: { label: 'Record Payment', to: '/payments?create=1' },
  },
  '/documents': {
    title: 'Documents',
    action: { label: 'Upload Files', to: '/documents?upload=1' },
  },
  '/reports': { title: 'Reports', action: { label: 'Export Report', to: '/reports?export=1' } },
  '/settings': { title: 'Settings' },
  '/help': { title: 'Help & Support' },
};

export function getPageMeta(pathname: string): PageMeta {
  if (exact[pathname]) return exact[pathname];
  if (pathname.startsWith('/clients/')) {
    return {
      title: 'Client Profile',
      parent: { label: 'Clients', to: '/clients' },
      action: { label: 'Create Task', to: '/tasks?create=1' },
    };
  }
  if (pathname.startsWith('/projects/')) {
    return {
      title: 'Project Details',
      parent: { label: 'Projects', to: '/projects' },
      action: { label: 'Create Task', to: '/tasks?create=1' },
    };
  }
  return { title: 'Overview', action: { label: 'Create Task', to: '/tasks?create=1' } };
}
