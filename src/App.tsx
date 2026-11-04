import { Navigate, Route, Routes } from 'react-router-dom';
import { WorkShell } from './components/layout/WorkShell';
import { StudyShell } from './components/study/StudyShell';
import { PortalsPage } from './pages/Portals';
import { PortalLoginPage } from './pages/PortalLogin';
import { OverviewPage } from './pages/Overview';
import { TasksPage } from './pages/Tasks';
import { CalendarPage } from './pages/Calendar';
import { ClientsPage } from './pages/Clients';
import { ClientProfilePage } from './pages/ClientProfile';
import { ProjectsPage } from './pages/Projects';
import { ProjectDetailPage } from './pages/ProjectDetail';
import { InvoicesPage } from './pages/Invoices';
import { PaymentsPage } from './pages/Payments';
import { DocumentsPage } from './pages/Documents';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { DailyWorkPage } from './pages/DailyWork';
import { HelpPage } from './pages/Help';
import { StudyDashboardPage } from './pages/study/Dashboard';
import { StudySubjectsPage } from './pages/study/Subjects';
import { StudyTimetablePage } from './pages/study/Timetable';
import { StudyTimerPage } from './pages/study/Timer';
import { StudySessionsPage } from './pages/study/Sessions';
import { StudyProgressPage } from './pages/study/Progress';
import { StudyNotesPage } from './pages/study/Notes';
import { StudyResourcesPage } from './pages/study/Resources';
import { StudyCalendarPage } from './pages/study/Calendar';
import { StudySettingsPage } from './pages/study/Settings';
import { useAuth } from './context/AuthContext';

function WorkLoginPage() {
  return <PortalLoginPage portal="work" />;
}

function StudyLoginPage() {
  return <PortalLoginPage portal="study" />;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-card text-muted shadow-card">
        <CompassIcon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[34px] font-semibold tracking-[-0.04em] text-ink">404</p>
      <h1 className="mt-1 text-[14px] font-semibold text-ink">This page wandered off</h1>
      <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-muted">
        The page you are looking for does not exist. Head back to your portals and pick up where you left off.
      </p>
      <a
        href="/"
        className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-accent px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
      >
        Back to portals
      </a>
    </div>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 4V10M10 16V10M4 10H10M16 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Entry page (public) */}
      <Route path="/" element={<PortalsPage />} />

      {/* ============ WORK PORTAL ============ */}
      <Route path="work/login" element={<WorkLoginPage />} />
      <Route path="work" element={<WorkShell />}>
        <Route index element={<Navigate to="/work/dashboard" replace />} />
        <Route path="dashboard" element={<OverviewPage />} />
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
        <Route path="daily-work" element={<DailyWorkPage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>

      {/* ============ STUDY PORTAL ============ */}
      <Route path="study/login" element={<StudyLoginPage />} />
      <Route path="study" element={<StudyShell />}>
        <Route index element={<Navigate to="/study/dashboard" replace />} />
        <Route path="dashboard" element={<StudyDashboardPage />} />
        <Route path="subjects" element={<StudySubjectsPage />} />
        <Route path="timetable" element={<StudyTimetablePage />} />
        <Route path="timer" element={<StudyTimerPage />} />
        <Route path="sessions" element={<StudySessionsPage />} />
        <Route path="progress" element={<StudyProgressPage />} />
        <Route path="notes" element={<StudyNotesPage />} />
        <Route path="resources" element={<StudyResourcesPage />} />
        <Route path="calendar" element={<StudyCalendarPage />} />
        <Route path="settings" element={<StudySettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
