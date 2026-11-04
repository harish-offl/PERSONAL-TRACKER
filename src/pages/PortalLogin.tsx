import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth, type Portal } from '../context/AuthContext';
import { Button, useToast } from '../components/ui';

const content = {
  work: {
    eyebrow: 'Work Studio',
    title: 'Welcome back to your work.',
    description:
      'A focused space for client delivery, project momentum and the financial health of your studio.',
    icon: BriefcaseBusiness,
    proofs: ['Client and project command center', 'Invoices, payments and expenses', 'Private, local-first workspace'],
    quote: 'Good work gets easier when the system around it disappears.',
    path: '/work/dashboard',
  },
  study: {
    eyebrow: 'Study Studio',
    title: 'Welcome back to your learning.',
    description:
      'A deliberate space for deep study, honest progress and the ideas you want to keep close.',
    icon: BookOpenText,
    proofs: ['Subjects and a realistic timetable', 'Focus timer and session history', 'Notes, resources and learning goals'],
    quote: 'Depth is built in quiet, repeated sessions.',
    path: '/study/dashboard',
  },
} as const;

export function PortalLoginPage({ portal }: { portal: Portal }) {
  const { login, demoCredentials, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const copy = content[portal];
  const Icon = copy.icon;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated(portal)) navigate(copy.path, { replace: true });
  }, [isAuthenticated, navigate, portal, copy.path]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await login(portal, email, password, remember);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? 'Unable to sign in. Please try again.');
      return;
    }
    toast({ title: `Welcome to ${copy.eyebrow}`, variant: 'success' });
    navigate(copy.path, { replace: true });
  }

  function useDemoAccess() {
    setEmail(demoCredentials[portal].email);
    setPassword(demoCredentials[portal].password);
    setError('');
  }

  return (
    <div className="grid min-h-screen bg-app text-ink lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#171717] px-10 py-9 text-white lg:flex lg:flex-col xl:px-14">
        <div className="pointer-events-none absolute -left-40 -top-56 h-[520px] w-[520px] rounded-full bg-[#6558D3]/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-56 -right-32 h-[480px] w-[480px] rounded-full bg-[#D97757]/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

        <div className="relative flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/10 text-white ring-1 ring-white/15">
              <span className="absolute inset-[3px] rounded-[7px] border border-white/15" />
              <Sparkles className="relative h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold tracking-[-0.01em]">Personal Tracker</p>
              <p className="text-[10px] text-white/45">Private workspace</p>
            </div>
          </Link>
          <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/55">
            {copy.eyebrow}
          </span>
        </div>

        <div className="relative my-auto max-w-lg py-16">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-white shadow-[0_12px_30px_-14px_rgba(0,0,0,0.8)]">
            <Icon className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <h1 className="mt-6 text-[40px] font-semibold leading-[1.08] tracking-[-0.055em] xl:text-[45px]">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-white/55">{copy.description}</p>

          <ul className="mt-8 space-y-3">
            {copy.proofs.map((proof) => (
              <li key={proof} className="flex items-center gap-2.5 text-[12px] text-white/70">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8578EF]/20 text-[#C8C1FF]">
                  <Check className="h-3 w-3" strokeWidth={2.7} />
                </span>
                {proof}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm">
          <p className="text-[13px] font-medium leading-relaxed text-white/75">“{copy.quote}”</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#8578EF] to-[#5649C0] text-[10px] font-semibold">
              A
            </span>
            <div>
              <p className="text-[10.5px] font-semibold text-white/80">Annamalai</p>
              <p className="text-[9.5px] text-white/40">Owner · Personal Tracker</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-10 xl:px-16">
        <div className="flex items-center justify-between lg:justify-end">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-soft transition hover:text-ink lg:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Portals
          </Link>
          <Link
            to="/"
            className="hidden items-center gap-1.5 text-[11px] font-medium text-muted transition hover:text-ink lg:inline-flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to portals
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-10">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#7C6FE0] to-[#5649C0] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold">Personal Tracker</p>
              <p className="text-[10px] text-muted">{copy.eyebrow}</p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-soft shadow-sm">
            <LockKeyhole className="h-2.5 w-2.5 text-accent" />
            Owner sign in
          </span>
          <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.05em]">Sign in</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-soft">
            Enter the owner credentials for your {copy.eyebrow.toLowerCase()}.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[11px] font-semibold text-soft">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@personal.workspace"
                  className="h-10 w-full rounded-lg border border-line bg-card pl-9 pr-3 text-[12px] text-ink shadow-card outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[11px] font-semibold text-soft">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-10 w-full rounded-lg border border-line bg-card pl-9 pr-10 text-[12px] text-ink shadow-card outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-secondary hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-soft">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-line accent-[var(--accent)]"
                />
                Remember me
              </label>
              <span className="text-[10px] text-muted">Private by design</span>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[11px] font-medium text-danger"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
              disabled={!email || !password || isSubmitting}
            >
              {isSubmitting ? 'Opening workspace' : `Continue to ${copy.eyebrow}`}
              {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-line bg-secondary/50 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted">
                Owner access
              </p>
              <button
                type="button"
                onClick={useDemoAccess}
                className="text-[10px] font-semibold text-accent-strong transition hover:text-accent"
              >
                Fill credentials
              </button>
            </div>
            <div className="mt-2 space-y-1 font-mono text-[10px] text-soft">
              <p className="truncate">{demoCredentials[portal].email}</p>
              <p>{demoCredentials[portal].password}</p>
            </div>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-muted">
            <ShieldCheck className="h-3 w-3" />
            Local-first authentication. No data leaves this browser.
          </p>
        </div>

        <p className="text-center text-[9.5px] text-muted">
          © {new Date().getFullYear()} Personal Tracker · Built for intentional work.
        </p>
      </main>
    </div>
  );
}
