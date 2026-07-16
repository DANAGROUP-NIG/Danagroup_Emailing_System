'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Globe, Lock, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface DLMember { id: string; userId: string; user: { id: string; email: string; firstName: string; lastName: string; }; }
interface DL { id: string; name: string; email: string; description: string | null; isPublic: boolean; ownerId: string; members: DLMember[]; }

const fetchLists = async (): Promise<DL[]> => (await api.get<DL[]>('/distribution-lists')).data;
const createList = async (data: { name: string; email: string; description: string; isPublic: boolean }) =>
  (await api.post<DL>('/distribution-lists', data)).data;
const deleteList = async (id: string) => api.delete(`/distribution-lists/${id}`);
const removeMember = async ({ listId, userId }: { listId: string; userId: string }) =>
  api.delete(`/distribution-lists/${listId}/members/${userId}`);

export default function DistributionListsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', description: '', isPublic: false });
  const [formError, setFormError] = useState('');

  const { data: lists = [], isLoading } = useQuery({ queryKey: ['dist-lists'], queryFn: fetchLists });

  const createMutation = useMutation({
    mutationFn: createList,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dist-lists'] }); setShowCreate(false); setForm({ name: '', email: '', description: '', isPublic: false }); },
    onError: (e: { response?: { data?: { message?: string } } }) => setFormError(e?.response?.data?.message ?? 'Failed to create list'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dist-lists'] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dist-lists'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.email.trim()) { setFormError('Name and email are required'); return; }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Distribution Lists</h2>
          <p className="text-sm text-muted-foreground mt-1">Create group email addresses that deliver to multiple recipients.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New List
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 bg-card border border-border rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Create Distribution List</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="All Staff" className="mt-1 w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email address *</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="all-staff@danagroup.net" type="email" className="mt-1 w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional description" className="mt-1 w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} className="rounded" />
            <span className="text-foreground">Visible to all users</span>
          </label>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={createMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md disabled:opacity-50">
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-md">Cancel</button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No distribution lists yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => (
            <div key={list.id} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    {list.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{list.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{list.email}</p>
                    {list.description && <p className="text-xs text-muted-foreground mt-0.5">{list.description}</p>}
                  </div>
                </div>
                <button onClick={() => deleteMutation.mutate(list.id)}
                  className="flex-shrink-0 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Members */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {list.members?.length ?? 0} member{list.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.members?.map(m => (
                    <span key={m.id} className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                      'bg-muted text-muted-foreground',
                    )}>
                      {m.user?.firstName} {m.user?.lastName}
                      <button onClick={() => removeMemberMutation.mutate({ listId: list.id, userId: m.userId })}
                        className="ml-0.5 hover:text-destructive">×</button>
                    </span>
                  ))}
                  {(!list.members || list.members.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">No members yet</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
