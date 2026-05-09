export interface Trade {
  id: string;
  assetClass: 'Stocks' | 'Crypto' | 'Forex';
  symbol: string;
  direction: 'Long' | 'Short';
  entryDate: string; // ISO string
  exitDate: string; // ISO string
  entryPrice: number;
  exitPrice: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  quantity: number;
  fees: number;
  rMultiple: number;
  setup: string;
  netPnL: number;
  executionErrors: string[];
  thesis?: string;
  screenshotUrl?: string;
  notes?: string;
}

export interface DailySentiment {
  date: string; // YYYY-MM-DD
  mood: 'Disciplined' | 'FOMO' | 'Tilted' | 'Confident' | 'Anxious';
  notes: string;
}

export interface AppState {
  trades: Trade[];
  sentiments: Record<string, DailySentiment>;
}
