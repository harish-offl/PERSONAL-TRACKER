import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  Database,
  Download,
  FileText,
  Lock,
  Mail,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  User,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { Settings } from '../types';
import { cn, downloadJSON, formatMoney } from '../lib/utils';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionCard } from '../components/shared/cards';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Field,
  Input,
  Select,
  Tabs,
  Textarea,
  useToast,
} from '../components/ui';

type SettingsTab = 'profile' | 'invoice' | 'preferences' | 'security';

const TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
];

const CURRENCIES: { value: Settings['preferences']['currency']; label: string }[] = [
  { value: 'INR', label: 'INR — Indian Rupee (₹)' },
  { value: 'USD', label: 'USD — US Dollar ($)' },
  { value: 'EUR', label: 'EUR — Euro (€)' },
];

const DATE_FORMATS: { value: Settings['preferences']['dateFormat']; label: string }[] = [
  { value: 'MMM d, yyyy', label: 'Aug 12, 2026' },
  { value: 'dd/MM/yyyy', label: '12/08/2026' },
  { value: 'MM/dd/yyyy', label: '08/12/2026' },
];

export function SettingsPage() {
  const { state, updateSettings, resetData } = useAppData();
  const { toast } = useToast();
  const [tab, setTab] = useState<SettingsTab>('profile');

  const tabs = [
    { value: 'profile' as const, label: 'Profile', icon: User },
    { value: 'invoice' as const, label: 'Invoicing', icon: FileText },
    { value: 'preferences' as const, label: 'Preferences', icon: SlidersHorizontal },
    { value: 'security' as const, label: 'Security', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Manage your profile, invoicing details, and workspace preferences."
        badge={<Badge tone="green">Stored locally</Badge>}
      />

      <Tabs value={tab} onChange={setTab} options={tabs} />

      <div className="max-w-[1040px]">
        {tab === 'profile' && <ProfileSettings />}
        {tab === 'invoice' && <InvoiceSettings />}
        {tab === 'preferences' && <PreferenceSettings />}
        {tab === 'security' && (
          <SecuritySettings
            onReset={() => {
              resetData();
              toast({ title: 'Workspace restored', description: 'Demo data has been reset to its original state.' });
            }}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

function ProfileSettings() {
  const { state, updateSettings } = useAppData();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...state.settings.profile });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const completedTasks = state.tasks.filter((task) => task.status === 'completed').length;

  const save = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Add your name.';
    if (!form.email.trim()) nextErrors.email = 'Add your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!form.workspace.trim()) nextErrors.workspace = 'Give your workspace a name.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    updateSettings({
      profile: {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        workspace: form.workspace.trim(),
        role: form.role.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
      },
    });
    toast({ title: 'Profile saved', description: 'Your personal details have been updated.' });
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <SectionCard
          title="Personal information"
          description="Used across your workspace and documents."
          icon={User}
          action={<Badge tone="gray">Private</Badge>}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" required error={errors.name}>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" />
            </Field>
            <Field label="Email address" required error={errors.email}>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
            </Field>
            <Field label="Phone number">
              <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Role">
              <Input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="Independent designer" />
            </Field>
            <Field label="Workspace name" required error={errors.workspace} className="sm:col-span-2">
              <Input value={form.workspace} onChange={(event) => setForm({ ...form, workspace: event.target.value })} placeholder="Personal Workspace" />
            </Field>
            <Field label="Short bio" className="sm:col-span-2" hint="Shown on invoices and documents where relevant.">
              <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="A little about you and your work…" />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line-soft pt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setForm({ ...state.settings.profile });
                setErrors({});
              }}
            >
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={save}>
              Save changes
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Contact verification" description="How clients reach you" icon={Mail}>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-line bg-secondary/30 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-card text-muted">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-medium text-ink">{state.settings.profile.email}</p>
                  <p className="text-[9.5px] text-muted">Primary email</p>
                </div>
              </div>
              <Badge tone="green" dot>Verified</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line bg-secondary/30 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-card text-muted">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-medium text-ink">{state.settings.profile.workspace}</p>
                  <p className="text-[9.5px] text-muted">Personal workspace</p>
                </div>
              </div>
              <Badge tone="gray">Local</Badge>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <SectionCard title="Profile preview" description="How you appear in the app" icon={User}>
          <div className="flex flex-col items-center py-2 text-center">
            <Avatar name={state.settings.profile.name} size="xl" />
            <p className="mt-3 text-[14px] font-semibold tracking-[-0.02em] text-ink">{form.name || 'Your name'}</p>
            <p className="text-[11px] text-muted">{form.role || 'Your role'}</p>
            <p className="mt-2 text-[10px] text-soft">{form.email || 'you@example.com'}</p>
            <p className="mt-0.5 text-[10px] text-muted">{form.workspace || 'Workspace'}</p>
            {form.bio && <p className="mt-3 max-w-[240px] text-[10.5px] leading-relaxed text-muted">{form.bio}</p>}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line-soft pt-3 text-center">
            <div>
              <p className="text-[13px] font-semibold text-ink">{state.clients.length}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted">Clients</p>
            </div>
            <div className="border-x border-line-soft">
              <p className="text-[13px] font-semibold text-ink">{state.projects.length}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted">Projects</p>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-ink">{completedTasks}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted">Done</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Your data" description="Everything stays on this device" icon={Database}>
          <p className="text-[10.5px] leading-relaxed text-muted">
            Your workspace is saved in local storage. Nothing is uploaded to a server, and clearing site data removes it.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-secondary/30 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <div>
              <p className="text-[10.5px] font-medium text-ink">Local-first storage</p>
              <p className="text-[9px] text-muted">No account required</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Invoicing                                                                  */
/* -------------------------------------------------------------------------- */

function InvoiceSettings() {
  const { state, updateSettings, getNextInvoiceId } = useAppData();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...state.settings.invoice });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nextInvoiceId = getNextInvoiceId();

  const save = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.businessName.trim()) nextErrors.businessName = 'Add the business name shown on invoices.';
    if (!form.prefix.trim()) nextErrors.prefix = 'Add an invoice prefix.';
    if (Number(form.defaultTax) < 0 || Number(form.defaultTax) > 100) nextErrors.defaultTax = 'Tax must be between 0 and 100.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    updateSettings({
      invoice: {
        ...form,
        businessName: form.businessName.trim(),
        gstin: form.gstin.trim(),
        prefix: form.prefix.trim().toUpperCase(),
        defaultTax: Number(form.defaultTax) || 0,
        paymentTerms: form.paymentTerms.trim(),
        bankDetails: form.bankDetails.trim(),
        notes: form.notes.trim(),
      },
    });
    toast({ title: 'Invoice settings saved', description: 'New invoices will use these details.' });
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <SectionCard
        title="Invoice details"
        description="Appears on every invoice you create."
        icon={FileText}
        className="xl:col-span-2"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Business name" required error={errors.businessName} className="sm:col-span-2">
            <Input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} placeholder="Your studio or business" />
          </Field>
          <Field label="GSTIN / Tax ID">
            <Input value={form.gstin} onChange={(event) => setForm({ ...form, gstin: event.target.value })} placeholder="29ABCDE1234F1Z5" />
          </Field>
          <Field label="Invoice prefix" required error={errors.prefix} hint={`Next: ${nextInvoiceId}`}>
            <Input
              value={form.prefix}
              onChange={(event) => setForm({ ...form, prefix: event.target.value.toUpperCase() })}
              placeholder="INV"
            />
          </Field>
          <Field label="Default tax rate (%)" error={errors.defaultTax}>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={form.defaultTax}
              onChange={(event) => setForm({ ...form, defaultTax: Number(event.target.value) })}
            />
          </Field>
          <Field label="Default payment terms">
            <Input value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })} placeholder="Net 15" />
          </Field>
          <Field label="Bank details" className="sm:col-span-2" hint="Account number, IFSC, UPI ID, etc.">
            <Textarea value={form.bankDetails} onChange={(event) => setForm({ ...form, bankDetails: event.target.value })} placeholder="Bank name · Account · IFSC" />
          </Field>
          <Field label="Invoice footer note" className="sm:col-span-2">
            <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Thank you for your business." />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line-soft pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setForm({ ...state.settings.invoice });
              setErrors({});
            }}
          >
            Reset
          </Button>
          <Button variant="primary" size="sm" onClick={save}>
            Save invoice settings
          </Button>
        </div>
      </SectionCard>

      <div className="space-y-4">
        <SectionCard title="Invoice preview" description="Branding used on PDFs" icon={FileText}>
          <div className="rounded-lg border border-line bg-white p-4 text-[#080808] shadow-card">
            <div className="flex items-start justify-between gap-2 border-b border-[#EAEAEA] pb-3">
              <div>
                <p className="text-[10.5px] font-semibold">{form.businessName || 'Your business'}</p>
                <p className="text-[8.5px] text-[#666666]">{state.settings.profile.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[7.5px] font-semibold uppercase tracking-wide text-[#858585]">Invoice</p>
                <p className="font-mono text-[8.5px] text-[#666666]">{nextInvoiceId}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-[8.5px]">
              <div className="flex justify-between text-[#666666]"><span>Consulting services</span><span>{formatMoney(50000)}</span></div>
              <div className="flex justify-between text-[#666666]"><span>Tax ({form.defaultTax || 0}%)</span><span>{formatMoney((50000 * (Number(form.defaultTax) || 0)) / 100)}</span></div>
              <div className="flex justify-between border-t border-[#EAEAEA] pt-1.5 text-[9.5px] font-semibold">
                <span>Total</span>
                <span>{formatMoney(50000 + (50000 * (Number(form.defaultTax) || 0)) / 100)}</span>
              </div>
            </div>
            <p className="mt-3 border-t border-[#EAEAEA] pt-2 text-[8px] leading-relaxed text-[#666666]">
              {form.notes || 'Thank you for your business.'}
            </p>
          </div>
          <p className="mt-2 text-center text-[9.5px] text-muted">Updates as you edit</p>
        </SectionCard>

        <SectionCard title="Numbering" description="How invoice IDs are generated" icon={FileText}>
          <div className="rounded-lg border border-line bg-secondary/40 p-3">
            <p className="text-[9.5px] uppercase tracking-wide text-muted">Next invoice number</p>
            <p className="mt-1 font-mono text-[13px] font-semibold text-ink">{nextInvoiceId}</p>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Format: <span className="font-mono text-soft">{form.prefix || 'INV'}-{new Date().getFullYear()}-XXX</span>
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Preferences                                                                */
/* -------------------------------------------------------------------------- */

function PreferenceSettings() {
  const { state, updateSettings } = useAppData();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...state.settings.preferences });

  const currentTheme = state.settings.theme;

  const save = () => {
    updateSettings({ preferences: form });
    toast({ title: 'Preferences saved', description: 'Currency, dates, and timezone have been updated.' });
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <SectionCard
        title="Regional preferences"
        description="Formatting used across the workspace."
        icon={SlidersHorizontal}
        className="xl:col-span-2"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Currency">
            <Select
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value as typeof form.currency })}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.value} value={currency.value}>{currency.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Timezone">
            <Select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })}>
              {TIMEZONES.map((timezone) => (
                <option key={timezone} value={timezone}>{timezone}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date format" className="sm:col-span-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {DATE_FORMATS.map((format) => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => setForm({ ...form, dateFormat: format.value })}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left transition-colors',
                    form.dateFormat === format.value
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-card hover:bg-secondary/60',
                  )}
                >
                  <span className="block text-[11px] font-medium text-ink">{format.label}</span>
                  <span className="mt-0.5 block font-mono text-[9px] text-muted">{format.value}</span>
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-4">
          <p className="text-[10px] text-muted">Applies to tables, invoices, and reports.</p>
          <Button variant="primary" size="sm" onClick={save}>
            Save preferences
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Appearance" description="Choose your workspace theme" icon={Palette}>
        <div className="space-y-2">
          {[
            { value: 'light' as const, label: 'Light', description: 'Warm, paper-like surfaces', icon: Sun },
            { value: 'dark' as const, label: 'Dark', description: 'Low-glare charcoal canvas', icon: Moon },
          ].map((theme) => {
            const active = currentTheme === theme.value;
            const Icon = theme.icon;
            return (
              <button
                key={theme.value}
                type="button"
                onClick={() => updateSettings({ theme: theme.value })}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                  active ? 'border-accent bg-accent-soft' : 'border-line bg-card hover:bg-secondary/60',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border',
                    active ? 'border-accent/30 bg-card text-accent-strong' : 'border-line bg-secondary text-muted',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-medium text-ink">{theme.label}</span>
                  <span className="block text-[9.5px] text-muted">{theme.description}</span>
                </span>
                {active && <Check className="h-4 w-4 text-accent-strong" />}
              </button>
            );
          })}
        </div>
        <div className="mt-3 rounded-lg border border-line bg-secondary/40 p-2.5">
          <div className="rounded-md border border-line bg-card p-2 shadow-card">
            <div className="flex gap-1.5">
              <span className="h-8 w-8 rounded bg-secondary" />
              <div className="flex-1 space-y-1.5 py-0.5">
                <span className="block h-1.5 w-2/3 rounded-full bg-line" />
                <span className="block h-1.5 w-1/2 rounded-full bg-line-soft" />
              </div>
              <span className="h-3 w-6 rounded bg-accent/70" />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Security                                                                   */
/* -------------------------------------------------------------------------- */

function SecuritySettings({ onReset }: { onReset: () => void }) {
  const { state, updateSettings } = useAppData();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetOpen, setResetOpen] = useState(false);

  const twoFactor = state.settings.twoFactor;

  const passwordStrength = useMemo(() => {
    const value = passwords.next;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }, [passwords.next]);

  const savePassword = () => {
    const nextErrors: Record<string, string> = {};
    if (!passwords.current) nextErrors.current = 'Enter your current password.';
    if (!passwords.next) nextErrors.next = 'Enter a new password.';
    else if (passwords.next.length < 8) nextErrors.next = 'Use at least 8 characters.';
    if (passwords.next !== passwords.confirm) nextErrors.confirm = 'Passwords do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setPasswords({ current: '', next: '', confirm: '' });
    toast({ title: 'Password updated', description: 'This is a local demo — no password is stored.' });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Account security" description="Protect access to this workspace" icon={ShieldCheck}>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-card text-muted">
              <Lock className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[11.5px] font-medium text-ink">Two-factor authentication</p>
              <p className="mt-0.5 max-w-md text-[10px] leading-relaxed text-muted">
                Require a one-time code in addition to your password when signing in on a new device.
              </p>
            </div>
          </div>
          <Toggle
            checked={twoFactor}
            onChange={(value) => {
              updateSettings({ twoFactor: value });
              toast({
                title: value ? 'Two-factor enabled' : 'Two-factor disabled',
                description: value ? 'Your workspace now requires a one-time code.' : 'Password-only sign-in is active.',
              });
            }}
            label="Toggle two-factor authentication"
          />
        </div>
        {twoFactor && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[10px] text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Two-factor authentication is active for this workspace.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Change password" description="Use a strong, unique password" icon={Lock}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Current password" error={errors.current}>
            <Input type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} placeholder="••••••••" />
          </Field>
          <Field label="New password" error={errors.next}>
            <Input type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} placeholder="••••••••" />
          </Field>
          <Field label="Confirm password" error={errors.confirm}>
            <Input type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} placeholder="••••••••" />
          </Field>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={cn(
                  'h-1.5 w-8 rounded-full transition-colors',
                  passwordStrength >= step
                    ? passwordStrength <= 2
                      ? 'bg-warning'
                      : 'bg-success'
                    : 'bg-line',
                )}
              />
            ))}
            <span className="ml-1 text-[9.5px] text-muted">
              {passwords.next ? (passwordStrength <= 2 ? 'Weak' : passwordStrength === 3 ? 'Good' : 'Strong') : 'Password strength'}
            </span>
          </div>
          <Button variant="primary" size="sm" onClick={savePassword}>
            Update password
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Data & privacy" description="Export or reset your local workspace" icon={Database}>
        <div className="space-y-2">
          <div className="flex flex-col gap-2 rounded-lg border border-line bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11.5px] font-medium text-ink">Export workspace data</p>
              <p className="mt-0.5 text-[10px] text-muted">Download a JSON backup of clients, projects, invoices, and every other record.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadJSON('personal-tracker-backup.json', state);
                toast({ title: 'Backup downloaded', description: 'personal-tracker-backup.json' });
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </Button>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-danger/25 bg-danger/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-danger/25 bg-card text-danger">
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[11.5px] font-medium text-ink">Reset demo workspace</p>
                <p className="mt-0.5 max-w-lg text-[10px] leading-relaxed text-muted">
                  Removes every change you have made and restores the original sample clients, projects, invoices, and payments.
                </p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset data
            </Button>
          </div>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          onReset();
        }}
        title="Reset the entire workspace?"
        description="All local changes will be lost and the original demo data will be restored. This cannot be undone."
        confirmLabel="Reset workspace"
        tone="danger"
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35',
        checked ? 'border-accent bg-accent' : 'border-line bg-line-soft',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  );
}
