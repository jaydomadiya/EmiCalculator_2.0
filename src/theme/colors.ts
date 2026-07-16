export const THEME = {
  headerFrom: '#0A3D2E',
  headerTo: '#145C42',
  screenBg: '#FAF9F6',
  cardBg: '#FFFFFF',
  text: '#16241F',
  subtext: '#6B7A74',
  border: '#EAE6DC',
  gold: '#C9A24B',
  goldDark: '#A8842E',
  primary: '#145C42',
  primaryDark: '#0A3D2E',
  navActive: '#145C42',
  navInactive: '#A3ACA6',
  dotInactive: '#E1DCCE',
};

export const CATEGORY_PALETTE = {
  emerald: '#1E7A54',
  amber: '#C98A3E',
  indigo: '#4C5A8F',
  rose: '#B5657D',
  teal: '#2E7D8C',
  violet: '#7C6A9E',
  gold: '#C9A24B',
  sky: '#3E7CA6',
  coral: '#C97552',
  plum: '#8B6F9E',
};

export const CHART_PALETTE = {
  principal: THEME.primary,
  interest: THEME.gold,
  tax: '#5C7A99',
  pmi: '#B5657D',
  hoa: '#8B6F9E',
};

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
