import { cn } from '@/utils/cn';

function Bar({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-elevated', className)} />;
}

export function ConversationListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-1 p-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg p-2">
          <Bar className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bar className="h-3 w-2/3" />
            <Bar className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  const widths = ['w-40', 'w-56', 'w-32', 'w-48', 'w-28'];
  return (
    <div className="flex-1 space-y-3 p-4" aria-hidden="true">
      {widths.map((w, i) => (
        <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
          <Bar className={cn('h-9 rounded-2xl', w)} />
        </div>
      ))}
    </div>
  );
}
