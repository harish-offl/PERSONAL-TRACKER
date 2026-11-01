export type ClientStatus = 'Active' | 'Completed' | 'Potential';

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed';

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

export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Overdue' | 'Paid';

export type PaymentMode = 'UPI' | 'Bank Transfer' | 'Cash' | 'Card' | 'Cheque';

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
  documents: AppDocument[];
  activities: Activity[];
  settings: Settings;
}
