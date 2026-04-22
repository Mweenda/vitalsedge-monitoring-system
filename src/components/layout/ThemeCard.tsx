import React from 'react';
import { clsx } from 'clsx';

export type ThemeCardVariant = 'dashboard' | 'hero';

export interface ThemeCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  variant?: ThemeCardVariant;
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Authenticated-area card (docs): rounded-2xl, neutral border, light/dark.
 * `hero` matches the HomePage gradient shell (translucent on dark).
 */
export const ThemeCard: React.FC<ThemeCardProps> = ({
  children,
  className,
  padding = 'md',
  variant = 'dashboard',
}) => (
  <div
    data-testid="theme-card"
    className={clsx(
      'rounded-2xl border shadow-sm',
      paddingMap[padding],
      variant === 'dashboard' &&
        'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
      variant === 'hero' &&
        'border-blue-500/20 bg-slate-800/50 backdrop-blur dark:border-blue-500/25',
      className,
    )}
  >
    {children}
  </div>
);
