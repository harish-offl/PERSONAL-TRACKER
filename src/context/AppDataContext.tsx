import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppDocument,
  AppState,
  Client,
  Expense,
  Invoice,
  Payment,
  Project,
  Settings,
  Task,
  WorkEntry,
} from '../types';
import { createSeedData } from '../data/seed';
import { applyTheme, readStoredTheme } from '../lib/theme';
import {
  TASK_STATUS_LABEL,
  formatDuration,
  formatMoney,
  setFormatPreferences,
  uid,
  workDuration,
} from '../lib/utils';

const STORAGE_KEY = 'personal-tracker:state:v1';

function mergeSettings(base: Settings, incoming?: Partial<Settings>): Settings {
  if (!incoming) return base;
  return {
    ...base,
    ...incoming,
    profile: { ...base.profile, ...(incoming.profile ?? {}) },
    invoice: { ...base.invoice, ...(incoming.invoice ?? {}) },
    preferences: { ...base.preferences, ...(incoming.preferences ?? {}) },
  };
}

function loadState(): AppState {
  const seed = createSeedData();
  seed.settings.theme = readStoredTheme(seed.settings.theme);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...seed,
      ...parsed,
      clients: parsed.clients ?? seed.clients,
      projects: parsed.projects ?? seed.projects,
      tasks: parsed.tasks ?? seed.tasks,
      workEntries: parsed.workEntries ?? seed.workEntries,
      invoices: parsed.invoices ?? seed.invoices,
      payments: parsed.payments ?? seed.payments,
      expenses: parsed.expenses ?? seed.expenses,
      documents: parsed.documents ?? seed.documents,
      activities: parsed.activities ?? seed.activities,
      settings: {
        ...mergeSettings(seed.settings, parsed.settings),
        theme: readStoredTheme(parsed.settings?.theme ?? seed.settings.theme),
      },
    };
  } catch {
    return seed;
  }
}

export interface SettingsPatch {
  profile?: Partial<Settings['profile']>;
  invoice?: Partial<Settings['invoice']>;
  preferences?: Partial<Settings['preferences']>;
  twoFactor?: boolean;
  theme?: Settings['theme'];
}

interface AppDataContextValue {
  state: AppState;
  isLoading: boolean;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addWork: (entry: WorkEntry) => void;
  updateWork: (entry: WorkEntry) => void;
  deleteWork: (id: string) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => void;
  addPayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addDocuments: (documents: AppDocument[]) => void;
  renameDocument: (id: string, name: string) => void;
  deleteDocument: (id: string) => void;
  updateSettings: (patch: SettingsPatch) => void;
  logActivity: (type: AppState['activities'][number]['type'], message: string, detail: string) => void;
  getNextInvoiceId: () => string;
  resetData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [isLoading, setIsLoading] = useState(true);
  const hydrated = useRef(false);

  setFormatPreferences(state.settings.preferences);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Local storage can be unavailable in private browsing; the app still works in memory.
    }
  }, [state]);

  useEffect(() => {
    applyTheme(state.settings.theme);
  }, [state.settings.theme]);

  const pushActivity = useCallback(
    (
      current: AppState,
      type: AppState['activities'][number]['type'],
      message: string,
      detail: string,
    ): AppState['activities'] => [
      { id: uid('ACT'), type, message, detail, date: new Date().toISOString() },
      ...current.activities,
    ].slice(0, 60),
    [],
  );

  const addClient = useCallback(
    (client: Client) => {
      setState((prev) => ({
        ...prev,
        clients: [client, ...prev.clients],
        activities: pushActivity(prev, 'client', 'Client added', `${client.businessName} joined your workspace`),
      }));
    },
    [pushActivity],
  );

  const updateClient = useCallback(
    (client: Client) => {
      setState((prev) => ({
        ...prev,
        clients: prev.clients.map((item) => (item.id === client.id ? client : item)),
        activities: pushActivity(prev, 'client', 'Client updated', `${client.businessName} details were updated`),
      }));
    },
    [pushActivity],
  );

  const deleteClient = useCallback(
    (id: string) => {
      setState((prev) => {
        const client = prev.clients.find((item) => item.id === id);
        const projectIds = new Set(prev.projects.filter((p) => p.clientId === id).map((p) => p.id));
        const invoiceIds = new Set(prev.invoices.filter((i) => i.clientId === id).map((i) => i.id));
        return {
          ...prev,
          clients: prev.clients.filter((item) => item.id !== id),
          projects: prev.projects.filter((item) => item.clientId !== id),
          tasks: prev.tasks.filter((item) => item.clientId !== id && (!item.projectId || !projectIds.has(item.projectId))),
          workEntries: prev.workEntries.filter(
            (item) => item.clientId !== id && (!item.projectId || !projectIds.has(item.projectId)),
          ),
          invoices: prev.invoices.filter((item) => item.clientId !== id),
          payments: prev.payments.filter(
            (item) => item.clientId !== id && !invoiceIds.has(item.invoiceId),
          ),
          expenses: prev.expenses.filter((item) => item.clientId !== id),
          documents: prev.documents.filter((item) => item.clientId !== id),
          activities: pushActivity(
            prev,
            'client',
            'Client removed',
            client ? `${client.businessName} and related records were removed` : 'Client record removed',
          ),
        };
      });
    },
    [pushActivity],
  );

  const addProject = useCallback(
    (project: Project) => {
      setState((prev) => ({
        ...prev,
        projects: [project, ...prev.projects],
        activities: pushActivity(prev, 'project', 'Project created', `${project.name} (${project.code})`),
      }));
    },
    [pushActivity],
  );

  const updateProject = useCallback(
    (project: Project) => {
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((item) => (item.id === project.id ? project : item)),
        activities: pushActivity(prev, 'project', 'Project updated', `${project.name} — ${project.progress}% complete`),
      }));
    },
    [pushActivity],
  );

  const deleteProject = useCallback(
    (id: string) => {
      setState((prev) => {
        const project = prev.projects.find((item) => item.id === id);
        return {
          ...prev,
          projects: prev.projects.filter((item) => item.id !== id),
          tasks: prev.tasks.filter((item) => item.projectId !== id),
          workEntries: prev.workEntries.filter((item) => item.projectId !== id),
          invoices: prev.invoices.map((item) =>
            item.projectId === id ? { ...item, projectId: undefined } : item,
          ),
          expenses: prev.expenses.map((item) =>
            item.projectId === id ? { ...item, projectId: undefined } : item,
          ),
          documents: prev.documents.map((item) =>
            item.projectId === id ? { ...item, projectId: undefined } : item,
          ),
          activities: pushActivity(
            prev,
            'project',
            'Project removed',
            project ? project.name : 'Project removed',
          ),
        };
      });
    },
    [pushActivity],
  );

  const addTask = useCallback(
    (task: Task) => {
      setState((prev) => ({
        ...prev,
        tasks: [task, ...prev.tasks],
        activities: pushActivity(prev, 'task', 'Task created', `${task.id} · ${task.title}`),
      }));
    },
    [pushActivity],
  );

  const updateTask = useCallback(
    (task: Task) => {
      setState((prev) => {
        const previous = prev.tasks.find((item) => item.id === task.id);
        const statusChanged = previous && previous.status !== task.status;
        return {
          ...prev,
          tasks: prev.tasks.map((item) => (item.id === task.id ? task : item)),
          activities: statusChanged
            ? pushActivity(
                prev,
                'task',
                task.status === 'completed' ? 'Task completed' : 'Task status updated',
                `${task.id} moved to ${TASK_STATUS_LABEL[task.status]}`,
              )
            : pushActivity(prev, 'task', 'Task updated', `${task.id} · ${task.title}`),
        };
      });
    },
    [pushActivity],
  );

  const deleteTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const task = prev.tasks.find((item) => item.id === id);
        return {
          ...prev,
          tasks: prev.tasks.filter((item) => item.id !== id),
          activities: pushActivity(prev, 'task', 'Task deleted', task ? task.title : 'Task deleted'),
        };
      });
    },
    [pushActivity],
  );

  const addWork = useCallback(
    (entry: WorkEntry) => {
      setState((prev) => ({
        ...prev,
        workEntries: [entry, ...prev.workEntries],
        activities: pushActivity(
          prev,
          'work',
          'Work entry logged',
          `${entry.title} — ${formatDuration(workDuration(entry.startTime, entry.endTime))}`,
        ),
      }));
    },
    [pushActivity],
  );

  const updateWork = useCallback(
    (entry: WorkEntry) => {
      setState((prev) => ({
        ...prev,
        workEntries: prev.workEntries.map((item) => (item.id === entry.id ? entry : item)),
        activities: pushActivity(prev, 'work', 'Work entry updated', entry.title),
      }));
    },
    [pushActivity],
  );

  const deleteWork = useCallback(
    (id: string) => {
      setState((prev) => {
        const entry = prev.workEntries.find((item) => item.id === id);
        return {
          ...prev,
          workEntries: prev.workEntries.filter((item) => item.id !== id),
          activities: pushActivity(prev, 'work', 'Work entry removed', entry ? entry.title : 'Work entry removed'),
        };
      });
    },
    [pushActivity],
  );

  const addInvoice = useCallback(
    (invoice: Invoice) => {
      setState((prev) => {
        const client = prev.clients.find((item) => item.id === invoice.clientId);
        return {
          ...prev,
          invoices: [invoice, ...prev.invoices],
          activities: pushActivity(
            prev,
            'invoice',
            invoice.draft ? 'Invoice draft created' : 'Invoice created',
            `${invoice.id} · ${client?.businessName ?? 'Client'}`,
          ),
        };
      });
    },
    [pushActivity],
  );

  const updateInvoice = useCallback(
    (invoice: Invoice) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((item) => (item.id === invoice.id ? invoice : item)),
        activities: pushActivity(prev, 'invoice', 'Invoice updated', `${invoice.id} was updated`),
      }));
    },
    [pushActivity],
  );

  const deleteInvoice = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.filter((item) => item.id !== id),
        payments: prev.payments.filter((item) => item.invoiceId !== id),
        activities: pushActivity(prev, 'invoice', 'Invoice deleted', `${id} and its payments were removed`),
      }));
    },
    [pushActivity],
  );

  const buildInvoiceId = useCallback((current: AppState) => {
    const prefix = current.settings.invoice.prefix || 'INV';
    const year = new Date().getFullYear();
    const base = `${prefix}-${year}`;
    const used = new Set(current.invoices.map((item) => item.id));
    let n = 1;
    while (used.has(`${base}-${String(n).padStart(3, '0')}`)) n += 1;
    return `${base}-${String(n).padStart(3, '0')}`;
  }, []);

  const getNextInvoiceId = useCallback(() => buildInvoiceId(state), [buildInvoiceId, state]);

  const duplicateInvoice = useCallback(
    (id: string) => {
      setState((prev) => {
        const original = prev.invoices.find((item) => item.id === id);
        if (!original) return prev;
        const copy: Invoice = {
          ...original,
          id: buildInvoiceId(prev),
          draft: true,
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
          items: original.items.map((item) => ({ ...item, id: uid('itm') })),
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          invoices: [copy, ...prev.invoices],
          activities: pushActivity(prev, 'invoice', 'Invoice duplicated', `${original.id} → ${copy.id}`),
        };
      });
    },
    [buildInvoiceId, pushActivity],
  );

  const addPayment = useCallback(
    (payment: Payment) => {
      setState((prev) => {
        const client = prev.clients.find((item) => item.id === payment.clientId);
        return {
          ...prev,
          payments: [payment, ...prev.payments],
          activities: pushActivity(
            prev,
            'payment',
            payment.type === 'Refund' ? 'Refund recorded' : 'Payment received',
            `${formatMoney(payment.amount)} ${payment.type === 'Refund' ? 'to' : 'from'} ${
              client?.businessName ?? 'client'
            } for ${payment.invoiceId}`,
          ),
        };
      });
    },
    [pushActivity],
  );

  const deletePayment = useCallback(
    (id: string) => {
      setState((prev) => {
        const payment = prev.payments.find((item) => item.id === id);
        return {
          ...prev,
          payments: prev.payments.filter((item) => item.id !== id),
          activities: pushActivity(
            prev,
            'payment',
            'Payment removed',
            payment ? `${payment.reference || payment.id} · ${formatMoney(payment.amount)}` : 'Payment removed',
          ),
        };
      });
    },
    [pushActivity],
  );

  const addExpense = useCallback(
    (expense: Expense) => {
      setState((prev) => ({
        ...prev,
        expenses: [expense, ...prev.expenses],
        activities: pushActivity(
          prev,
          'expense',
          'Expense recorded',
          `${expense.name} A� ${formatMoney(expense.amount)}`,
        ),
      }));
    },
    [pushActivity],
  );

  const updateExpense = useCallback(
    (expense: Expense) => {
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.map((item) => (item.id === expense.id ? expense : item)),
        activities: pushActivity(prev, 'expense', 'Expense updated', expense.name),
      }));
    },
    [pushActivity],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setState((prev) => {
        const expense = prev.expenses.find((item) => item.id === id);
        return {
          ...prev,
          expenses: prev.expenses.filter((item) => item.id !== id),
          activities: pushActivity(prev, 'expense', 'Expense deleted', expense ? expense.name : 'Expense deleted'),
        };
      });
    },
    [pushActivity],
  );

  const addDocuments = useCallback(
    (documents: AppDocument[]) => {
      if (!documents.length) return;
      setState((prev) => ({
        ...prev,
        documents: [...documents, ...prev.documents],
        activities: pushActivity(
          prev,
          'document',
          documents.length > 1 ? 'Documents uploaded' : 'Document uploaded',
          documents.map((doc) => doc.name).join(', '),
        ),
      }));
    },
    [pushActivity],
  );

  const renameDocument = useCallback(
    (id: string, name: string) => {
      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((doc) => (doc.id === id ? { ...doc, name } : doc)),
        activities: pushActivity(prev, 'document', 'Document renamed', name),
      }));
    },
    [pushActivity],
  );

  const deleteDocument = useCallback(
    (id: string) => {
      setState((prev) => {
        const doc = prev.documents.find((item) => item.id === id);
        return {
          ...prev,
          documents: prev.documents.filter((item) => item.id !== id),
          activities: pushActivity(prev, 'document', 'Document deleted', doc ? doc.name : 'Document deleted'),
        };
      });
    },
    [pushActivity],
  );

  const updateSettings = useCallback(
    (patch: SettingsPatch) => {
      setState((prev) => {
        const nextSettings: Settings = {
          ...prev.settings,
          ...patch,
          profile: { ...prev.settings.profile, ...(patch.profile ?? {}) },
          invoice: { ...prev.settings.invoice, ...(patch.invoice ?? {}) },
          preferences: { ...prev.settings.preferences, ...(patch.preferences ?? {}) },
        };
        return { ...prev, settings: nextSettings };
      });
    },
    [],
  );

  const logActivity = useCallback(
    (type: AppState['activities'][number]['type'], message: string, detail: string) => {
      setState((prev) => ({
        ...prev,
        activities: pushActivity(prev, type, message, detail),
      }));
    },
    [pushActivity],
  );

  const resetData = useCallback(() => {
    const seed = createSeedData();
    setState({
      ...seed,
      activities: [
        {
          id: uid('ACT'),
          type: 'system',
          message: 'Workspace reset',
          detail: 'Demo workspace data has been restored.',
          date: new Date().toISOString(),
        },
        ...seed.activities,
      ],
    });
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      state,
      isLoading,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
      addWork,
      updateWork,
      deleteWork,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      duplicateInvoice,
      addPayment,
      deletePayment,
      addExpense,
      updateExpense,
      deleteExpense,
      addDocuments,
      renameDocument,
      deleteDocument,
      updateSettings,
      logActivity,
      getNextInvoiceId,
      resetData,
    }),
    [
      state,
      isLoading,
      addClient,
      updateClient,
      deleteClient,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
      addWork,
      updateWork,
      deleteWork,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      duplicateInvoice,
      addPayment,
      deletePayment,
      addExpense,
      updateExpense,
      deleteExpense,
      addDocuments,
      renameDocument,
      deleteDocument,
      updateSettings,
      logActivity,
      getNextInvoiceId,
      resetData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}
