'use client';

import { useQuery } from '@tanstack/react-query';
import { useUpdateNotificationPreferences } from '@/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import type { User } from '@/types/user.types';
import { useState, useEffect } from 'react';

export default function SettingsNotificationsPage() {
  const [emailDigest, setEmailDigest] = useState<'daily' | 'weekly' | 'never'>('daily');
  const [inAppSounds, setInAppSounds] = useState(() => {
    try { return localStorage.getItem('dims:inAppSounds') !== 'false'; } catch { return true; }
  });
  const [isDirty, setIsDirty] = useState(false);
  const { showToast } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get<{ data: User }>('/auth/me');
      return response.data.data;
    },
  });

  const updatePreferences = useUpdateNotificationPreferences();

  useEffect(() => {
    if (user) {
      setEmailDigest('daily');
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        emailDigest,
        inAppSounds,
      });
      // Persist sound preference locally so the sound hook can read it without a backend round-trip
      try { localStorage.setItem('dims:inAppSounds', String(inAppSounds)); } catch { /* noop */ }
      setIsDirty(false);
      showToast({ title: 'Notification preferences saved', variant: 'success' });
    } catch {
      showToast({ title: 'Failed to save preferences', variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">Manage how you receive notifications</p>
      </div>

      <div className="space-y-4">
        {/* Email Digest */}
        <div className="border-b border-border pb-4">
          <h3 className="font-medium text-foreground mb-3">Email Digest</h3>
          <div className="space-y-2">
            {(['daily', 'weekly', 'never'] as const).map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="email-digest"
                  value={option}
                  checked={emailDigest === option}
                  onChange={(e) => {
                    setEmailDigest(e.target.value as 'daily' | 'weekly' | 'never');
                    setIsDirty(true);
                  }}
                  className="h-4 w-4"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {option === 'daily' && 'Daily'}
                    {option === 'weekly' && 'Weekly'}
                    {option === 'never' && 'Never'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option === 'daily' && 'Get a summary of your notifications daily'}
                    {option === 'weekly' && 'Get a summary of your notifications weekly'}
                    {option === 'never' && 'Disable email digest'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* In-App Sounds */}
        <div>
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">In-app sounds</p>
              <p className="text-xs text-muted-foreground">Play sound effects for notifications</p>
            </div>
            <input
              type="checkbox"
              checked={inAppSounds}
              onChange={(e) => {
                setInAppSounds(e.target.checked);
                setIsDirty(true);
              }}
              className="h-5 w-5 rounded"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      {isDirty && (
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={updatePreferences.isPending}
            className="flex-1"
          >
            {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      )}
    </div>
  );
}
