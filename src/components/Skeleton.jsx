export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`} />
}

export function DiscoverCardSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
      <Skeleton className="h-2/3 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function MatchListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900">
      <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-9 w-2/3 rounded-2xl rounded-bl-sm" />
      <Skeleton className="ml-auto h-9 w-1/2 rounded-2xl rounded-br-sm" />
      <Skeleton className="h-9 w-3/5 rounded-2xl rounded-bl-sm" />
    </div>
  )
}
