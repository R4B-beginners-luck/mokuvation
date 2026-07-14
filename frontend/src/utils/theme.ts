export type ThemeColorId = 'amber' | 'blue' | 'teal' | 'violet' | 'pink';

export type ThemeColorOption = {
  id: ThemeColorId;
  label: string;
  hex: string;
  rgb: string;
};

export const THEME_COLORS: ThemeColorOption[] = [
  { id: 'amber',  label: 'アンバー',     hex: '#E8A234', rgb: '232, 162, 52' },
  { id: 'blue',   label: 'ブルー',       hex: '#4D8FE8', rgb: '77, 143, 232' },
  { id: 'teal',   label: 'ティール',     hex: '#5AB5A0', rgb: '90, 181, 160' },
  { id: 'violet', label: 'バイオレット', hex: '#9B7FD4', rgb: '155, 127, 212' },
  { id: 'pink',   label: 'ピンク',       hex: '#D47A9B', rgb: '212, 122, 155' },
];

export const DEFAULT_THEME_COLOR_INDEX = 0 as const;
export type ThemeColorIndex = 0 | 1 | 2 | 3 | 4;

export function applyThemeColor(id: ThemeColorId) {
  const color = THEME_COLORS.find((item) => item.id === id);
  if (!color) return;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', color.hex);
  root.style.setProperty('--color-primary-rgb', color.rgb);
}

export function getThemeColorIdByIndex(index: number): ThemeColorId {
  const color = THEME_COLORS[index];
  return color ? color.id : THEME_COLORS[DEFAULT_THEME_COLOR_INDEX].id;
}

export function getThemeColorIndexById(id: ThemeColorId): ThemeColorIndex {
  const index = THEME_COLORS.findIndex((item) => item.id === id);
  return index === -1 ? DEFAULT_THEME_COLOR_INDEX : (index as ThemeColorIndex);
}

export function applyThemeColorIndex(index: ThemeColorIndex) {
  applyThemeColor(getThemeColorIdByIndex(index));
}

export function isThemeColorId(value: unknown): value is ThemeColorId {
  return typeof value === 'string' && THEME_COLORS.some((item) => item.id === value);
}

export function isThemeColorIndex(value: unknown): value is ThemeColorIndex {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < THEME_COLORS.length
  );
}
