import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger' | 'dark' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-sm hover:bg-accent-hover active:translate-y-px disabled:bg-accent/60',
  secondary:
    'bg-card text-ink border border-line shadow-card hover:bg-secondary active:translate-y-px',
  ghost: 'text-soft hover:bg-secondary hover:text-ink',
  subtle: 'bg-secondary text-ink border border-line-soft hover:bg-line-soft',
  danger: 'bg-danger text-white shadow-sm hover:bg-red-600 active:translate-y-px',
  dark: 'bg-ink text-card shadow-sm hover:opacity-90 active:translate-y-px',
  outline: 'border border-accent/30 text-accent-strong bg-transparent hover:bg-accent-soft',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-9 gap-2 rounded-lg px-3.5 text-[13px]',
  lg: 'h-10 gap-2 rounded-[10px] px-4 text-sm',
  icon: 'h-9 w-9 rounded-lg p-0',
  'icon-sm': 'h-8 w-8 rounded-lg p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-1 focus-visible:ring-offset-app disabled:cursor-not-allowed disabled:opacity-60',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({
  className,
  variant = 'secondary',
  size = 'icon',
  ...props
}: ButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn('shrink-0', className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

type BadgeTone = 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'orange';

const badgeTones: Record<BadgeTone, string> = {
  gray: 'border-line bg-secondary text-soft',
  green:
    'border-green-200 bg-green-50 text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-400',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400',
  amber:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400',
  red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400',
  purple:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-400',
  orange:
    'border-accent/40 bg-accent-soft text-accent-strong dark:border-accent/30 dark:bg-accent-soft dark:text-accent-strong',
};

export function Badge({
  children,
  tone = 'gray',
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5',
        badgeTones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

const statusTone: Record<string, BadgeTone> = {
  Active: 'green',
  Completed: 'green',
  Paid: 'green',
  Potential: 'blue',
  Planning: 'blue',
  Sent: 'blue',
  'In Progress': 'blue',
  Ongoing: 'blue',
  'On Hold': 'amber',
  'Partially Paid': 'amber',
  Pending: 'amber',
  Overdue: 'red',
  Urgent: 'red',
  Refunded: 'purple',
  Draft: 'gray',
  'To Do': 'gray',
  Planned: 'gray',
  Partial: 'amber',
  Recorded: 'gray',
  Unpaid: 'amber',
};

export function StatusBadge({ status, dot = true }: { status: string; dot?: boolean }) {
  const tone = statusTone[status] ?? 'gray';
  return (
    <Badge tone={tone} dot={dot}>
      {status}
    </Badge>
  );
}

const priorityTone: Record<string, BadgeTone> = {
  Low: 'green',
  Medium: 'blue',
  High: 'orange',
  Urgent: 'red',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge tone={priorityTone[priority] ?? 'gray'} dot>
      {priority}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Avatars                                                                    */
/* -------------------------------------------------------------------------- */

const avatarPalette = [
  'from-neutral-500 to-neutral-700',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-slate-400 to-slate-600',
  'from-cyan-400 to-blue-500',
  'from-pink-400 to-rose-500',
  'from-lime-400 to-emerald-500',
];

export function Avatar({
  name,
  size = 'md',
  className,
  src,
}: {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  src?: string;
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const hash = name.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  const palette = avatarPalette[hash % avatarPalette.length];
  const sizeClass = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
    xl: 'h-16 w-16 text-lg',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-gradient-to-br font-semibold text-white shadow-sm dark:border-white/10',
        palette,
        sizeClass,
        className,
      )}
      title={name}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Form primitives                                                            */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-[12px] font-medium text-ink">
          {label}
          {required && <span className="text-accent-strong">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[11px] text-danger">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      ) : (
        hint && <p className="text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}

const inputBase =
  'w-full rounded-lg border bg-card text-[13px] text-ink shadow-[0_1px_1px_rgba(16,24,40,0.02)] outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, 'h-9 border-line px-3', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'min-h-[84px] resize-y border-line px-3 py-2', className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          inputBase,
          'h-9 appearance-none border-line py-0 pl-3 pr-9',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(inputBase, 'h-9 border-line pl-9 pr-8')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition hover:bg-secondary hover:text-ink"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-card px-1 font-sans text-[10px] font-medium text-muted">
      {children}
    </kbd>
  );
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

export function Progress({
  value,
  className,
  barClassName,
  tone = 'accent',
}: {
  value: number;
  className?: string;
  barClassName?: string;
  tone?: 'accent' | 'success' | 'blue';
}) {
  const color =
    tone === 'success' ? 'bg-success' : tone === 'blue' ? 'bg-info' : 'bg-accent';
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-line-soft', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', color, barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

export interface TabOption<T extends string = string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
  stretch = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: TabOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
  stretch?: boolean;
}) {
  return (
    <div
      className={cn(
        'no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-[10px] border border-line bg-secondary p-1',
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all',
              size === 'sm' ? 'h-7 px-2.5 text-[11px]' : 'h-8 px-3 text-[12px]',
              stretch && 'flex-1',
              active
                ? 'bg-card text-ink shadow-card ring-1 ring-line/70'
                : 'text-soft hover:bg-card/60 hover:text-ink',
            )}
          >
            {Icon && <Icon className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />}
            {option.label}
            {typeof option.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] font-semibold leading-4',
                  active ? 'bg-secondary text-soft' : 'bg-card/70 text-muted',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Popover & menus                                                            */
/* -------------------------------------------------------------------------- */

interface PopoverRenderArgs {
  close: () => void;
}

export function Popover({
  trigger,
  children,
  align = 'end',
  className,
}: {
  trigger: (args: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((args: PopoverRenderArgs) => ReactNode);
  align?: 'start' | 'end';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          className={cn(
            'absolute top-full z-50 mt-2 min-w-[190px] animate-scale-in rounded-xl border border-line bg-card p-1.5 shadow-pop',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

export function ActionMenu({
  items,
  label = 'More options',
  size = 'icon-sm',
}: {
  items: MenuItem[];
  label?: string;
  size?: ButtonSize;
}) {
  return (
    <Popover
      trigger={({ toggle }) => (
        <IconButton
          variant="ghost"
          size={size}
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
          aria-label={label}
        >
          <MoreHorizontalIcon />
        </IconButton>
      )}
    >
      {({ close }) => (
        <div>
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={`${item.label}-${index}`}>
                {item.separator && <div className="my-1 h-px bg-line-soft" />}
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (item.disabled) return;
                    close();
                    item.onClick();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition',
                    item.danger
                      ? 'text-danger hover:bg-danger/10'
                      : 'text-soft hover:bg-secondary hover:text-ink',
                    item.disabled && 'cursor-not-allowed opacity-40',
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

function MoreHorizontalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="13" cy="8" r="1.25" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter menu                                                                */
/* -------------------------------------------------------------------------- */

export function FilterMenu<T extends string>({
  label = 'Filter',
  options,
  selected,
  onChange,
  onClear,
}: {
  label?: string;
  options: { value: T; label: string; count?: number }[];
  selected: T[];
  onChange: (values: T[]) => void;
  onClear: () => void;
}) {
  return (
    <Popover
      trigger={({ toggle }) => (
        <Button variant="secondary" size="sm" onClick={toggle} className="h-8">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
          {selected.length > 0 && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted" />
        </Button>
      )}
      className="w-52"
    >
      {({ close }) => (
        <div>
          <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {label}
            </span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  close();
                }}
                className="text-[11px] font-medium text-accent-strong hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          {options.map((option) => {
            const active = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(
                    active
                      ? selected.filter((value) => value !== option.value)
                      : [...selected, option.value],
                  );
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-soft transition hover:bg-secondary hover:text-ink"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border transition',
                    active ? 'border-accent bg-accent text-white' : 'border-line bg-card',
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1">{option.label}</span>
                {typeof option.count === 'number' && (
                  <span className="text-[10px] text-muted">{option.count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof modalSizes;
  className?: string;
}) {
  useBodyLock(open);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-card shadow-float animate-slide-up sm:rounded-2xl',
          modalSizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[12px] text-soft">{description}</p>}
          </div>
          <IconButton variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft bg-secondary/40 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* Drawer                                                                     */
/* -------------------------------------------------------------------------- */

const drawerSizes = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-3xl',
  '2xl': 'sm:max-w-5xl',
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'lg',
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof drawerSizes;
  className?: string;
}) {
  useBodyLock(open);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex h-full w-full flex-col border-l border-line bg-card shadow-float animate-slide-in-right',
          drawerSizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[12px] text-soft">{description}</p>}
          </div>
          <IconButton variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft bg-secondary/40 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* Confirm dialog                                                             */
/* -------------------------------------------------------------------------- */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  tone = 'danger',
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-soft">{description}</p>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty & loading states                                                     */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-secondary/40 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-card text-muted shadow-card">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-[13px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-soft">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-line-soft/70', className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/5" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toast                                                                      */
/* -------------------------------------------------------------------------- */

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (options: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
  warning: 'text-warning',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant = 'success',
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setItems((current) => [...current.slice(-3), { id, title, description, variant }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
          {items.map((item) => {
            const Icon = toastIcons[item.variant];
            return (
              <div
                key={item.id}
                className="pointer-events-auto flex animate-slide-up items-start gap-3 rounded-xl border border-line bg-card p-3.5 shadow-pop"
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-secondary',
                    toastStyles[item.variant],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-soft">
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-md p-1 text-muted transition hover:bg-secondary hover:text-ink"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

/* -------------------------------------------------------------------------- */
/* Data table primitives                                                      */
/* -------------------------------------------------------------------------- */

export function DataTable({
  children,
  minWidth = 860,
  className,
}: {
  children: ReactNode;
  minWidth?: number;
  className?: string;
}) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  align = 'left',
  className,
}: {
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return (
    <th
      className={cn(
        'sticky top-0 z-10 whitespace-nowrap border-b border-line bg-card px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className,
}: {
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return (
    <td
      className={cn(
        'border-b border-line-soft px-4 py-3 text-[12.5px] text-soft align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function TableRow({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'group border-b border-line-soft transition-colors last:border-0 hover:bg-secondary/50',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </tr>
  );
}
