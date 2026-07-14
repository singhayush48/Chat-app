import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { AvatarUploader } from '@/components/auth/AvatarUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/ui/field-error';
import { usersApi } from '@/api/usersApi';
import { getErrorMessage } from '@/utils/errorMessage';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      username: user?.username ?? '',
      phone: user?.phone ?? '',
      bio: user?.bio ?? '',
    },
  });

  const onSubmit = async (values) => {
    try {
      await usersApi.updateProfile(values);
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update your profile.'));
    }
  };

  if (!user) {
    return null; // ProtectedRoute guarantees a user; this satisfies static analysis only
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-lg flex-col overflow-y-auto bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-sm font-semibold text-foreground">Your profile</h1>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="mb-8 flex justify-center">
          <AvatarUploader />
        </div>

        <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{user.email}</span>
          <span className="ml-auto shrink-0 text-xs">Can&apos;t be changed</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <Label htmlFor="profile-username">Username</Label>
            <Input
              id="profile-username"
              aria-invalid={Boolean(errors.username)}
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
              })}
            />
            <FieldError message={errors.username?.message} />
          </div>

          <div>
            <Label htmlFor="profile-phone">Phone</Label>
            <Input id="profile-phone" type="tel" {...register('phone')} />
            <FieldError message={errors.phone?.message} />
          </div>

          <div>
            <Label htmlFor="profile-bio">Bio</Label>
            <Input id="profile-bio" placeholder="Tell people a little about yourself" {...register('bio')} />
            <FieldError message={errors.bio?.message} />
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
