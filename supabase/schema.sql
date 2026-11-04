-- Personal Tracker - Supabase Database Schema
-- Two independent portals: Work Management and Study Management
-- All tables use Row Level Security (RLS) and are scoped to auth.uid().

-- ============================================================
-- AUTH / PROFILES
-- ============================================================

create table if not exists public.work_profiles (
  id uuid references auth.users not null primary key,
  name text not null default 'Owner',
  email text,
  workspace text default 'Personal Tracker',
  theme text default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_profiles (
  id uuid references auth.users not null primary key,
  name text not null default 'Owner',
  email text,
  workspace text default 'Personal Tracker',
  theme text default 'light',
  daily_hours integer default 2,
  weekly_hours integer default 10,
  monthly_hours integer default 40,
  reminders boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- WORK MODULE
-- ============================================================

create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id text generated always as ('CLT-' || substr(id::text, 1, 8)) stored,
  name text not null,
  business_name text,
  phone text,
  email text,
  address text,
  project_name text,
  project_value numeric default 0,
  project_start_date date,
  project_end_date date,
  notes text,
  status text default 'Active' check (status in ('Active','Completed','On Hold','Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  description text,
  value numeric default 0,
  start_date date,
  end_date date,
  priority text default 'Medium' check (priority in ('High','Medium','Low')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  status text default 'Planning' check (status in ('Planning','Started','In Progress','Review','Completed','Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  category text,
  status text default 'To Do' check (status in ('To Do','In Progress','Completed','On Hold')),
  priority text default 'Medium' check (priority in ('High','Medium','Low')),
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text generated always as ('INV-' || substr(id::text, 1, 8)) stored,
  invoice_date date not null default current_date,
  due_date date,
  payment_terms text default 'Net 15',
  discount numeric default 0,
  tax numeric default 0,
  notes text,
  status text default 'Draft' check (status in ('Draft','Sent','Partially Paid','Paid','Overdue','Cancelled')),
  draft boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric default 1,
  unit_price numeric default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  invoice_total numeric default 0,
  amount_paid numeric default 0,
  remaining_amount numeric generated always as (invoice_total - amount_paid) stored,
  payment_date date not null default current_date,
  payment_mode text default 'Other' check (payment_mode in ('Cash','UPI','Bank Transfer','Card','Other')),
  transaction_reference text,
  status text default 'Paid' check (status in ('Paid','Pending','Failed','Refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  category text default 'Other' check (category in ('Software','Subscription','Internet','Equipment','Travel','Marketing','Personal Work','Other')),
  amount numeric default 0,
  expense_date date not null default current_date,
  payment_method text,
  description text,
  receipt_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.work_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  file_name text not null,
  file_type text,
  file_size integer,
  file_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- STUDY MODULE
-- ============================================================

create table if not exists public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  color text default '#6558D3',
  icon text default 'BookOpenText',
  target_hours numeric default 40,
  target_date date,
  priority text default 'Medium' check (priority in ('High','Medium','Low')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  completed_chapters integer default 0,
  total_chapters integer default 0,
  last_studied date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects(id) on delete set null,
  day integer not null check (day >= 0 and day <= 6),
  start_time time not null,
  end_time time not null,
  notes text,
  repeat_weekly boolean default true,
  completed boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects(id) on delete set null,
  session_date date not null default current_date,
  start_time timestamptz not null default now(),
  end_time timestamptz not null default now(),
  duration_minutes integer default 0,
  session_type text default 'Stopwatch' check (session_type in ('Stopwatch','Pomodoro','Countdown')),
  notes text,
  completed boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.study_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  content text default '',
  tags text[] default '{}',
  pinned boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_resources (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  tags text[] default '{}',
  file_name text not null,
  file_type text,
  file_size integer,
  data_url text,
  share_token text unique,
  share_enabled boolean default false,
  share_expires_at timestamptz,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.study_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  daily_hours integer default 2,
  weekly_hours integer default 10,
  monthly_hours integer default 40,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  event_type text,
  event_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.work_profiles enable row level security;
alter table public.study_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.work_documents enable row level security;
alter table public.subjects enable row level security;
alter table public.study_schedules enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_notes enable row level security;
alter table public.study_resources enable row level security;
alter table public.study_goals enable row level security;
alter table public.study_events enable row level security;

-- Helper: owner-only policies (user can only access their own rows)
create policy if not exists "Owner can manage own work profile" on public.work_profiles
  for all using (auth.uid() = id);
create policy if not exists "Owner can manage own study profile" on public.study_profiles
  for all using (auth.uid() = id);

create policy if not exists "Owner can manage own clients" on public.clients for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own projects" on public.projects for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own invoices" on public.invoices for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own invoice items" on public.invoice_items for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own payments" on public.payments for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own expenses" on public.expenses for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own work documents" on public.work_documents for all using (auth.uid() = user_id);

create policy if not exists "Owner can manage own subjects" on public.subjects for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own study schedules" on public.study_schedules for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own study sessions" on public.study_sessions for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own study notes" on public.study_notes for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own study resources" on public.study_resources for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own study goals" on public.study_goals for all using (auth.uid() = user_id);
create policy if not exists "Owner can manage own study events" on public.study_events for all using (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_clients_user_id on public.clients(user_id);
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_subjects_user_id on public.subjects(user_id);
create index if not exists idx_study_sessions_user_id on public.study_sessions(user_id, session_date);
create index if not exists idx_study_resources_user_id on public.study_resources(user_id);
