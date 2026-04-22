import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DegradedBannerProps {
  message?: string;
}

export function DegradedBanner({
  message = 'Limited connectivity. Some write actions are temporarily unavailable.',
}: DegradedBannerProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[70] border-t border-amber-300 bg-amber-100/95 px-4 py-2 text-amber-950 shadow-sm backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-xs font-semibold sm:text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        <span>{message}</span>
      </div>
    </div>
  );
}
