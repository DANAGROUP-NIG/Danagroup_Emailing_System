'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { usersApi, type CreateUserPayload } from '@/lib/api/users';
import { departmentsApi } from '@/lib/api/departments';
import apiClient from '@/lib/api/client';
import type { User, Department, Subsidiary } from '@/types/user.types';

function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  const anyErr = err as any;
  if (anyErr?.response?.data?.message) return String(anyErr.response.data.message);
  if (anyErr?.message) return String(anyErr.message);
  return 'Something went wrong';
}

// ============ Users ============

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateUserPayload) => {
      const response = await usersApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast({ title: 'User created successfully', variant: 'success' });
    },
    onError: (err) => {
      showToast({ title: 'Failed to create user', description: getErrorMessage(err), variant: 'error' });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await usersApi.update(id, data as unknown as Parameters<typeof usersApi.update>[1]);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      showToast({ title: 'User updated successfully', variant: 'success' });
    },
    onError: (err) => {
      showToast({ title: 'Failed to update user', description: getErrorMessage(err), variant: 'error' });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await usersApi.deactivate(id);
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
      const response = await apiClient.post(`/users/${id}/reset-password`);
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
      const response = await departmentsApi.create(data as Parameters<typeof departmentsApi.create>[0]);
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
      const response = await departmentsApi.update(id, data as Parameters<typeof departmentsApi.update>[1]);
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
      await departmentsApi.delete(id);
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
      const response = await departmentsApi.createSubsidiary(data as Parameters<typeof departmentsApi.createSubsidiary>[0]);
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
      const response = await departmentsApi.updateSubsidiary(id, data as Parameters<typeof departmentsApi.updateSubsidiary>[1]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsidiaries'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      showToast({ title: 'Subsidiary updated', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Failed to update subsidiary', variant: 'error' });
    },
  });
}

export function useDeleteSubsidiary() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await departmentsApi.deleteSubsidiary(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subsidiaries'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      showToast({ title: 'Subsidiary deleted', variant: 'success' });
    },
    onError: (err) => {
      showToast({ title: 'Failed to delete subsidiary', description: getErrorMessage(err), variant: 'error' });
    },
  });
}
