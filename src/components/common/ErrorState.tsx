import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}) => (
  <div
    className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50/80 px-6 py-12 text-center"
    role="alert"
  >
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
      <AlertCircle className="h-7 w-7 text-red-600" aria-hidden />
    </div>
    <div>
      <h2 className="text-base font-semibold text-red-900">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-red-800/90">{message}</p>
    </div>
    {onRetry && (
      <Button type="button" variant="secondary" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
  </div>
);
