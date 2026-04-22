import React from 'react';
import { clsx } from 'clsx';

const fieldBase = clsx(
  'w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all duration-200',
  'bg-white/70 backdrop-blur-md border-white/60 text-neutral-900 shadow-sm',
  'placeholder:text-neutral-400',
  'dark:bg-white/8 dark:border-white/15 dark:text-white dark:placeholder:text-white/40',
  'focus:border-blue-400/80 focus:ring-2 focus:ring-blue-400/20',
  'dark:focus:border-blue-400/60 dark:focus:ring-blue-400/15',
  'hover:border-neutral-300/80 dark:hover:border-white/25',
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const GlassInput: React.FC<InputProps> = ({ label, hint, error, className, id, name, ...props }) => {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const fieldName = name ?? fieldId;
  const messageId = `${fieldId}-message`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/50">
          {label}
        </label>
      )}
      <input
        {...props}
        id={fieldId}
        name={fieldName}
        aria-describedby={hint || error ? messageId : undefined}
        className={clsx(fieldBase, error && 'border-red-400/80 ring-2 ring-red-400/20', className)}
      />
      {hint && !error && <p id={messageId} className="text-[11px] text-neutral-400 dark:text-white/35">{hint}</p>}
      {error && <p id={messageId} className="text-[11px] text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const GlassSelect: React.FC<SelectProps> = ({ label, hint, error, className, children, id, name, ...props }) => {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const fieldName = name ?? fieldId;
  const messageId = `${fieldId}-message`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/50">
          {label}
        </label>
      )}
      <select
        {...props}
        id={fieldId}
        name={fieldName}
        aria-describedby={hint || error ? messageId : undefined}
        className={clsx(
          fieldBase,
          'cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat',
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")]',
          error && 'border-red-400/80 ring-2 ring-red-400/20',
          className,
        )}
      >
        {children}
      </select>
      {hint && !error && <p id={messageId} className="text-[11px] text-neutral-400 dark:text-white/35">{hint}</p>}
      {error && <p id={messageId} className="text-[11px] text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const GlassTextarea: React.FC<TextareaProps> = ({ label, hint, error, className, id, name, ...props }) => {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const fieldName = name ?? fieldId;
  const messageId = `${fieldId}-message`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/50">
          {label}
        </label>
      )}
      <textarea
        {...props}
        id={fieldId}
        name={fieldName}
        aria-describedby={hint || error ? messageId : undefined}
        className={clsx(fieldBase, 'resize-none', error && 'border-red-400/80 ring-2 ring-red-400/20', className)}
      />
      {hint && !error && <p id={messageId} className="text-[11px] text-neutral-400 dark:text-white/35">{hint}</p>}
      {error && <p id={messageId} className="text-[11px] text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

export const GlassFieldset: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className }) => (
  <div
    className={clsx(
      'rounded-2xl border p-6',
      'bg-white/60 backdrop-blur-xl border-white/70 shadow-xl shadow-black/5',
      'dark:bg-white/6 dark:border-white/12 dark:shadow-black/40',
      className,
    )}
  >
    {title && (
      <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-white/50">
        {title}
      </h3>
    )}
    {children}
  </div>
);

export const GlassModal: React.FC<{
  children: React.ReactNode;
  onClose?: () => void;
}> = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex min-h-full items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:p-6"
    onClick={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}
  >
    {children}
  </div>
);
