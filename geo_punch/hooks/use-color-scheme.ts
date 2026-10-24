import type { ColorSchemeName } from 'react-native';

// GeoPunch uses one light palette so screens and cards stay consistent.
export function useColorScheme(): ColorSchemeName {
  return 'light';
}
