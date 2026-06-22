import { useEffect } from 'react';

interface KeyboardShortcutCallbacks {
  onCompose?: () => void;
  onNavDown?: () => void;
  onNavUp?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
  onReply?: () => void;
  onHelp?: () => void;
}

export function useMailKeyboardShortcuts(callbacks: KeyboardShortcutCallbacks) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input/textarea unless explicitly needed
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // c: Compose
      if (e.key === 'c' && !isInput && callbacks.onCompose) {
        e.preventDefault();
        callbacks.onCompose();
      }

      // j: Navigate down (next message)
      if (e.key === 'j' && !isInput && callbacks.onNavDown) {
        e.preventDefault();
        callbacks.onNavDown();
      }

      // k: Navigate up (previous message)
      if (e.key === 'k' && !isInput && callbacks.onNavUp) {
        e.preventDefault();
        callbacks.onNavUp();
      }

      // e: Archive
      if (e.key === 'e' && !isInput && callbacks.onArchive) {
        e.preventDefault();
        callbacks.onArchive();
      }

      // #: Delete
      if (e.key === '#' && !isInput && callbacks.onDelete) {
        e.preventDefault();
        callbacks.onDelete();
      }

      // s: Star/unstar
      if (e.key === 's' && !isInput && callbacks.onStar) {
        e.preventDefault();
        callbacks.onStar();
      }

      // r: Reply
      if (e.key === 'r' && !isInput && callbacks.onReply) {
        e.preventDefault();
        callbacks.onReply();
      }

      // ?: Help
      if (e.shiftKey && e.key === '?' && callbacks.onHelp) {
        e.preventDefault();
        callbacks.onHelp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}
