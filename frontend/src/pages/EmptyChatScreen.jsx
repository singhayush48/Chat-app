import { MessagesSquare } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

export function EmptyChatScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-background px-4 text-center animate-fade-in">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-elevated">
        <MessagesSquare className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-background bg-primary/10">
          <span className="h-2 w-2 rounded-full bg-primary" />
        </span>
      </div>
      <div>
        <h2 className="text-base font-medium text-foreground">Select a conversation</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Choose someone from the sidebar, or search for a person to start a new chat.
        </p>
      </div>
      <Logo size="sm" className="mt-6 opacity-60" />
    </div>
  );
}
