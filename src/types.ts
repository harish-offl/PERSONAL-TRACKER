export type ClientStatus = 'Active' | 'Completed' | 'Potential' | 'On Hold' | 'Inactive';

export type ProjectStatus =
  | 'Planning'
  | 'Started'
  | 'Active'
  | 'In Progress'
  | 'On Hold'
  | 'Review'
  | 'Completed'
  | 'Cancelled';

export type TaskStatus = 'todo' | 'inprogress' | 'pending' | 'completed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type WorkStatus = 'Completed' | 'Ongoing' | 'Planned';

export type WorkCategory =
  | 'Design'
  | 'Development'
  | 'Meetings'
  | 'Research'
  | 'Writing'
  | 'Administration'
  | 'Other';

export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Overdue' | 'Paid' | 'Cancelled';

export type PaymentMode = 'UPI' | 'Bank Transfer' | 'Cash' | 'Card' | 'Cheque' | 'Other';

export type ExpenseCategory =
  | 'Software'
  | 'Subscription'
  | 'Internet'
  | 'Equipment'
  | 'Travel'
  | 'Marketing'
  | 'Personal Work'
  | 'Other';

export type ExpensePaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';

export type PaymentType = 'Payment' | 'Refund';

export type DocumentCategory =
  | 'Personal'
  | 'Client'
  | 'Project'
  | 'Invoice'
  | 'Receipt'
  | 'Contract'
  | 'Proposal'
  | 'Brand Asset'
  | 'Other';

export type ActivityType =
  | 'task'
  | 'payment'
  | 'invoice'
  | 'client'
  | 'project'
  | 'work'
  | 'expense'
  | 'document'
  | 'system';

export type Theme = 'light' | 'dark';

export interface Client {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  status: ClientStatus;
  location: string;
  notes: string;
  createdAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  clientId: string;
  description: string;
  value: number;
  startDate: string;
  endDate: string;
  progress: number;
  status: ProjectStatus;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  startDate?: string;
  category?: string;
  projectId?: string;
  clientId?: string;
  comments: number;
  createdAt: string;
}

export interface WorkEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  category: WorkCategory;
  clientId?: string;
  projectId?: string;
  status: WorkStatus;
  notes: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  discount: number;
  taxRate: number;
  notes: string;
  terms: string;
  draft: boolean;
  cancelled?: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  clientId: string;
  invoiceId: string;
  amount: number;
  date: string;
  mode: PaymentMode;
  reference: string;
  type: PaymentType;
  notes: string;
  createdAt: string;
}

export interface AppDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  size: number;
  ext: string;
  clientId?: string;
  projectId?: string;
  uploadDate: string;
  notes: string;
}

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: ExpensePaymentMethod;
  description: string;
  clientId?: string;
  projectId?: string;
  receiptName?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  detail: string;
  date: string;
}

export interface ProfileSettings {
  name: string;
  email: string;
  phone: string;
  role: string;
  workspace: string;
  bio: string;
}

export interface InvoiceSettings {
  businessName: string;
  gstin: string;
  prefix: string;
  defaultTax: number;
  paymentTerms: string;
  notes: string;
  bankDetails: string;
}

export interface CurrencySettings {
  currency: 'INR' | 'USD' | 'EUR';
  dateFormat: 'MMM d, yyyy' | 'dd/MM/yyyy' | 'MM/dd/yyyy';
  timezone: string;
}

export interface Settings {
  profile: ProfileSettings;
  invoice: InvoiceSettings;
  preferences: CurrencySettings;
  twoFactor: boolean;
  theme: Theme;
}

export interface AppState {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  workEntries: WorkEntry[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  documents: AppDocument[];
  activities: Activity[];
  settings: Settings;
}

export type SubjectPriority = 'Low' | 'Medium' | 'High';

export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  targetHours: number;
  targetDate: string;
  priority: SubjectPriority;
  progress: number;
  completedChapters: number;
  totalChapters: number;
  lastStudied?: string;
  createdAt: string;
}

export interface StudySchedule {
  id: string;
  subjectId: string;
  day: number;
  startTime: string;
  endTime: string;
  notes: string;
  repeat: boolean;
  completed: boolean;
  createdAt: string;
}

export type StudySessionType = 'Stopwatch' | 'Pomodoro' | 'Countdown' | 'Manual';

export interface StudySession {
  id: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: StudySessionType;
  notes: string;
  completed: boolean;
  createdAt: string;
}

export interface StudyNote {
  id: string;
  subjectId?: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyShare {
  token: string;
  enabled: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface StudyResource {
  id: string;
  title: string;
  subjectId?: string;
  description: string;
  tags: string[];
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl?: string;
  uploadedAt: string;
  share?: StudyShare;
}

export interface StudyEvent {
  id: string;
  title: string;
  date: string;
  type: 'Exam' | 'Deadline' | 'Reminder';
  notes: string;
}

export interface StudyGoals {
  dailyHours: number;
  weeklyHours: number;
  monthlyHours: number;
}

export interface StudyProfile {
  name: string;
  email: string;
  workspace: string;
  bio: string;
}

export interface StudySettings {
  profile: StudyProfile;
  goals: StudyGoals;
  theme: Theme;
  reminders: boolean;
}

export interface StudyState {
  subjects: Subject[];
  schedules: StudySchedule[];
  sessions: StudySession[];
  notes: StudyNote[];
  resources: StudyResource[];
  events: StudyEvent[];
  settings: StudySettings;
}

export type TimerMode = 'stopwatch' | 'pomodoro' | 'countdown';
export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface StudyTimerState {
  running: boolean;
  mode: TimerMode;
  subjectId: string;
  description: string;
  startedAt: number | null;
  accumulatedSeconds: number;
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  countdownMinutes: number;
  phase: TimerPhase;
  round: number;
}
