import { Calendar, Map, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Page } from '../types';

export const NAV_ITEMS: { page: Page; icon: LucideIcon; label: string }[] = [
  { page: 'top', icon: Zap, label: 'Today' },
  { page: 'calendar', icon: Calendar, label: 'カレンダー' },
  { page: 'goals', icon: Map, label: '目標マップ' },
];
