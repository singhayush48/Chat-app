import { Avatar } from '@/components/common/Avatar';

export function ProfileCard({ user }) {
  return (
    <div className="flex items-center gap-3 border-b border-border p-3">
      <Avatar name={user?.username} src={user?.profile_pic} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{user?.username}</p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
      </div>
    </div>
  );
}
