import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional classNames and resolves Tailwind conflicts.
 * Standard shadcn/ui convention.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
