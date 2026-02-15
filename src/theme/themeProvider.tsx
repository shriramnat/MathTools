import React, { createContext, useContext, useMemo } from 'react';
import { getTheme, type Theme } from './themes';

const ThemeContext = createContext<Theme>(getTheme('default'));

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  themeId: string;
  children: React.ReactNode;
}

export function ThemeProvider({ themeId, children }: ThemeProviderProps) {
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={{
          backgroundColor: theme.colors.bgPrimary,
          color: theme.colors.textPrimary,
          minHeight: '100vh',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}