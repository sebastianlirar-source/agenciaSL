export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-surface-elevated ${className}`} />
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
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
