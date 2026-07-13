'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, ChevronLeft, ChevronRight, Search, Filter, Download } from 'lucide-react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AuditActor { id: string; firstName: string; lastName: string; email: string; }
interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  meta: Record<string, unknown> | null;
  ipAddress: string | null;
  statusCode: number;
  createdAt: string;
  actor: AuditActor | null;
}
interface AuditResponse { data: AuditLogEntry[]; total: number; page: number; lastPage: number; }

const RESOURCES = ['', 'auth', 'users', 'mail', 'distribution-lists', 'announcements', 'files', 'channels', 'chat', '2fa'];

async function fetchLogs(params: Record<string, string | number>): Promise<AuditResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== 0) query.set(k, String(v)); });
  const res = await api.get<AuditResponse>(`/audit?${query.toString()}`);
  return res.data;
}

function StatusBadge({ code }: { code: number }) {
  const cls = code < 300 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : code < 500 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return <span className={cn('px-1.5 py-0.5 rounded text-xs font-mono font-medium', cls)}>{code}</span>;
}

function MethodBadge({ action }: { action: string }) {
  const method = (action.split('_')[0] ?? 'unknown').toUpperCase();
  const cls = method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    : method === 'PATCH' || method === 'PUT' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-muted text-muted-foreground';
  return <span className={cn('px-1.5 py-0.5 rounded text-xs font-semibold', cls)}>{method}</span>;
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({ action: '', resource: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () => fetchLogs({ ...filters, page, limit: 50 }),
    placeholderData: (prev) => prev,
  });

  const applyFilter = (e: React.FormEvent) => { e.preventDefault(); setPage(1); };

  const downloadCsv = () => {
    const rows = data?.data ?? [];
    const header = 'Time,Actor,Action,Resource,ResourceId,IP,Status';
    const csv = [header, ...rows.map(r =>
      [r.createdAt, r.actorEmail ?? r.actorId ?? 'system', r.action, r.resource, r.resourceId ?? '', r.ipAddress ?? '', r.statusCode].join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminGuard requiredRoles={['group_admin', 'subsidiary_admin']}>
      <div className="flex flex-col gap-6 p-4 md:p-6 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
              <p className="text-sm text-muted-foreground">All mutating actions across the system</p>
            </div>
          </div>
          <button onClick={downloadCsv} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <form onSubmit={applyFilter} className="flex flex-wrap gap-3 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" /> Filters:
          </div>
          <input
            value={filters.action}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            placeholder="Action (e.g. post_users)"
            className="flex-1 min-w-32 px-3 py-1.5 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={filters.resource}
            onChange={e => setFilters(f => ({ ...f, resource: e.target.value }))}
            className="px-3 py-1.5 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {RESOURCES.map(r => <option key={r} value={r}>{r || 'All resources'}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="px-3 py-1.5 text-sm border border-input rounded-md bg-background text-foreground" />
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="px-3 py-1.5 text-sm border border-input rounded-md bg-background text-foreground" />
          <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md">
            <Search className="h-3.5 w-3.5" /> Apply
          </button>
        </form>

        {/* Table */}
        <div className={cn('bg-card border border-border rounded-lg overflow-hidden', isFetching && 'opacity-70')}>
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : !data?.data.length ? (
            <div className="py-16 text-center text-muted-foreground">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No audit entries found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Time</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Actor</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Resource</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">IP</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map(entry => (
                    <>
                      <tr
                        key={entry.id}
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap font-mono">
                          {format(new Date(entry.createdAt), 'dd MMM HH:mm:ss')}
                        </td>
                        <td className="px-4 py-2.5 max-w-48 truncate">
                          <span className="text-foreground">{entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : (entry.actorEmail ?? 'system')}</span>
                          {entry.actorEmail && <span className="ml-1 text-xs text-muted-foreground">({entry.actorEmail})</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <MethodBadge action={entry.action} />
                            <span className="text-foreground font-mono text-xs">{entry.action}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-foreground">{entry.resource}</span>
                          {entry.resourceId && (
                            <span className="ml-1 font-mono text-xs text-muted-foreground">…{entry.resourceId.slice(-8)}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{entry.ipAddress ?? '—'}</td>
                        <td className="px-4 py-2.5"><StatusBadge code={entry.statusCode} /></td>
                      </tr>
                      {expandedId === entry.id && (
                        <tr key={`${entry.id}-expanded`} className="bg-muted/20">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="text-xs space-y-1">
                              <p className="text-muted-foreground">Resource ID: <span className="font-mono text-foreground">{entry.resourceId ?? '—'}</span></p>
                              {entry.meta && (
                                <pre className="mt-1 p-2 bg-muted rounded font-mono overflow-x-auto">
                                  {JSON.stringify(entry.meta, null, 2)}
                                </pre>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && (data.lastPage ?? 0) > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{data.total} total entries</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-foreground font-medium">Page {data.page} of {data.lastPage}</span>
              <button onClick={() => setPage(p => Math.min(data.lastPage, p + 1))} disabled={page === data.lastPage}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
