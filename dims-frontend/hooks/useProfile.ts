import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/user.types';

interface UpdateProfileData {
  firstName: string;
  lastName: string;
  jobTitle?: string | undefined;
  phone?: string | undefined;
  bio?: string | undefined;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Update user profile (name, job title, phone, bio)
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!userId) throw new Error('Not authenticated');
      const response = await usersApi.update(userId, data);
      return response.data as User;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Update user avatar/profile picture
 */
export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);
  return useMutation<{ avatarUrl: string }, Error, File>({
    mutationFn: async (file: File) => {
      const response = await usersApi.changeAvatar(file);
      return response.data.data;
    },
    onSuccess: (data) => {
      if (currentUser) {
        const updated = { ...currentUser, avatarUrl: data.avatarUrl };
        setUser(updated);
        queryClient.setQueryData<User>(['auth', 'me'], (old) =>
          old ? { ...old, avatarUrl: data.avatarUrl } : old,
        );
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Change user password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      await apiClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (preferences: Record<string, unknown>) => {
      if (!userId) throw new Error('Not authenticated');
      const response = await usersApi.update(userId, preferences as Parameters<typeof usersApi.update>[1]);
      return response.data as User;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
    },
  });
}
