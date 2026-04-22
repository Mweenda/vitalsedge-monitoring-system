import React from 'react';
import { clsx } from 'clsx';

export interface FormGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  title,
  description,
  children,
  className,
  required = false
}) => {
  return (
    <div className={clsx('space-y-4', className)}>
      {title && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {title}
            {required && (
              <span className="text-sm text-red-500">*</span>
            )}
          </h3>
          {description && (
            <p className="text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={clsx('space-y-4', !title && 'pt-4')}>
        {children}
      </div>
    </div>
  );
};
