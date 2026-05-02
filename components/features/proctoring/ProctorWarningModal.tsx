'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type WarningType = 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'MULTIPLE_FACES' | 'NO_FACE';

interface ProctorWarningModalProps {
  open: boolean;
  type: WarningType;
  warningCount?: number;
  maxWarnings?: number;
  onDismiss: () => void;
  onReturnFullscreen?: () => void;
}

export function ProctorWarningModal({
  open,
  type,
  warningCount = 1,
  maxWarnings = 3,
  onDismiss,
  onReturnFullscreen,
}: ProctorWarningModalProps) {
  if (!open) return null;

  const isNonDismissible =
    type === 'FULLSCREEN_EXIT' || type === 'MULTIPLE_FACES';

  const getContent = () => {
    switch (type) {
      case 'TAB_SWITCH':
        return {
          icon: AlertCircle,
          title: 'You left the exam window',
          message: `Warning ${warningCount}/${maxWarnings}. You will be disqualified after ${maxWarnings} warnings.`,
          description: 'Please return to the exam and avoid switching tabs.',
        };

      case 'FULLSCREEN_EXIT':
        return {
          icon: Eye,
          title: 'Return to fullscreen to continue',
          message: 'The exam must be in fullscreen mode.',
          description: 'Click the button below to restore fullscreen mode.',
        };

      case 'MULTIPLE_FACES':
        return {
          icon: AlertTriangle,
          title: 'Multiple faces detected',
          message: 'Your session has been flagged for review.',
          description: 'Only one person should be taking this exam.',
        };

      case 'NO_FACE':
        return {
          icon: AlertTriangle,
          title: 'Face not detected',
          message: 'Please ensure your face is visible in the camera.',
          description: 'Adjust your position and ensure adequate lighting.',
        };

      default:
        return {
          icon: AlertCircle,
          title: 'Proctoring violation detected',
          message: 'Your session has been flagged.',
          description: '',
        };
    }
  };

  const content = getContent();
  const IconComponent = content.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => !isNonDismissible && onDismiss()}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm">
        <div className="bg-surface border border-border rounded-lg p-6 shadow-xl space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-red-500/10">
              <IconComponent className="w-6 h-6 text-red-500" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-lg font-bold text-foreground">
            {content.title}
          </h2>

          {/* Message */}
          <p className="text-center text-sm text-muted-foreground">
            {content.message}
          </p>

          {/* Description */}
          {content.description && (
            <p className="text-center text-xs text-muted-foreground">
              {content.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {type === 'FULLSCREEN_EXIT' ? (
              <Button
                onClick={() => {
                  onReturnFullscreen?.();
                  onDismiss();
                }}
                className="w-full"
              >
                Return to Fullscreen
              </Button>
            ) : isNonDismissible ? (
              <Button onClick={onDismiss} variant="outline" className="w-full">
                I Understand
              </Button>
            ) : (
              <Button onClick={onDismiss} className="w-full">
                Return to Quiz
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
