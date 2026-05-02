'use client';

import { useEffect } from 'react';
import { useProctoringStore } from '@/lib/stores/proctoring-store';

interface ProctoringManagerProps {
  onTabSwitch?: () => void;
  onFullscreenExit?: () => void;
}

/**
 * ProctoringManager
 * Monitors for proctoring violations (tab switches, fullscreen exits, copy/paste)
 * Returns null for UI - it's purely a monitoring component
 */
export function ProctoringManager({
  onTabSwitch,
  onFullscreenExit,
}: ProctoringManagerProps) {
  const proctoringStore = useProctoringStore();

  // Monitor visibility changes (tab switches)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[v0] Tab switched away - recording violation');
        proctoringStore.recordTabSwitch();
        onTabSwitch?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [proctoringStore, onTabSwitch]);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;

      if (!isCurrentlyFullscreen && proctoringStore.isFullscreen) {
        console.log('[v0] Exited fullscreen - recording violation');
        proctoringStore.recordFullscreenExit();
        onFullscreenExit?.();
      }

      proctoringStore.setFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [proctoringStore, onFullscreenExit]);

  // Disable right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Disable copy, cut, paste
  useEffect(() => {
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    ['copy', 'cut', 'paste'].forEach((eventType) => {
      document.addEventListener(eventType, handleCopyPaste as EventListener);
    });

    return () => {
      ['copy', 'cut', 'paste'].forEach((eventType) => {
        document.removeEventListener(eventType, handleCopyPaste as EventListener);
      });
    };
  }, []);

  // This component doesn't render anything
  return null;
}
