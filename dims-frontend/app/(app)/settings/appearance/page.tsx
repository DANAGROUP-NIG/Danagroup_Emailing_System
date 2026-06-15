'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'light', label: 'Light', icon: Sun, description: 'Bright and clean interface' },
  { id: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes in low light' },
  { id: 'system', label: 'System', icon: Monitor, description: 'Match your device settings' },
];

export default function SettingsAppearancePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Theme</h2>
        <p className="text-sm text-muted-foreground mt-1">Customize how DIMS looks on your device</p>
      </div>

      {/* Theme Options */}
      <div className="space-y-3">
        {themes.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={cn(
              'w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all',
              theme === id
                ? 'border-primary bg-primary-light'
                : 'border-border hover:border-primary/30 bg-card'
            )}
          >
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0',
              theme === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            {theme === id && (
              <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary flex-shrink-0 mt-2" />
            )}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="mt-8 pt-8 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4">Preview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="h-16 bg-primary rounded-lg mb-3" />
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2 bg-muted rounded w-1/2" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="h-4 bg-foreground rounded mb-3 w-1/2" />
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded w-full" />
              <div className="h-2 bg-muted rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
