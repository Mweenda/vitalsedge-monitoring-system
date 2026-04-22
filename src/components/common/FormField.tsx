import React from 'react';
import { clsx } from 'clsx';

export interface FormFieldProps {
  label: string;
  id: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  autoComplete,
  className,
  leftIcon,
  rightIcon
}) => {
  return (
    <div className={clsx('space-y-2', className)}>
      <label 
        htmlFor={id}
        className={clsx(
          'block text-sm font-medium text-gray-700 dark:text-gray-300',
          required && 'after:content:["*"] after:ml-1 after:text-red-500'
        )}
      >
        {label}
      </label>
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder={placeholder}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? 'true' : 'false'}
          className={clsx(
            'w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400',
            'bg-white text-gray-900 dark:bg-neutral-800 dark:text-white dark:border-neutral-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-neutral-900',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error ? 'border-red-500 text-red-900 dark:text-red-400' : 'border-gray-300'
          )}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
