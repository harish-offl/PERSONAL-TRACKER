import type { ReactNode } from 'react';
import {
  Binary,
  BookOpenText,
  Braces,
  Code2,
  Network,
  Palette,
  PenLine,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const icons: Record<string, LucideIcon> = {
  Code2,
  Braces,
  Palette,
  Network,
  Binary,
  PenLine,
  BookOpenText,
};

export function SubjectIcon({
  name,
  color,
  className,
  size = 'md',
}: {
  name: string;
  color: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const Icon = icons[name] ?? BookOpenText;
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl border',
        size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10',
        className,
      )}
      style={{ backgroundColor: `${color}14`, borderColor: `${color}28`, color }}
    >
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={1.9} />
    </span>
  );
}

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-line bg-card shadow-card',
        padded && 'p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[13.5px] font-semibold tracking-[-0.02em]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[10.5px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'accent',
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: 'accent' | 'success' | 'warning' | 'info';
}) {
  const palette = {
    accent: 'bg-accent-soft text-accent-strong',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    info: 'bg-info-soft text-info',
  }[tone];

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', palette)}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.05em]">{value}</p>
      <p className="mt-2 text-[10.5px] text-muted">{detail}</p>
    </div>
  );
}

export function EmptyPanel({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card/50 px-5 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-[13px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-[24px] font-semibold leading-tight tracking-[-0.045em] sm:text-[27px]">
          {title}
        </h2>
        <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed text-soft">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Tag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-medium"
      style={
        color
          ? { color, borderColor: `${color}33`, backgroundColor: `${color}12` }
          : undefined
      }
    >
      {children}
    </span>
  );
}
