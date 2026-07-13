import { Outlet, useParams } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { cn } from '@/utils/cn';

export function HomeLayout() {
  // Present only when a nested "/c/:conversationId" route is active —
  // used purely to decide which pane shows on narrow (mobile) screens.
  const { conversationId } = useParams();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'w-full shrink-0 border-r border-border md:w-80 lg:w-96',
          conversationId ? 'hidden md:block' : 'block'
        )}
      >
        <Sidebar />
      </aside>

      <main
        className={cn('min-w-0 flex-1 flex-col', conversationId ? 'flex' : 'hidden md:flex')}
      >
        <Outlet />
      </main>
    </div>
  );
}
