import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => { loadTheme(); }, []);

  const loadTheme = async () => {
    const saved = await AsyncStorage.getItem('isDark');
    if (saved !== null) setIsDark(JSON.parse(saved));
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('isDark', JSON.stringify(newTheme));
  };

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      background: isDark ? '#121212' : '#F5F5F5',
      card: isDark ? '#1e1e1e' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#121212',
      subText: isDark ? '#888' : '#666',
      primary: '#FF0000',
      border: isDark ? '#333' : '#DDD',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};