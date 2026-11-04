import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Check,
  ChevronDown,
  Circle,
  FileText,
  FolderKanban,
  HelpCircle,
  Keyboard,
  LifeBuoy,
  Mail,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionCard } from '../components/shared/cards';
import {
  Badge,
  Button,
  Field,
  Input,
  Kbd,
  Progress,
  Select,
  Textarea,
  useToast,
} from '../components/ui';

const ONBOARDING_KEY = 'personal-tracker:onboarding';

interface Guide {
  id: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  to: string;
  tone: string;
  keywords: string;
}

const GUIDES: Guide[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'Set up your profile, workspace, and first client in a few minutes.',
    icon: Sparkles,
    to: '/work/settings',
    tone: 'bg-accent-soft text-accent-strong border-accent/20',
    keywords: 'start setup begin onboarding profile workspace',
  },
  {
    id: 'invoices',
    title: 'Creating invoices',
    description: 'Line items, tax, discounts, PDF downloads, and payment tracking.',
    icon: FileText,
    to: '/work/invoices',
    tone: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
    keywords: 'invoice billing tax pdf payment client bill',
  },
  {
    id: 'projects',
    title: 'Project workflow',
    description: 'Plan projects, move tasks across the board, and log your hours.',
    icon: FolderKanban,
    to: '/work/projects',
    tone: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25',
    keywords: 'project tasks kanban board workflow timeline',
  },
  {
    id: 'payments',
    title: 'Tracking payments',
    description: 'Record partial payments, issue refunds, and keep balances accurate.',
    icon: Wallet,
    to: '/work/payments',
    tone: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/25',
    keywords: 'payments refunds balance received outstanding upi',
  },
];

interface Faq {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

const FAQS: Faq[] = [
  {
    id: 'faq-data',
    question: 'Where is my data stored?',
    answer:
      'Everything lives in your browser using local storage. Your clients, projects, invoices, payments, and settings never leave this device. Clearing your browser site data will remove the workspace, so export a JSON backup from Settings â†’ Security if you want a copy.',
    topic: 'Data',
  },
  {
    id: 'faq-invoice-status',
    question: 'How is an invoice status calculated?',
    answer:
      'Drafts stay as Draft until you send them. Once issued, an invoice becomes Paid when recorded payments (minus refunds) cover the total. If it is past its due date and still has a balance it shows Overdue, a partial balance shows Partially Paid, and otherwise it stays Sent.',
    topic: 'Invoicing',
  },
  {
    id: 'faq-payments',
    question: 'Can I record a partial payment or a refund?',
    answer:
      'Yes. Open Payments and choose Record Payment, then switch the type to Payment or Refund. Payments are validated against the remaining balance, while refunds cannot exceed the amount already received for that invoice.',
    topic: 'Payments',
  },
  {
    id: 'faq-documents',
    question: 'Are uploaded files stored permanently?',
    answer:
      'This demo stores document metadata â€” name, category, size, and links â€” in your local workspace. The upload flow simulates progress and storage usage so you can see how the library behaves without sending files anywhere.',
    topic: 'Documents',
  },
  {
    id: 'faq-theme',
    question: 'How do I switch between light and dark mode?',
    answer:
      'Use the sun or moon button in the header, or open Settings â†’ Preferences â†’ Appearance. Your preference is saved with the rest of your workspace settings.',
    topic: 'Workspace',
  },
  {
    id: 'faq-shortcuts',
    question: 'What keyboard shortcuts are available?',
    answer:
      'Press / to focus global search, N to open the primary action for the current page, G then D to jump to the dashboard, and Esc to close dialogs, drawers, and search.',
    topic: 'Workspace',
  },
  {
    id: 'faq-invoice-number',
    question: 'Can I change the invoice number format?',
    answer:
      'Yes. In Settings â†’ Invoicing you can set the invoice prefix and see the next generated number. New invoices use the prefix you choose, followed by the year and a padded sequence.',
    topic: 'Invoicing',
  },
];

interface OnboardingItem {
  id: string;
  label: string;
  description: string;
  to: string;
  done: boolean;
}

const DEFAULT_STEPS: OnboardingItem[] = [
  { id: 'profile', label: 'Complete your profile', description: 'Add your name, role, and workspace details.', to: '/work/settings', done: false },
  { id: 'client', label: 'Add your first client', description: 'Create a client with contact and business details.', to: '/work/clients?create=1', done: false },
  { id: 'project', label: 'Create a project', description: 'Give the work a scope, timeline, and value.', to: '/work/projects?create=1', done: false },
  { id: 'invoice', label: 'Send an invoice', description: 'Build line items and share a polished PDF.', to: '/work/invoices?create=1', done: false },
  { id: 'work', label: 'Log a work entry', description: 'Track time and what you completed today.', to: '/work/daily-work?create=1', done: false },
];

function loadSteps(): OnboardingItem[] {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return DEFAULT_STEPS;
    const done = new Set<string>(JSON.parse(raw));
    return DEFAULT_STEPS.map((step) => ({ ...step, done: done.has(step.id) }));
  } catch {
    return DEFAULT_STEPS;
  }
}

export function HelpPage() {
  const { state } = useAppData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>('faq-data');
  const [steps, setSteps] = useState<OnboardingItem[]>(loadSteps);
  const [contact, setContact] = useState({
    name: state.settings.profile.name,
    email: state.settings.profile.email,
    topic: 'General question',
    message: '',
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        ONBOARDING_KEY,
        JSON.stringify(steps.filter((step) => step.done).map((step) => step.id)),
      );
    } catch {
      // Ignore storage failures; the checklist still works in memory.
    }
  }, [steps]);

  const query = search.trim().toLowerCase();

  const filteredGuides = useMemo(
    () =>
      GUIDES.filter(
        (guide) =>
          !query ||
          `${guide.title} ${guide.description} ${guide.keywords}`.toLowerCase().includes(query),
      ),
    [query],
  );

  const filteredFaqs = useMemo(
    () =>
      FAQS.filter(
        (faq) =>
          !query ||
          `${faq.question} ${faq.answer} ${faq.topic}`.toLowerCase().includes(query),
      ),
    [query],
  );

  const completed = steps.filter((step) => step.done).length;
  const completion = Math.round((completed / steps.length) * 100);

  const toggleStep = (id: string) => {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, done: !step.done } : step)),
    );
  };

  const submitContact = () => {
    const nextErrors: Record<string, string> = {};
    if (!contact.name.trim()) nextErrors.name = 'Add your name.';
    if (!contact.email.trim()) nextErrors.email = 'Add your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!contact.message.trim()) nextErrors.message = 'Tell us how we can help.';
    else if (contact.message.trim().length < 10) nextErrors.message = 'Please add a little more detail.';
    setContactErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setContact({ ...contact, message: '' });
      toast({ title: 'Message sent', description: 'Thanks! This demo simulated a support request.' });
    }, 600);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Help & Support"
        description="Guides, answers, and a direct line when you need a hand."
        badge={<Badge tone="gray">Personal Tracker</Badge>}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => document.getElementById('contact-support')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            Contact support
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
        <div className="relative bg-gradient-to-br from-[#F2F0FC] via-card to-card px-5 py-7 dark:from-accent/10 dark:via-card dark:to-card sm:px-7">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-soft px-2.5 py-1 text-[10px] font-medium text-accent-strong">
              <Sparkles className="h-3 w-3" />
              Knowledge base
            </span>
            <h2 className="mt-2.5 text-[19px] font-semibold tracking-[-0.03em] text-ink">
              How can we help you today?
            </h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-soft">
              Search guides and frequently asked questions, or jump straight to the right part of your workspace.
            </p>
            <div className="relative mt-4 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search help articles and FAQsâ€¦"
                className="h-10 w-full rounded-lg border border-line bg-card pl-9 pr-3 text-[12px] text-ink shadow-card outline-none transition placeholder:text-muted focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
              />
            </div>
            {query && (
              <p className="mt-2 text-[10px] text-muted">
                {filteredGuides.length + filteredFaqs.length} result
                {filteredGuides.length + filteredFaqs.length === 1 ? '' : 's'} for â€œ{search.trim()}â€
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">Popular guides</h2>
              <Badge tone="gray">{filteredGuides.length} guides</Badge>
            </div>
            {filteredGuides.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-secondary/40 px-5 py-8 text-center">
                <Search className="mx-auto h-5 w-5 text-muted" />
                <p className="mt-2 text-[11.5px] font-medium text-ink">No guides matched your search</p>
                <p className="mt-0.5 text-[10.5px] text-muted">Try a broader term like â€œinvoiceâ€ or â€œprojectâ€.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredGuides.map((guide) => {
                  const Icon = guide.icon;
                  return (
                    <Link
                      key={guide.id}
                      to={guide.to}
                      className="group rounded-xl border border-line bg-card p-4 shadow-card transition-all hover:border-line-soft hover:shadow-soft"
                    >
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', guide.tone)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="mt-2.5 text-[12px] font-semibold text-ink">{guide.title}</p>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">{guide.description}</p>
                      <p className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-medium text-accent-strong">
                        <BookOpen className="h-3 w-3" />
                        Open guide
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <SectionCard
            title="Frequently asked questions"
            description={query ? `Filtered by â€œ${search.trim()}â€` : 'Quick answers to common questions'}
            icon={HelpCircle}
            bodyClassName="p-0"
          >
            {filteredFaqs.length === 0 ? (
              <p className="px-4 py-10 text-center text-[11px] text-muted">
                No FAQs matched. Try searching for a different topic.
              </p>
            ) : (
              <div className="divide-y divide-line-soft">
                {filteredFaqs.map((faq) => {
                  const open = openFaq === faq.id;
                  return (
                    <div key={faq.id}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : faq.id)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/30"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 rounded-md border border-line bg-secondary px-1.5 py-0.5 text-[8.5px] font-medium uppercase tracking-wide text-muted">
                            {faq.topic}
                          </span>
                          <span className="text-[11.5px] font-medium text-ink">{faq.question}</span>
                        </span>
                        <ChevronDown
                          className={cn('h-3.5 w-3.5 shrink-0 text-muted transition-transform', open && 'rotate-180')}
                        />
                      </button>
                      {open && (
                        <div className="px-4 pb-3.5 pl-[72px]">
                          <p className="text-[10.5px] leading-relaxed text-soft">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Getting started" description="Your setup checklist" icon={Sparkles}>
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="text-muted">{completed} of {steps.length} complete</span>
              <span className="font-semibold text-ink">{completion}%</span>
            </div>
            <Progress value={completion} className="mt-2" tone={completion === 100 ? 'success' : 'accent'} />
            <div className="mt-3 space-y-1">
              {steps.map((step) => (
                <div key={step.id} className="flex items-start gap-2 rounded-lg px-1 py-1.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={step.done}
                    aria-label={`Mark ${step.label} as ${step.done ? 'incomplete' : 'complete'}`}
                    onClick={() => toggleStep(step.id)}
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                      step.done ? 'border-success bg-success text-white' : 'border-line text-transparent hover:border-accent',
                    )}
                  >
                    {step.done ? <Check className="h-2.5 w-2.5" /> : <Circle className="h-2 w-2" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={step.to}
                      className={cn(
                        'block text-[10.5px] font-medium transition-colors hover:text-accent-strong',
                        step.done ? 'text-muted line-through' : 'text-ink',
                      )}
                    >
                      {step.label}
                    </Link>
                    <p className="mt-0.5 text-[9px] leading-relaxed text-muted">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {completion === 100 && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 text-[9.5px] text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-400">
                <Check className="h-3.5 w-3.5" />
                You are all set â€” nice work!
              </div>
            )}
          </SectionCard>

          <SectionCard title="Keyboard shortcuts" description="Move faster around the app" icon={Keyboard}>
            <div className="space-y-2">
              {[
                { label: 'Global search', keys: ['/'] },
                { label: 'Primary action', keys: ['N'] },
                { label: 'Go to dashboard', keys: ['G', 'D'] },
                { label: 'Close dialog', keys: ['Esc'] },
              ].map((shortcut) => (
                <div key={shortcut.label} className="flex items-center justify-between">
                  <span className="text-[10.5px] text-soft">{shortcut.label}</span>
                  <span className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Still need a hand?" description="We usually reply within a day" icon={MessageSquare}>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 rounded-lg border border-line bg-secondary/30 p-2.5">
                <Mail className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-[10.5px] font-medium text-ink">Email support</p>
                  <p className="text-[9.5px] text-muted">hello@personaltracker.app</p>
                </div>
              </div>
              <p className="text-[10px] leading-relaxed text-muted">
                Include as much detail as you can â€” the page you were on, what you expected, and what happened instead.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => document.getElementById('contact-support')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                <Send className="h-3.5 w-3.5" />
                Send a message
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      <div id="contact-support" className="scroll-mt-20">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <SectionCard
            title="Contact support"
            description="Tell us what you need help with"
            icon={Send}
            className="xl:col-span-2"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Your name" required error={contactErrors.name}>
                <Input value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} placeholder="Your name" />
              </Field>
              <Field label="Email" required error={contactErrors.email}>
                <Input type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} placeholder="you@example.com" />
              </Field>
              <Field label="Topic" className="sm:col-span-2">
                <Select value={contact.topic} onChange={(event) => setContact({ ...contact, topic: event.target.value })}>
                  <option>General question</option>
                  <option>Invoicing & payments</option>
                  <option>Bug report</option>
                  <option>Feature request</option>
                  <option>Data & privacy</option>
                </Select>
              </Field>
              <Field label="How can we help?" required error={contactErrors.message} className="sm:col-span-2">
                <Textarea
                  value={contact.message}
                  onChange={(event) => setContact({ ...contact, message: event.target.value })}
                  placeholder="Share the details of your questionâ€¦"
                  className="min-h-[110px]"
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-4">
              <p className="text-[9.5px] text-muted">This demo simulates a support request â€” nothing is transmitted.</p>
              <Button variant="primary" size="sm" loading={sending} onClick={submitContact}>
                <Send className="h-3.5 w-3.5" />
                Send message
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Support hours" description="When you can reach us" icon={LifeBuoy}>
            <dl className="space-y-2.5">
              <div className="flex items-center justify-between">
                <dt className="text-[10.5px] text-muted">Monday â€“ Friday</dt>
                <dd className="text-[10.5px] font-medium text-ink">9:00 â€“ 18:00 IST</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[10.5px] text-muted">Saturday</dt>
                <dd className="text-[10.5px] font-medium text-ink">10:00 â€“ 14:00 IST</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[10.5px] text-muted">Sunday</dt>
                <dd className="text-[10.5px] font-medium text-muted">Closed</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-secondary/30 p-2.5 text-[9.5px] leading-relaxed text-muted">
              <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Search the FAQs and guides first â€” most setup questions are answered there.
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

