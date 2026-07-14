import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/common/Avatar';
import { usersApi } from '@/api/usersApi';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/errorMessage';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function AvatarUploader() {
  const { user, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please choose a JPG, PNG, WEBP, or GIF image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image must be smaller than 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      await usersApi.updateAvatar(file);
      await refreshUser();
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload that image.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar name={user?.username} src={user?.profile_pic} size="xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label="Change profile picture"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>
      <p className="text-xs text-muted-foreground">Click the camera icon to change your photo</p>
    </div>
  );
}
