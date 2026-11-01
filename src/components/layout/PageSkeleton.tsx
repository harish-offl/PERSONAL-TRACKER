import { Skeleton } from '../ui';

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 pb-10 pt-5 sm:px-6 lg:px-7">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-3.5 w-72 max-w-[70vw]" />
        </div>
        <Skeleton className="hidden h-9 w-28 sm:block" />
      </div>
      <Skeleton className="mt-5 h-[62px] w-full rounded-xl" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-[116px] rounded-xl" />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-10 w-[340px] max-w-full rounded-[10px]" />
        <Skeleton className="hidden h-8 w-44 rounded-lg sm:block" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[240px] rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[220px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
