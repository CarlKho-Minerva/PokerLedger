import { ChartPie, Users, History, PlusCircle } from 'lucide-react';

export const STORAGE_KEY = 'poker_club_data_v1';

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: ChartPie },
  { id: 'NEW_GAME', label: 'New Game', icon: PlusCircle },
  { id: 'PLAYERS', label: 'Players', icon: Users },
  { id: 'HISTORY', label: 'History', icon: History },
] as const;
