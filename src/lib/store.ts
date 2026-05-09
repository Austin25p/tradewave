import { Trade, DailySentiment } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Prompt SQL Schema Implementation Note:
 * 
 * CREATE TABLE Strategies (
 *   id UUID PRIMARY KEY,
 *   name VARCHAR(255) NOT NULL,
 *   description TEXT
 * );
 * 
 * CREATE TABLE DailySentiments (
 *   date DATE PRIMARY KEY,
 *   mood VARCHAR(50),
 *   notes TEXT
 * );
 * 
 * CREATE TABLE Trades (
 *   id UUID PRIMARY KEY,
 *   strategy_id UUID REFERENCES Strategies(id),
 *   asset_class VARCHAR(50),
 *   symbol VARCHAR(50),
 *   direction VARCHAR(10),
 *   entry_date TIMESTAMP,
 *   exit_date TIMESTAMP,
 *   entry_price DECIMAL,
 *   exit_price DECIMAL,
 *   quantity DECIMAL,
 *   fees DECIMAL,
 *   r_multiple DECIMAL,
 *   execution_errors JSONB,
 *   thesis TEXT,
 *   screenshot_url TEXT
 * );
 * 
 * For this browser-based prototype, we are using an in-memory store representing this schema.
 */

// Mock data
export const INITIAL_TRADES: Trade[] = [
  {
    id: uuidv4(),
    assetClass: 'Stocks',
    symbol: 'TSLA',
    direction: 'Long',
    entryDate: '2023-10-25T09:30:00Z',
    exitDate: '2023-10-25T11:00:00Z',
    entryPrice: 200,
    exitPrice: 210,
    quantity: 100,
    fees: 2.5,
    rMultiple: 2.0,
    setup: 'VWAP Bounce',
    netPnL: 997.5,
    executionErrors: [],
    thesis: 'Heavy volume off the VWAP support.',
    screenshotUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: uuidv4(),
    assetClass: 'Crypto',
    symbol: 'BTCUSD',
    direction: 'Short',
    entryDate: '2023-10-26T14:00:00Z',
    exitDate: '2023-10-26T16:00:00Z',
    entryPrice: 34000,
    exitPrice: 34500,
    quantity: 1,
    fees: 15,
    rMultiple: -1.0,
    setup: 'ORB',
    netPnL: -515,
    executionErrors: ['Moved Stop Loss prematurely'],
    thesis: 'Opening range breakdown structure looked clean.',
  },
  {
    id: uuidv4(),
    assetClass: 'Stocks',
    symbol: 'NVDA',
    direction: 'Long',
    entryDate: '2023-10-27T10:15:00Z',
    exitDate: '2023-10-27T14:30:00Z',
    entryPrice: 400,
    exitPrice: 420,
    quantity: 50,
    fees: 1.5,
    rMultiple: 3.5,
    setup: 'Moving Average Pullback',
    netPnL: 998.5,
    executionErrors: [],
    thesis: 'Pullback to 20 EMA on 15m chart.',
  }
];

export const INITIAL_SENTIMENTS: Record<string, DailySentiment> = {
  '2023-10-25': { date: '2023-10-25', mood: 'Disciplined', notes: 'Followed my plan perfectly today.' },
  '2023-10-26': { date: '2023-10-26', mood: 'FOMO', notes: 'Got chopped out trying to catch the breakdown, need to wait for confirmation.' },
  '2023-10-27': { date: '2023-10-27', mood: 'Confident', notes: 'Great read on the NVDA setup.' },
};
