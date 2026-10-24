import type { ColorSchemeName } from 'react-native';

// Match native screens, including before web hydration.
export function useColorScheme(): ColorSchemeName {
  return 'light';
}
