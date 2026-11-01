import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.025em] text-ink">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-soft">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
