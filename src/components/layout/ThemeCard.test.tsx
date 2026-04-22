import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeCard } from './ThemeCard';

describe('ThemeCard', () => {
  it('renders children', () => {
    render(
      <ThemeCard>
        <span>Inside</span>
      </ThemeCard>,
    );
    expect(screen.getByText('Inside')).toBeInTheDocument();
  });

  it('applies dashboard variant surface classes', () => {
    const { container } = render(<ThemeCard variant="dashboard">A</ThemeCard>);
    const el = container.querySelector('[data-testid="theme-card"]');
    expect(el?.className).toMatch(/rounded-2xl/);
    expect(el?.className).toMatch(/border-neutral-200/);
  });

  it('applies hero variant for dark home shell', () => {
    const { container } = render(<ThemeCard variant="hero">A</ThemeCard>);
    const el = container.querySelector('[data-testid="theme-card"]');
    expect(el?.className).toContain('bg-slate-800/50');
  });
});
