import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const alertConfig = {
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600'
  }
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  className
}) => {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div className={clsx(
      'rounded-lg border p-4 shadow-sm',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={clsx('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={clsx('text-sm font-semibold mb-1', config.textColor)}>
              {title}
            </h3>
          )}
          <p className={clsx('text-sm', config.textColor)}>
            {message}
          </p>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={clsx('flex-shrink-0 p-1 rounded-md hover:bg-gray-100', config.textColor)}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
