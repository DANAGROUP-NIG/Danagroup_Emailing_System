'use client';

import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = "We're sorry, but something unexpected happened. Please try again.",
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-danger-light bg-danger-light/30 px-6 py-12 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-light">
        <AlertCircle className="h-8 w-8 text-danger" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {error && process.env.NODE_ENV === 'development' && (
          <p className="mt-2 text-xs font-mono text-danger">{error.message}</p>
        )}
      </div>

      {onRetry && (
        <Button onClick={onRetry} variant="primary" size="sm">
          <RotateCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  );
}
