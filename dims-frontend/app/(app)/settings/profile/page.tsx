'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { ProfilePictureUploader } from '@/components/profile/ProfilePictureUploader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Lock } from 'lucide-react';
import type { User } from '@/types/user.types';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsProfilePage() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Profile query
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get<{ data: User }>('/auth/me');
      return response.data.data;
    },
  });

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      jobTitle: '',
      phone: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        jobTitle: user.jobTitle || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
  }, [user, profileForm]);

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      alert('Profile updated successfully');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync(data);
      passwordForm.reset();
      setIsPasswordModalOpen(false);
      alert('Password changed successfully');
    } catch (error) {
      alert('Failed to change password');
    }
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Profile Picture</h2>
        <ProfilePictureUploader user={user} />
      </div>

      {/* Profile Info Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Personal Information</h2>
        <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...profileForm.register('firstName')}
              error={profileForm.formState.errors.firstName?.message}
            />
            <Input
              label="Last Name"
              {...profileForm.register('lastName')}
              error={profileForm.formState.errors.lastName?.message}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={user.email}
            disabled
            readOnly
          />
          <Input
            label="Job Title"
            {...profileForm.register('jobTitle')}
            placeholder="Software Engineer"
          />
          <Input
            label="Phone (Optional)"
            {...profileForm.register('phone')}
            placeholder="+1 (555) 000-0000"
          />
          <Input
            label="Bio (Optional)"
            {...profileForm.register('bio')}
            placeholder="Tell us about yourself..."
            as="textarea"
            rows={3}
          />
          <Button
            type="submit"
            disabled={!profileForm.formState.isDirty || updateProfile.isPending}
            className="w-full"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Password</h2>
              <p className="text-sm text-muted-foreground">Change your password to keep your account secure</p>
            </div>
          </div>
          <Button
            onClick={() => setIsPasswordModalOpen(true)}
            variant="outline"
          >
            Change Password
          </Button>
        </div>
      </div>

      {/* Password Modal */}
      <Modal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        size="md"
      >
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            {...passwordForm.register('currentPassword')}
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <Input
            label="New Password"
            type="password"
            {...passwordForm.register('newPassword')}
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Input
            label="Confirm Password"
            type="password"
            {...passwordForm.register('confirmPassword')}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={changePassword.isPending}
              variant="primary"
              className="flex-1"
            >
              {changePassword.isPending ? 'Updating...' : 'Update Password'}
            </Button>
            <Button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
