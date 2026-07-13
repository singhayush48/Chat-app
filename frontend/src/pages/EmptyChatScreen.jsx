import { MessageCircle } from 'lucide-react';

export function EmptyChatScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated">
        <MessageCircle className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-base font-medium text-foreground">Select a conversation</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Choose someone from the sidebar, or search for a person to start a new chat.
        </p>
      </div>
    </div>
  );
}
