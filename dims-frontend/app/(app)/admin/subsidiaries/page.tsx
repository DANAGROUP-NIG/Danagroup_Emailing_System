'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useCreateSubsidiary, useUpdateSubsidiary } from '@/hooks/useAdmin';
import { Plus, Building2 } from 'lucide-react';
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

  const createSub = useCreateSubsidiary();
  const updateSub = useUpdateSubsidiary();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialSub) {
      await updateSub.mutateAsync({ id: initialSub.id, data: formData });
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
        <div className="flex gap-2 pt-4">
          <Button type="submit" variant="primary" className="flex-1">
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
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{sub.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{sub.domain}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingSub(sub);
                    setIsFormOpen(true);
                  }}
                  className="text-primary hover:text-primary-hover transition-colors"
                >
                  Edit
                </button>
              </div>
              {sub.description && (
                <p className="text-sm text-foreground mb-4">{sub.description}</p>
              )}
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
