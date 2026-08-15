import clinicalLight from './clinicalLight.json';
import orchid from './orchid.json';
import arctic from './arctic.json';
import verdant from './verdant.json';
import midnight from './midnight.json';
import slate from './slate.json';
import deep from './deep.json';

export interface ThemePreset {
  name: string;
  label: string;
  colorScheme?: 'light' | 'dark';
  cssVars: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}

export const themePresets: ThemePreset[] = [
  clinicalLight,
  orchid,
  arctic,
  verdant,
  midnight,
  slate,
  deep,
];
