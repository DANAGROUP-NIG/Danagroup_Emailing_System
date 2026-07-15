'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  useCreateSubsidiary,
  useUpdateSubsidiary,
  useDeleteSubsidiary,
} from '@/hooks/useAdmin';
import { Plus, Building2, ImageIcon, MoreVertical } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Card } from '@/components/ui/Card';
import type { Subsidiary } from '@/types/user.types';
import { departmentsApi } from '@/lib/api/departments';

function SubsidiaryFormModal({
  isOpen,
  onClose,
  initialSub,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialSub?: Subsidiary | undefined;
}) {
  const [formData, setFormData] = useState(
    initialSub || { name: '', domain: '', description: '' }
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLogoFile(null);
    setFaviconFile(null);
  }, [initialSub?.id]);

  const createSub = useCreateSubsidiary();
  const updateSub = useUpdateSubsidiary();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialSub) {
      await updateSub.mutateAsync({ id: initialSub.id, data: formData });
      if (logoFile || faviconFile) {
        setIsUploading(true);
        try {
          if (logoFile) await departmentsApi.uploadSubsidiaryLogo(initialSub.id, logoFile);
          if (faviconFile) await departmentsApi.uploadSubsidiaryFavicon(initialSub.id, faviconFile);
        } finally {
          setIsUploading(false);
        }
      }
    } else {
      await createSub.mutateAsync(formData);
    }
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={initialSub ? 'Edit Subsidiary' : 'Create Subsidiary'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subsidiary Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="Internal Domain"
          placeholder="e.g. danaair.internal"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          required
        />
        <Input
          label="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          as="textarea"
          rows={3}
        />

        {initialSub && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <ImageIcon size={14} aria-hidden="true" />
              Branding
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Logo</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground hover:file:bg-primary-hover"
                />
                {initialSub.logoUrl && (
                  <img
                    src={initialSub.logoUrl}
                    alt="Current logo"
                    className="mt-2 h-8 w-auto object-contain"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Favicon</label>
                <input
                  type="file"
                  accept="image/x-icon,image/png,image/svg+xml,image/webp"
                  onChange={(e) => setFaviconFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground hover:file:bg-primary-hover"
                />
                {initialSub.faviconUrl && (
                  <img
                    src={initialSub.faviconUrl}
                    alt="Current favicon"
                    className="mt-2 h-6 w-auto object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={createSub.isPending || updateSub.isPending || isUploading}
          >
            {initialSub ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AdminSubsidiariesPageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subsidiary | undefined>();

  const { data: subsData, isLoading } = useQuery<Subsidiary[]>({
    queryKey: ['subsidiaries'],
    queryFn: async () => {
      const response = await departmentsApi.listSubsidiaries();
      const result = Array.isArray(response.data) ? response.data : [];
      return result as Subsidiary[];
    },
  });
  const deleteSub = useDeleteSubsidiary();

  const filteredSubs = useMemo(() => {
    const subs = subsData || [];
    if (!searchQuery) return subs;
    return subs.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subsData, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl p-4 md:p-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subsidiaries</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all company subsidiaries</p>
        </div>
        <Button
          onClick={() => {
            setEditingSub(undefined);
            setIsFormOpen(true);
          }}
          variant="primary"
        >
          <Plus size={16} className="mr-2" />
          Create Subsidiary
        </Button>
      </div>

      <Input
        placeholder="Search subsidiaries..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No subsidiaries found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubs.map((sub) => (
            <Card key={sub.id} className="p-6 hover:shadow-dana-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {sub.logoUrl ? (
                    <img
                      src={sub.logoUrl}
                      alt={`${sub.name} logo`}
                      className="h-10 w-auto max-w-[120px] object-contain rounded border border-border bg-white p-1"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                      <Building2 size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{sub.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{sub.domain}</p>
                  </div>
                </div>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="text-primary hover:text-primary-hover transition-colors p-1">
                      <MoreVertical size={18} />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" className="w-40 bg-card border border-border rounded-md shadow-dana-md p-1 z-50">
                    <DropdownMenu.Item asChild>
                      <button
                        onClick={() => {
                          setEditingSub(sub);
                          setIsFormOpen(true);
                        }}
                        className="w-full px-3 py-2 text-sm text-foreground hover:bg-primary/10 rounded transition-colors text-left"
                      >
                        Edit
                      </button>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this subsidiary?')) {
                            deleteSub.mutate(sub.id);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm text-danger hover:bg-danger-light rounded transition-colors text-left"
                      >
                        Delete
                      </button>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
              {sub.description && (
                <p className="text-sm text-foreground mb-4">{sub.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {sub.faviconUrl && (
                  <div className="flex items-center gap-1.5">
                    <img
                      src={sub.faviconUrl}
                      alt="favicon"
                      className="h-4 w-4 object-contain"
                    />
                    <span>Favicon set</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Created {new Date(sub.createdAt).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}

      <SubsidiaryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSub(undefined);
        }}
        initialSub={editingSub}
      />
    </div>
  );
}

export default function AdminSubsidiariesPage() {
  return (
    <AdminGuard requiredRoles={['group_admin']}>
      <AdminSubsidiariesPageContent />
    </AdminGuard>
  );
}
