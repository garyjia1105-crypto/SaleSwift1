
import React, { createContext, useContext } from 'react';
import { Theme } from '../App';
import { getThemeColors } from '../utils/theme';

interface ThemeContextType {
  theme: Theme;
  colors: ReturnType<typeof getThemeColors>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ theme: Theme; children: React.ReactNode }> = ({ theme, children }) => {
  const colors = getThemeColors(theme);
  return <ThemeContext.Provider value={{ theme, colors }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
