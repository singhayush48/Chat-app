import { useEffect } from 'react';
import { ThemeContext } from './theme-context';

/**
 * The product spec is dark-mode-only for now. We still model this as a
 * context (rather than hardcoding classes everywhere) so that adding a
 * light theme later is a localized change instead of a rewrite.
 */
export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const value = { theme: 'dark' };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
