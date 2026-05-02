'use client';

import { useProctoringStore } from '@/lib/stores/proctoring-store';

export function ProctoringStatusChip() {
  const proctoringStore = useProctoringStore();
  const { isCameraEnabled, faceDetected, tabSwitchCount, maxTabSwitches } =
    proctoringStore;

  // Determine status
  let status = 'monitored';
  let statusText = 'Monitored';
  let dotColor = 'bg-green-500';
  let showBadge = false;
  let badgeCount = 0;

  if (!isCameraEnabled) {
    status = 'camera-off';
    statusText = 'Camera off';
    dotColor = 'bg-red-500';
  } else if (!faceDetected) {
    status = 'no-face';
    statusText = 'Face not detected';
    dotColor = 'bg-amber-500';
  } else if (tabSwitchCount > 0) {
    showBadge = true;
    badgeCount = tabSwitchCount;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border">
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="text-sm font-medium text-foreground">{statusText}</span>
      {showBadge && (
        <div className="ml-1 px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded-full font-semibold">
          {badgeCount}/{maxTabSwitches}
        </div>
      )}
    </div>
  );
}
