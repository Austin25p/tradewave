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

export interface Task {
  id: string;
  title: string;
  project: string; // can be used for colour coding or grouping
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string; // ISO string
  createdAt: string; // ISO string
  repeat: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  completed: boolean;
}

export interface AppState {
  trades: Trade[];
  sentiments: Record<string, DailySentiment>;
  tasks: Task[];
}
