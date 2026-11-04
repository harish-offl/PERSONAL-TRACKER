import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  BookOpenText,
  Timer,
  CalendarDays,
  Users,
  FileText,
  TrendingUp,
  Zap,
  Shield,
  ArrowRight,
  LayoutDashboard,
  FileCheck,
  Wand2,
  Star,
  Clock,
  Lock,
  GraduationCap,
  File,
  Monitor,
  Globe,
  Play,
  Rss,
} from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Wall of Love', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

const features = [
  {
    icon: BriefcaseBusiness,
    color: '#FF5636',
    tint: '#FFF0E9',
    title: 'Client & Work Management',
    description: 'Clients, projects, tasks, invoices, payments, expenses, documents, and reports — all in one independent portal.',
  },
  {
    icon: BookOpenText,
    color: '#8B4DE8',
    tint: '#F1EAFE',
    title: 'Study Management',
    description: 'Subjects, study timer, timetable, sessions, progress, notes, PDF library, and secure sharing.',
  },
  {
    icon: Shield,
    color: '#006879',
    tint: '#a9edff',
    title: 'Secure by Default',
    description: 'Owner-only authentication with row-level security. Private data never goes public unless you share it.',
  },
];

const pillars = [
  {
    num: '01',
    label: 'VELOCITY',
    color: '#FF5636',
    title: 'Frictionless Kanban & Sprint Governance',
    desc: 'Taskify-grade visual lanes, keyboard-driven navigation (⌘K), deadline heatmaps, and automated subtask rollover designed for high throughput without clutter.',
    stats: [
      { label: 'Sprint Velocity', value: '42 Pts / Week', sub: '100% on schedule' },
      { label: 'Subtask Completion', value: '88% Closed', sub: '' },
    ],
  },
  {
    num: '02',
    label: 'COGNITION',
    color: '#8B4DE8',
    title: 'Deep Focus Pod & Study Vault',
    desc: 'Integrated circular focus timers, binaural noise generator, curriculum progress tracking, and 256-bit encrypted PDF vaults with password-guarded sharing.',
    stats: [
      { label: 'Focus Timer', value: 'Pomodoro / Stopwatch', sub: '' },
      { label: 'Encrypted Vault', value: 'AES-256 Locked', sub: '' },
    ],
  },
  {
    num: '03',
    label: 'SOLVENCY',
    color: '#006879',
    title: 'Strict Dual-Ledger Invoicing',
    desc: 'Generate GST-compliant Indian Rupee client invoices in 3 clicks, reconcile UPI/IMPS deposits, and keep personal living expenses strictly quarantined from client billing.',
    stats: [
      { label: 'Invoicing', value: '3-click GST', sub: '' },
      { label: 'Encrypted Vault', value: 'AES-256 Locked', sub: '' },
    ],
  },
  {
    num: '04',
    label: 'PRIORITIZATION',
    color: '#009fb8',
    title: 'Eisenhower Matrix & Time Blocking',
    desc: 'Automatically categorize commitments into Urgent/Important quadrants. Seamless 2-way sync with Google Calendar and Apple iCal so your scheduled hours mirror your actual focus.',
    stats: [
      { label: 'Quadrants', value: 'Auto-categorized', sub: '' },
      { label: 'Calendar Sync', value: '2-way', sub: '' },
    ],
  },
];

const pricing = [
  {
    name: 'Free Starter',
    price: '₹0',
    period: '/month',
    badge: null,
    sub: 'Free forever for solo students',
    desc: 'Core personal sprint tracking and Pomodoro focus pod.',
    items: [
      'Up to 3 Kanban boards',
      'Unlimited Pomodoro focus sessions',
      '5 Encrypted study notes',
      'Local device storage',
    ],
    excluded: ['No GST/INR invoicing', 'No cloud sync'],
    cta: 'Get Started Free',
    variant: 'outline',
  },
  {
    name: 'Pro Solo Operator',
    price: '₹399',
    period: '/month billed annually',
    badge: 'Most Popular for Freelancers',
    sub: 'Save ₹1,200 annually',
    desc: 'Full multi-lane boards, unlimited Indian Rupee invoicing, and encrypted PDF vaults.',
    items: [
      'Unlimited Kanban boards & sprints',
      'Unlimited GST/INR client invoicing & UPI QR',
      '256-bit encrypted PDF Vault with sharing',
      'Multi-device instant end-to-end sync',
      'Eisenhower matrix & Google Calendar sync',
      'Priority email & Discord support',
    ],
    excluded: [],
    cta: 'Start 14-Day Free Pro Trial',
    variant: 'primary',
  },
  {
    name: 'Lifetime Sovereign',
    price: '₹4,999',
    period: 'one time',
    badge: null,
    sub: 'Pay once, own forever',
    desc: 'Zero recurring fees. Designed for privacy-first developers and lifers.',
    items: [
      'Everything in Pro Solo Forever',
      'Local-first offline export (JSON/Markdown)',
      'Self-host sync server option',
      'All future v3 & v4 upgrades included',
      'Priority roadmap feature voting badge',
    ],
    excluded: [],
    cta: 'Claim Lifetime Access',
    variant: 'orange',
  },
];

const testimonials = [
  {
    name: 'Arjun Deshmukh',
    role: 'Independent Fullstack Architect',
    stars: 5,
    quote: 'MySpace literally eliminated Notion, Toggl, and Freshbooks for my consultancy. Being able to track billable hours directly into a GST invoice in ₹ while my Pomodoro timer runs is mind-blowing.',
    sub: '+9 hrs/wk Saved',
    subColor: '#12B76A',
  },
  {
    name: 'Dr. Sneha Kulkarni',
    role: 'AI Researcher & Fellow',
    stars: 5,
    quote: 'The encrypted PDF Vault with password sharing is pure gold for my academic thesis reviews. Plus, having an Eisenhower matrix directly tied to actual timeblocks stopped my endless task procrastination.',
    sub: '2x Focus Output',
    subColor: '#8B4DE8',
  },
  {
    name: 'Rohan Verma',
    role: 'SaaS Founder & Designer',
    stars: 5,
    quote: 'I was hesitant because most all-in-one apps are slow and bloated. MySpace is lightning fast, feels native, and handles keyboard shortcuts like Sublime Text. I bought the Lifetime Sovereign plan immediately.',
    sub: 'Lifetime Member',
    subColor: '#009fb8',
  },
];

export function PortalsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8F8F7] text-[#151515] selection:bg-[#FF5636] selection:text-white font-['Plus_Jakarta_Sans']">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute top-0 left-1/4 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-[#FFF0E9]/35 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/4 right-1/4 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-[#F1EAFE]/35 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#ECFDF3]/30 blur-[100px]" />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-8 lg:py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF5636]">
            <BriefcaseBusiness className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold leading-tight tracking-tight text-[#151515]">
            Luminous<span className="text-[#FF5636]">Tracker</span>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#151515]">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className="hover:text-[#FF5636] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-[#151515] bg-white border border-[#EBEBEA] rounded-full hover:bg-[#F3F3F1] transition-colors shadow-sm">
            Sign in
          </button>
          <Link
            to="/work/login"
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#FF5636] rounded-full hover:bg-[#ef4524] transition-colors shadow-[0_8px_24px_rgba(255,86,54,0.25)]"
          >
            Get Started Free
          </Link>
          <button className="h-9 w-9 rounded-full border border-[#EBEBEA] bg-[#3a3a3a] text-white flex items-center justify-center shadow-sm">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#4a4a4a]">
              <div className="h-2 w-2 rounded-full bg-[#6b6b6b]" />
            </div>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-24 pb-32 px-6 lg:pt-40 lg:pb-40 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Hero Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0E9] text-[#FF5636] text-[11px] font-bold tracking-wider uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5636] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF5636]" />
                </span>
                MySpace 2.0 is Live
              </div>

              <h1 className="text-4xl font-bold leading-[3.5rem] tracking-[-0.03em] sm:text-5xl lg:text-6xl text-[#151515]">
                Master Your Daily Work, Finances &{' '}
                <span className="text-[#FF5636]">Deep Focus</span> in{' '}
                <span className="text-[#FF5636]">One Private OS.</span>
              </h1>

              <p className="text-lg leading-relaxed text-[#6E6E6C] max-w-xl">
                Stop juggling 5 fragmented subscriptions. Manage sprints, bill
                client invoices in ₹, conquer deep-work Pomodoros, and vault
                encrypted notes — engineered strictly for high-agency solos.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/work/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white bg-[#151515] rounded-full hover:bg-[#FF5636] transition-all shadow-[0_8px_24px_rgba(21,21,21,0.15)]"
                >
                  Try Now — Free Forever <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-[#151515] bg-white border border-[#EBEBEA] rounded-full hover:bg-[#F3F3F1] hover:shadow-sm transition-all">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#e5e5e5] bg-white mr-1.5">
                    <Play className="h-2.5 w-2.5" />
                  </span>
                  Explore Interactive Demo
                </button>
              </div>

              <div className="mt-8 flex items-center gap-6 text-xs font-medium text-[#6E6E6C]">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-[#FFB400]" fill="currentColor" />
                  <span className="font-bold">4.9/5</span>
                  <span>rating across 12,000+ indie founders, consultants &amp; researchers</span>
                </div>
              </div>
            </div>

            {/* Hero Visual - Dashboard preview */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-[#F3F3F1] rounded-[2xl] border border-[#EBEBEA]" />
              <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center rounded-[2xl]" />
              <div className="absolute inset-4 rounded-[2xl] border border-white/60 bg-white/60 backdrop-blur-md p-6 shadow-[0_20px_40px_rgba(21,21,21,0.08)]">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <StatMini icon={BriefcaseBusiness} label="Clients" value="0" color="#FF5636" />
                  <StatMini icon={BookOpenText} label="Subjects" value="0" color="#8B4DE8" />
                  <StatMini icon={Timer} label="Study Hours" value="0h" color="#006879" />
                  <StatMini icon={TrendingUp} label="Project Value" value="$0" color="#12B76A" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <CardMini title="In Flight" count="3" color="#FF5636" />
                  <CardMini title="Review & Verify" count="2" color="#8B4DE8" />
                  <CardMini title="Completed Today" count="5" color="#12B76A" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section id="features" className="relative z-20 py-24 px-6 lg:py-32 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FFF0E9] text-[#FF5636] text-[11px] font-bold tracking-wider uppercase mb-6">
              The Solo Dilemma
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl text-[#151515] mb-4">
              The 5-Subscription Chaos Ends Today
            </h2>
            <p className="text-lg text-[#6E6E6C] max-w-2xl mx-auto mb-12">
              High performers lose 11 hours each week copy-pasting data between
              disconnected productivity tools.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <ProblemCard
              title="The Fractured Workflow"
              sub="₹7,200/mo in fees"
              icon={Lightning}
              color="#ba1a1a"
              items={[
                { label: 'Context-Switching Fatigue', detail: 'Notion for docs, Toggl for pomodoros, QuickBooks for client GST invoices, Apple Notes for research.' },
                { label: 'Disjointed Finance Blindspots', detail: 'Personal and freelancing expenses get tangled. You never know true net profit after deductions.' },
                { label: 'Zero Data Privacy', detail: 'Proprietary study PDFs and intellectual notes harvested by mega-clouds to train centralized models.' },
              ]}
            />
            <SolutionCard
              title="The MySpace Sovereign OS"
              sub="1 Integration"
              icon={Zap}
              color="#8B4DE8"
              items={[
                { label: 'Unified Local-First Speed', detail: 'Sprints, time tracking, invoices, and documents live under one instant ⌘K interface with zero latency.' },
                { label: 'Strict Dual-Ledger Finances', detail: 'Auto-partition GST freelance retainers from household expenses. Issue clean PDF invoices in seconds.' },
                { label: 'End-to-End Encrypted Knowledge', detail: 'Your reading notes, research vaults, and client deliverables belong strictly to you on your machine.' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Four Pillars */}
      <section className="relative z-20 py-24 px-6 lg:py-32 lg:px-8 bg-[#F8F8F7]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#FFF0E9] text-[#FF5636] text-[11px] font-bold tracking-wider uppercase mb-4">
                Engineered for Autonomous Solos
              </span>
              <h2 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl text-[#151515]">
                Four Pillars of Sovereign Execution
              </h2>
              <p className="text-[#6E6E6C] mt-3">
                Everything high-agency operators need to manage projects, cashflows,
                and knowledge systematically.
              </p>
            </div>
            <div className="text-right hidden lg:block">
              <Link
                href="#pricing"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF5636] hover:underline"
              >
                View Pricing <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <PillarCard key={i} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-20 py-24 px-6 lg:py-32 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FFF0E9] text-[#FF5636] text-[11px] font-bold tracking-wider uppercase mb-6">
              Simple, Honest Pricing
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl text-[#151515] mb-4">
              Invest in Your Sovereign Workspace
            </h2>
            <p className="text-lg text-[#6E6E6C] max-w-2xl mx-auto mb-8">
              Transparent INR pricing with zero hidden fees. Cancel or upgrade
              whenever you want.
            </p>
          </div>

          <div className="flex items-center gap-3 mb-10 justify-center">
            <button className="px-3 py-1.5 text-sm font-medium text-[#6E6E6C] border border-[#EBEBEA] rounded-full hover:bg-[#F3F3F1]">Monthly Billing</button>
            <button className="px-3 py-1.5 text-sm font-medium text-[#151515] bg-[#FF5636]/10 text-[#FF5636] border border-[#FF5636]/20 rounded-full">
              Annual <span className="ml-1 text-[10px] font-medium bg-[#8B4DE8]/10 text-[#8B4DE8] px-2 py-0.5 rounded">Save 25%</span> <span className="ml-1 text-[10px] font-medium text-[#6E6E6C]">2 Mo Free</span>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-20 py-24 px-6 lg:py-32 lg:px-8 bg-[#F8F8F7]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#F1EAFE] text-[#8B4DE8] text-[11px] font-bold tracking-wider uppercase mb-4">
                Real Builders, Real Proof
              </span>
              <h2 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl text-[#151515]">
                Wall of High-Agency Operators
              </h2>
              <p className="text-[#6E6E6C] mt-3">
                Discover how solo entrepreneurs and independent researchers
                replaced app chaos with pure clarity.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-20 py-24 px-6 lg:py-32 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-[24px] border border-[#EBEBEA] bg-[#FF5636]/5 p-8 lg:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-[#FF5636]/10 blur-[80px]" />
            <div className="relative z-10 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-[#FFF0E9] text-[#FF5636] text-[11px] font-bold tracking-wider uppercase mb-6">
                Zero Friction Onboarding
              </span>
              <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl text-[#151515] mb-4">
                Ready to Reclaim Your Agency &amp; Master Your Daily Output?
              </h2>
              <p className="text-lg text-[#6E6E6C] mb-8 max-w-lg mx-auto">
                Join over 12,000 high-velocity solos who traded chaotic multi-app
                tabs for one sovereignty, hyper-focused operating system.
              </p>
              <Link
                to="/work/login"
                className="px-6 py-4 text-base font-semibold text-white bg-[#FF5636] rounded-full hover:bg-[#ef4524] transition-colors shadow-[0_8px_24px_rgba(255,86,54,0.25)] inline-block"
              >
                Start Free Now — No Card Needed <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#6E6E6C]">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-[#12B76A]/20 flex items-center justify-center">
                    <span className="h-1 w-1 rounded-full bg-[#12B76A]" />
                  </span>
                  <span>Setup in 60 seconds</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-[#12B76A]/20 flex items-center justify-center">
                    <span className="h-1 w-1 rounded-full bg-[#12B76A]" />
                  </span>
                  <span>Local-first privacy</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-[#12B76A]/20 flex items-center justify-center">
                    <span className="h-1 w-1 rounded-full bg-[#12B76A]" />
                  </span>
                  <span>Free forever tier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-[#EBEBEA] bg-white py-12 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF5636]/10">
                  <BriefcaseBusiness className="h-3.5 w-3.5 text-[#FF5636]" />
                </div>
                <span className="text-sm font-bold text-[#151515]">Luminous Tracker</span>
              </div>
              <p className="text-sm text-[#6E6E6C] leading-relaxed max-w-xs">
                Organize your digital mind, streamline high-velocity task flows,
                and master deep work inside a fluid personal workspace.
              </p>
              <p className="mt-4 text-xs text-[#6E6E6C] flex items-center gap-1">
                <span className="flex h-2 w-2 items-center justify-center rounded-full bg-[#12B76A]">
                  <span className="h-0.5 w-0.5 rounded-full bg-white" />
                </span>
                All systems operational
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E6E6C] mb-6">Product</h4>
              <ul className="space-y-3 text-sm text-[#6E6E6C]">
                <li><Link to="#features" className="hover:text-[#FF5636] transition-colors">Features</Link></li>
                <li><Link to="#solutions" className="hover:text-[#FF5636] transition-colors">Solutions</Link></li>
                <li><Link to="#pricing" className="hover:text-[#FF5636] transition-colors">Pricing</Link></li>
                <li><Link href="#testimonials" className="hover:text-[#FF5636] transition-colors">Wall of Love</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E6E6C] mb-6">Legal &amp; Trust</h4>
              <ul className="space-y-3 text-sm text-[#6E6E6C]">
                <li><Link href="#" className="hover:text-[#FF5636] transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-[#FF5636] transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-[#FF5636] transition-colors">Security &amp; SOC2</Link></li>
                <li><Link href="#" className="hover:text-[#FF5636] transition-colors">Cookie Settings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E6E6C] mb-6">Stay Updated</h4>
              <p className="text-sm text-[#6E6E6C] mb-4">
                Product updates and productivity deep-dives straight to your inbox.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2.5 text-sm border border-[#EBEBEA] rounded-full bg-white outline-none focus:border-[#FF5636] focus:ring-1 focus:ring-[#FF5636]"
                />
                <button className="px-4 py-2.5 text-sm font-bold text-white bg-[#151515] rounded-full hover:bg-[#FF5636] transition-colors">
                  Join
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <a href="#" className="h-8 w-8 rounded-full border border-[#EBEBEA] flex items-center justify-center text-[#6E6E6C] hover:text-[#FF5636] transition-colors">
                  <Globe className="h-4 w-4" />
                </a>
                <a href="#" className="h-8 w-8 rounded-full border border-[#EBEBEA] flex items-center justify-center text-[#6E6E6C] hover:text-[#FF5636] transition-colors">
                  <Monitor className="h-4 w-4" />
                </a>
                <a href="#" className="h-8 w-8 rounded-full border border-[#EBEBEA] flex items-center justify-center text-[#6E6E6C] hover:text-[#FF5636] transition-colors">
                  <Rss className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-[#EBEBEA] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6E6E6C]">
            <p>© 2026 Luminous Technologies Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-[#FF5636] transition-colors">Status</Link>
              <Link href="#" className="hover:text-[#FF5636] transition-colors">Changelog</Link>
              <Link href="#" className="hover:text-[#FF5636] transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatMini({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F3F3F1]">
        <Icon className="h-3 w-3" style={{ color }} />
      </div>
      <div className="text-[10px]">
        <p className="font-bold text-[#151515]">{value}</p>
        <p className="text-[#6E6E6C]">{label}</p>
      </div>
    </div>
  );
}

function CardMini({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className="p-3 rounded-lg border border-[#EBEBEA] bg-white">
      <p className="text-[10px] font-bold text-[#151515]">{count}</p>
      <p className="text-[9px] text-[#6E6E6C]">{title}</p>
    </div>
  );
}

function ProblemCard({ title, sub, icon: Icon, color, items }: { title: string; sub: string; icon: any; color: string; items: { label: string; detail: string }[] }) {
  return (
    <div className="p-6 rounded-xl border border-[#EBEBEA] bg-[#F8F8F7]/50">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F1EAFE]/50 text-[#8B4DE8]">
          <span className="h-2 w-2 rounded-full bg-[#8B4DE8]" />
        </span>
        <h4 className="text-lg font-bold tracking-[-0.01em] text-[#151515]">{title}</h4>
        <span className="ml-auto text-[10px] font-bold text-[#ba1a1a]">{sub}</span>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-[#F1EAFE]/40 text-[#8B4DE8] shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8B4DE8]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#151515]">{item.label}</p>
              <p className="text-xs text-[#6E6E6C] leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SolutionCard({ title, sub, icon: Icon, color, items }: { title: string; sub: string; icon: any; color: string; items: { label: string; detail: string }[] }) {
  return (
    <div className="p-6 rounded-xl border border-[#EBEBEA] bg-[#F8F8F7]/50">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1EAFE]">
          <Icon className="h-4 w-4 text-[#8B4DE8]" />
        </span>
        <h4 className="text-lg font-bold tracking-[-0.01em] text-[#151515]">{title}</h4>
        <span className="ml-auto text-[10px] font-bold text-[#8B4DE8]">{sub}</span>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-[#F1EAFE]/40 text-[#8B4DE8] shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8B4DE8]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#151515]">{item.label}</p>
              <p className="text-xs text-[#6E6E6C] leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PillarCard({ p }: { p: { num: string; label: string; color: string; title: string; desc: string; stats: { label: string; value: string; sub: string }[] } }) {
  const { num, label, color, title, desc, stats } = p;
  return (
    <div className="p-6 rounded-xl border border-[#EBEBEA] bg-white shadow-[0_1px_3px_rgba(21,21,21,0.04)]">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF0E9]">
          <span className="text-xs font-bold text-[#FF5636]">{num}</span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3F3F1] text-[10px] font-semibold uppercase tracking-wider text-[#151515]">
          {label}
        </span>
      </div>
      <h4 className="text-lg font-bold tracking-[-0.01em] text-[#151515] mb-3">{title}</h4>
      <p className="text-sm text-[#6E6E6C] leading-relaxed mb-5">{desc}</p>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="p-3 rounded-lg border border-[#EBEBEA] bg-white">
            <p className="text-[10px] uppercase tracking-wider text-[#6E6E6C]">{s.label}</p>
            <p className="text-sm font-bold text-[#151515]">{s.value}</p>
            {s.sub && <p className="text-[9px] text-[#6E6E6C]">{s.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingCard({ plan }: { plan: typeof pricing[number] }) {
  const { name, price, period, badge, sub, desc, items, excluded, cta, variant } = plan;
  return (
    <div className="p-8 rounded-xl border border-[#EBEBEA] bg-white shadow-[0_1px_3px_rgba(21,21,21,0.04)] flex flex-col h-full">
      {badge && (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#8B4DE8] text-[10px] font-bold text-white mb-5">
          {badge}
        </div>
      )}
      <h4 className="text-lg font-bold tracking-[-0.01em] text-[#151515] mb-2">{name}</h4>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-[#151515]">{price}</span>
        <span className="text-sm text-[#6E6E6C]">{period}</span>
      </div>
      <p className="text-sm text-[#6E6E6C] mb-5">{sub}</p>
      <p className="text-xs text-[#6E6E6C] leading-relaxed mb-6">{desc}</p>
      <ul className="space-y-3 mb-6 flex-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-[#6E6E6C]">
            <span className="h-3.5 w-3.5 rounded-full border border-[#F1EAFE]/40 flex items-center justify-center shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8B4DE8]" />
            </span>
            {item}
          </li>
        ))}
        {excluded.map((item, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-[#6E6E6C]/60">
            <span className="h-3.5 w-3.5 rounded-full border border-[#EBEBEA]/40 flex items-center justify-center shrink-0">
              <span className="h-1 w-1 rounded-full bg-[#EBEBEA]" />
            </span>
            <span className="line-through">{item}</span>
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-3 text-sm font-semibold rounded-full transition-colors ${
          variant === 'primary'
            ? 'bg-[#151515] text-white hover:bg-[#FF5636]'
            : variant === 'orange'
              ? 'bg-[#FF5636] text-white hover:bg-[#ef4524]'
              : 'border border-[#EBEBEA] text-[#151515] hover:bg-[#F3F3F1]'
        }`}
      >
        {cta}
      </button>
    </div>
  );
}

function TestimonialCard({ t }: { t: typeof testimonials[number] }) {
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className="h-3 w-3 fill-current text-[#FFB400]" />
  ));
  return (
    <div className="p-6 rounded-xl border border-[#EBEBEA] bg-white">
      <div className="flex items-center gap-1 mb-4">
        {stars}
      </div>
      <p className="text-sm leading-relaxed text-[#6E6E6C] mb-5">
        "{t.quote}"
      </p>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F1EAFE]">
          <span className="h-4 w-4 rounded-full bg-[#F1EAFE]/50 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-[#8B4DE8]" />
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#151515]">{t.name}</p>
          <p className="text-[10px] text-[#6E6E6C]">{t.role}</p>
        </div>
        <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#F3F3F1]">
          <span className="text-[9px] font-bold" style={{ color: t.subColor }}>
            {t.sub}
          </span>
        </div>
      </div>
    </div>
  );
}
