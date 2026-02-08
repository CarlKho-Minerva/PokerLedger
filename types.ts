export interface Player {
  id: string;
  name: string;
  avatar?: string; // Base64 string
  totalWinnings: number; // Positive or negative
  gamesPlayed: number;
}

export interface PlayerSessionInput {
  playerId: string;
  buyIn: number;
  cashOut: number;
}

export interface Settlement {
  fromId: string;
  toId: string;
  amount: number;
}

export interface GameSession {
  id: string;
  date: string;
  players: PlayerSessionInput[];
  settlements: Settlement[];
}

export type ViewState = 'DASHBOARD' | 'NEW_GAME' | 'PLAYERS' | 'HISTORY';