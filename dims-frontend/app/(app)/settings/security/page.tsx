'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface TotpSetup { otpauthUrl: string; qrDataUrl: string; secret: string; }
interface TotpStatus { totpEnabled: boolean; }

async function fetchTotpStatus(): Promise<TotpStatus> {
  const res = await api.get<TotpStatus>('/2fa/status');
  return res.data;
}
async function fetchSetup(): Promise<TotpSetup> {
  const res = await api.get<TotpSetup>('/2fa/setup');
  return res.data;
}
async function confirmEnable(token: string): Promise<void> {
  await api.post('/2fa/confirm', { token });
}
async function disable2fa(token: string): Promise<void> {
  await api.post('/2fa/disable', { token });
}

export default function SettingsSecurityPage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: fetchTotpStatus,
  });

  const { data: setup, isLoading: setupLoading, isError: setupError, refetch: refetchSetup } = useQuery({
    queryKey: ['2fa-setup'],
    queryFn: fetchSetup,
    enabled: mode === 'setup',
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmEnable(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['2fa-status'] });
      setMode('idle');
      setToken('');
      setError('');
      setSuccess('Two-factor authentication enabled successfully.');
    },
    onError: () => setError('Invalid code. Please try again.'),
  });

  const disableMutation = useMutation({
    mutationFn: () => disable2fa(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['2fa-status'] });
      setMode('idle');
      setToken('');
      setError('');
      setSuccess('Two-factor authentication has been disabled.');
    },
    onError: () => setError('Invalid code. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (mode === 'setup') confirmMutation.mutate();
    if (mode === 'disable') disableMutation.mutate();
  };

  const isPending = confirmMutation.isPending || disableMutation.isPending;

  if (statusLoading) {
    return <div className="h-40 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add an extra layer of security using a TOTP authenticator app (Google Authenticator, Authy, etc.)
        </p>
      </div>

      {/* Status card */}
      <div className={cn(
        'flex items-start gap-4 p-4 rounded-lg border-2',
        status?.totpEnabled ? 'border-green-500/40 bg-green-500/5' : 'border-border bg-card',
      )}>
        {status?.totpEnabled
          ? <ShieldCheck className="h-8 w-8 text-green-500 flex-shrink-0 mt-0.5" />
          : <ShieldOff className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-0.5" />
        }
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {status?.totpEnabled ? '2FA is enabled' : '2FA is not enabled'}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {status?.totpEnabled
              ? 'Your account is protected with a time-based one-time password.'
              : 'Enable 2FA to protect your account with an additional verification step at login.'}
          </p>
        </div>
        {mode === 'idle' && (
          <button
            onClick={() => { setMode(status?.totpEnabled ? 'disable' : 'setup'); setError(''); setSuccess(''); }}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              status?.totpEnabled
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {status?.totpEnabled ? 'Disable' : 'Enable 2FA'}
          </button>
        )}
      </div>

      {/* Success/error feedback */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      )}

      {/* Setup flow */}
      {mode === 'setup' && (
        <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
          <p className="text-sm font-medium text-foreground">
            1. Scan the QR code below with your authenticator app
          </p>
          {setupLoading ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-48 w-48 rounded-lg border border-border bg-muted animate-pulse" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating QR code…
              </div>
            </div>
          ) : setupError ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to generate QR code. Please try again.</p>
              <button
                type="button"
                onClick={() => refetchSetup()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-muted text-foreground rounded-md hover:bg-muted/80"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : setup ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-6 flex-wrap">
                <img
                  src={setup.qrDataUrl}
                  alt="Scan this QR code with your authenticator app"
                  className="h-48 w-48 rounded-lg border border-border bg-white p-1"
                />
                <div className="flex flex-col gap-2 text-sm">
                  <p className="text-muted-foreground">Scan with Google Authenticator, Authy, or any TOTP app.</p>
                  <details className="text-xs">
                    <summary className="text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
                      Can&apos;t scan? Use manual key ›
                    </summary>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">Copy this key into your app:</p>
                      <code className="block p-2 bg-muted rounded font-mono break-all select-all text-foreground">
                        {setup.secret}
                      </code>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ) : null}
          <p className="text-sm font-medium text-foreground">2. Enter the 6-digit code from your app</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6,8}"
              maxLength={8}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-40 px-3 py-2 text-center text-lg font-mono tracking-widest border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={token.length < 6 || isPending}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify & Enable
              </button>
              <button type="button" onClick={() => { setMode('idle'); setToken(''); }} className="px-4 py-2 text-sm font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disable flow */}
      {mode === 'disable' && (
        <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
          <p className="text-sm text-foreground">
            Enter a current 6-digit code from your authenticator app to confirm disabling 2FA.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6,8}"
              maxLength={8}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-40 px-3 py-2 text-center text-lg font-mono tracking-widest border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={token.length < 6 || isPending}
                className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Disable 2FA
              </button>
              <button type="button" onClick={() => { setMode('idle'); setToken(''); }} className="px-4 py-2 text-sm font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
