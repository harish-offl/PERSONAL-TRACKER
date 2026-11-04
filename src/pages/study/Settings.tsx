import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, User, Bell, Clock3, Archive, LogOut } from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Panel, SectionHead } from '../../components/study/shared';
import { Button, Field, Input, Select, ConfirmDialog, useToast } from '../../components/ui';

export function StudySettingsPage() {
  const { state, updateSettings } = useStudyData();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, goals, theme, reminders } = state.settings;

  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    workspace: profile.workspace,
    bio: profile.bio,
    dailyHours: goals.dailyHours,
    weeklyHours: goals.weeklyHours,
    monthlyHours: goals.monthlyHours,
    theme,
    reminders,
  });
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSave = useCallback(() => {
    setSaving(true);
    updateSettings({
      profile: { name: form.name, email: form.email, workspace: form.workspace, bio: form.bio },
      goals: { dailyHours: form.dailyHours, weeklyHours: form.weeklyHours, monthlyHours: form.monthlyHours },
      theme: form.theme,
      reminders: form.reminders,
    });
    setTimeout(() => { setSaving(false); toast('Settings saved', 'success'); }, 400);
  }, [form, updateSettings, toast]);

  function handleSignOut() {
    setSigningOut(true);
    logout('study');
    setTimeout(() => { setSigningOut(false); navigate('/study/login', { replace: true }); }, 400);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Study"
        title="Settings"
        description="Goals, profile and preferences for your study space."
      />

      <Panel>
        <SectionHead title="Profile" subtitle="Your study space identity." />
        <div className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Workspace">
            <Input value={form.workspace} onChange={(e) => setForm({ ...form, workspace: e.target.value })} />
          </Field>
          <Field label="Bio">
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full min-h-[96px] resize-y border-line bg-card text-[13px] text-ink px-3 py-2 rounded-lg outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/15" />
          </Field>
        </div>
      </Panel>

      <Panel>
        <SectionHead title="Study goals" subtitle="Set targets to stay consistent." />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Daily hours (h)">
            <Input type="number" value={String(form.dailyHours)} onChange={(e) => setForm({ ...form, dailyHours: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Weekly hours (h)">
            <Input type="number" value={String(form.weeklyHours)} onChange={(e) => setForm({ ...form, weeklyHours: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Monthly hours (h)">
            <Input type="number" value={String(form.monthlyHours)} onChange={(e) => setForm({ ...form, monthlyHours: Number(e.target.value) || 0 })} />
          </Field>
        </div>
      </Panel>

      <Panel>
        <SectionHead title="Preferences" subtitle="Appearance and reminders." />
        <div className="space-y-4">
          <Field label="Theme">
            <Select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as 'light' | 'dark' })}>
              <option value="light">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" /> Light
                </div>
              </option>
              <option value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" /> Dark
                </div>
              </option>
            </Select>
          </Field>
          <Field label>
            <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-ink">
              <input type="checkbox" checked={form.reminders} onChange={(e) => setForm({ ...form, reminders: e.target.checked })} className="h-3.5 w-3.5 rounded border-line accent-[var(--accent)]" />
              Enable study reminders
            </label>
          </Field>
        </div>
      </Panel>

      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" size="sm" disabled={saving} onClick={handleSave} loading={saving}>
          Save settings
        </Button>
        <div className="flex items-center gap-2">
          <ConfirmDialog
            open={signingOut}
            onClose={() => setSigningOut(false)}
            onConfirm={handleSignOut}
            title="Sign out of Study"
            description="You will be returned to the study login page."
            confirmLabel="Sign out"
            loading={false}
          />
          <Button variant="danger" size="sm" onClick={() => setSigningOut(true)} disabled={signingOut} loading={signingOut}>
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
