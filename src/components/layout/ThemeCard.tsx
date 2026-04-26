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
 * Authenticated-area card (docs): rounded-xl, gray border, light theme.
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
      'rounded-xl border shadow-sm',
      paddingMap[padding],
      variant === 'dashboard' &&
        'border-gray-200 bg-white',
      variant === 'hero' &&
        'border-cyan-500/20 bg-slate-800/50 backdrop-blur',
      className,
    )}
  >
    {children}
  </div>
);
