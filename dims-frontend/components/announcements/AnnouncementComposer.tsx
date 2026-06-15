'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Select from '@radix-ui/react-select';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateAnnouncement, useUpdateAnnouncement } from '@/hooks/useAnnouncements';
import { useSubsidiaries, useDepartments } from '@/hooks/useDirectory';
import type { Announcement, AnnouncementTarget } from '@/types/announcement.types';

const RichTextEditor = dynamic(
  () => import('@/components/mail/RichTextEditor').then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-md bg-muted" /> },
);

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Content is required'),
  target: z.enum(['all', 'subsidiary', 'department']),
  subsidiaryId: z.string().optional(),
  departmentId: z.string().optional(),
  isPinned: z.boolean().optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface AnnouncementComposerProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: Announcement;
}

export function AnnouncementComposer({ isOpen, onClose, announcement }: AnnouncementComposerProps) {
  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      target: 'all',
      isPinned: false,
    },
  });

  const [editorContent, setEditorContent] = useState('');
  const target = watch('target');
  const subsidiaryId = watch('subsidiaryId');

  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement(announcement?.id || '');
  const { data: subsidiariesData } = useSubsidiaries();
  const { data: departmentsData } = useDepartments(subsidiaryId);

  const isEditing = !!announcement;
  const isLoading = isEditing ? update.isPending : create.isPending;

  // Initialize form with announcement data if editing
  useEffect(() => {
    if (announcement && isOpen) {
      setValue('title', announcement.title);
      setValue('target', announcement.target);
      setValue('subsidiaryId', announcement.subsidiary?.id || '');
      setValue('departmentId', announcement.department?.id || '');
      setValue('isPinned', announcement.isPinned);
      setEditorContent(announcement.body);
    }
  }, [announcement, isOpen, setValue]);

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      const { subsidiaryId: _sid, departmentId: _did, isPinned: _pin, ...rest } = data;
      const payload = {
        ...rest,
        body: editorContent,
        ...(_pin !== undefined ? { isPinned: _pin } : {}),
        ...(rest.target !== 'all' && _sid ? { subsidiaryId: _sid } : {}),
        ...(rest.target === 'department' && _did ? { departmentId: _did } : {}),
      };

      if (isEditing) {
        await update.mutateAsync(payload);
      } else {
        await create.mutateAsync(payload);
      }

      reset();
      setEditorContent('');
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setEditorContent('');
      onClose();
    }
  };

  const subsidiaries = subsidiariesData || [];
  const departments = departmentsData || [];

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background border border-border rounded-lg shadow-dana-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background">
            <h2 className="text-xl font-semibold text-foreground">
              {isEditing ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <button
              onClick={() => handleOpenChange(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                {...register('title')}
                placeholder="Announcement title"
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-xs text-danger">{errors.title.message}</p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Content</label>
              <RichTextEditor
                value={editorContent}
                onChange={(html) => setEditorContent(html)}
                placeholder="Write your announcement..."
              />
              {!editorContent && (
                <p className="text-xs text-danger">Content is required</p>
              )}
            </div>

            {/* Target Audience */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Target Audience</label>
              <RadioGroup.Root
                value={target}
                onValueChange={(value) => {
                  setValue('target', value as AnnouncementTarget);
                  if (value !== 'subsidiary') setValue('subsidiaryId', '');
                  if (value !== 'department') setValue('departmentId', '');
                }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroup.Item value="all" id="target-all" className="w-4 h-4" />
                  <label htmlFor="target-all" className="text-sm text-foreground cursor-pointer">
                    Company-wide (all employees)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroup.Item value="subsidiary" id="target-subsidiary" className="w-4 h-4" />
                  <label htmlFor="target-subsidiary" className="text-sm text-foreground cursor-pointer">
                    Subsidiary-specific
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroup.Item value="department" id="target-department" className="w-4 h-4" />
                  <label htmlFor="target-department" className="text-sm text-foreground cursor-pointer">
                    Department-specific
                  </label>
                </div>
              </RadioGroup.Root>
            </div>

            {/* Subsidiary Selection */}
            {(target === 'subsidiary' || target === 'department') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Subsidiary</label>
                <Select.Root
                  value={subsidiaryId || ''}
                  onValueChange={(value) => {
                    setValue('subsidiaryId', value);
                    setValue('departmentId', '');
                  }}
                >
                  <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                    <Select.Value placeholder="Select subsidiary..." />
                    <Select.Icon>
                      <ChevronDown size={16} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Content className="bg-background border border-border rounded-md shadow-dana-md z-50">
                    {subsidiaries.map((sub) => (
                      <Select.Item key={sub.id} value={sub.id} className="px-3 py-2 hover:bg-primary/10 cursor-pointer">
                        {sub.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>
            )}

            {/* Department Selection */}
            {target === 'department' && subsidiaryId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department</label>
                <Select.Root
                  value={watch('departmentId') || ''}
                  onValueChange={(value) => setValue('departmentId', value)}
                >
                  <Select.Trigger className="flex items-center justify-between w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                    <Select.Value placeholder="Select department..." />
                    <Select.Icon>
                      <ChevronDown size={16} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Content className="bg-background border border-border rounded-md shadow-dana-md z-50">
                    {departments.map((dept) => (
                      <Select.Item key={dept.id} value={dept.id} className="px-3 py-2 hover:bg-primary/10 cursor-pointer">
                        {dept.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>
            )}

            {/* Pin Option */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin"
                {...register('isPinned')}
                className="w-4 h-4 border border-border rounded"
              />
              <label htmlFor="pin" className="text-sm text-foreground cursor-pointer">
                Pin to top of announcements feed
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                isLoading={isLoading}
                className="flex-1"
              >
                {isEditing ? 'Update' : 'Post'} Announcement
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
