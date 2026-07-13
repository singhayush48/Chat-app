import { Loader2 } from 'lucide-react';

export function FullScreenLoader({ label = 'Loading…' }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
