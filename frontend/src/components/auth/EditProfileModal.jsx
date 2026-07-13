import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/ui/field-error';
import { usersApi } from '@/api/usersApi';
import { useAuth } from '@/hooks/useAuth';

/**
 * PLANNED FEATURE: calls usersApi.updateProfile, which hits
 * PATCH /api/users/me — not implemented on the backend yet (see
 * constants/endpoints.js for the exact contract). This will fail with a
 * friendly message until that route exists; the UI is fully built and
 * ready to go the moment it does.
 */
export function EditProfileModal({ open, onClose }) {
  const { user, refreshUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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
      onClose();
    } catch {
      toast.error("Profile editing isn't available yet — coming soon.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <Label htmlFor="edit-username">Username</Label>
          <Input
            id="edit-username"
            aria-invalid={Boolean(errors.username)}
            {...register('username', { required: 'Username is required' })}
          />
          <FieldError message={errors.username?.message} />
        </div>

        <div>
          <Label htmlFor="edit-phone">Phone</Label>
          <Input id="edit-phone" type="tel" {...register('phone')} />
        </div>

        <div>
          <Label htmlFor="edit-bio">Bio</Label>
          <Input id="edit-bio" placeholder="A short bio" {...register('bio')} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
