import { Link, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { CalendarPage } from './pages/Calendar';
import { ClientProfilePage } from './pages/ClientProfile';
import { ClientsPage } from './pages/Clients';
import { DailyWorkPage } from './pages/DailyWork';
import { DocumentsPage } from './pages/Documents';
import { HelpPage } from './pages/Help';
import { InvoicesPage } from './pages/Invoices';
import { OverviewPage } from './pages/Overview';
import { PaymentsPage } from './pages/Payments';
import { ProjectDetailPage } from './pages/ProjectDetail';
import { ProjectsPage } from './pages/Projects';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { TasksPage } from './pages/Tasks';

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-card text-muted shadow-card">
        <Compass className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[34px] font-semibold tracking-[-0.04em] text-ink">404</p>
      <h1 className="mt-1 text-[14px] font-semibold text-ink">This page wandered off</h1>
      <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-muted">
        The page you are looking for does not exist. Head back to your dashboard and pick up where you left off.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-accent px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
      >
        Back to overview
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="daily-work" element={<DailyWorkPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientProfilePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
