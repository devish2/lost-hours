import { useColorScheme } from 'react-native';

export type ThemedScreenColors = {
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  heroAccent: string;
};

const light: ThemedScreenColors = {
  background: '#f4f4f5',
  card: '#ffffff',
  textPrimary: '#111111',
  textSecondary: '#333333',
  textMuted: '#666666',
  border: '#e4e4e7',
  heroAccent: '#1a1a1a',
};

const dark: ThemedScreenColors = {
  background: '#0f0f10',
  card: '#1c1c1e',
  textPrimary: '#f5f5f5',
  textSecondary: '#d4d4d8',
  textMuted: '#a1a1aa',
  border: '#3f3f46',
  heroAccent: '#fafafa',
};

export function useThemedScreenColors(): ThemedScreenColors {
  return useColorScheme() === 'dark' ? dark : light;
}
