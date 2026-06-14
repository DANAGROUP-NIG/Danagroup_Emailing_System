'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { mailApi } from '@/lib/api';
import type { User, Department, Subsidiary } from '@/types/user.types';

// ============ Users ============

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<User> & { sendWelcomeEmail?: boolean }) => {
      const response = await mailApi.createUser?.(data) || { data: {} };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast({ title: 'User created successfully', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Failed to create user', variant: 'error' });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await mailApi.updateUser?.(id, data) || { data: {} };
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      showToast({ title: 'User updated successfully', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Failed to update user', variant: 'error' });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await mailApi.deactivateUser?.(id) || { data: {} };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast({ title: 'User deactivated', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Failed to deactivate user', variant: 'error' });
    },
  });
}

export function useResetUserPassword() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await mailApi.resetUserPassword?.(id) || { data: {} };
      return response.data;
    },
    onSuccess: () => {
      showToast({
        title: 'Password reset email sent',
        variant: 'success',
      });
    },
    onError: () => {
      showToast({ title: 'Failed to reset password', variant: 'error' });
    },
  });
}

// ============ Departments ============

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<Department>) => {
      const response = await mailApi.createDepartment?.(data) || { data: {} };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast({ title: 'Department created', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Failed to create department', variant: 'error' });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Department> }) => {
      const response = await mailApi.updateDepartment?.(id, data) || { data: {} };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast({ title: 'Department updated', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Failed to update department', variant: 'error' });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await mailApi.deleteDepartment?.(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast({ title: 'Department deleted', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Failed to delete department', variant: 'error' });
    },
  });
}

// ============ Subsidiaries ============

export function useCreateSubsidiary() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<Subsidiary>) => {
      const response = await mailApi.createSubsidiary?.(data) || { data: {} };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsidiaries'] });
      showToast({ title: 'Subsidiary created', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Failed to create subsidiary', variant: 'error' });
    },
  });
}

export function useUpdateSubsidiary() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Subsidiary> }) => {
      const response = await mailApi.updateSubsidiary?.(id, data) || { data: {} };
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsidiaries'] });
      showToast({ title: 'Subsidiary updated', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Failed to update subsidiary', variant: 'error' });
    },
  });
}
