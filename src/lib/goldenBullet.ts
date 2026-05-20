import { Trade } from './types';

// Named Functions Library replicating "Golden-Bullet Tracker" logic

/**
 * Determines if a trade occurred within the "Golden Bullet" time window.
 * Standard Golden Bullet windows (Eastern Standard Time / New York Time):
 * - London Session: 3:00 AM - 4:00 AM EST
 * - New York AM:   10:00 AM - 11:00 AM EST
 * - New York PM:   2:00 PM - 3:00 PM EST
 */
export const isGoldenBulletCompliant = (tradeDateIso: string): boolean => {
  const date = new Date(tradeDateIso);
  
  // Convert standard date to EST/EDT hours
  // We use a simple formatter to get the hour in New York
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const timeString = formatter.format(date);
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  
  const timeInMinutes = hour * 60 + minute;
  
  const londonWindowStart = 3 * 60; // 3:00 AM
  const londonWindowEnd = 4 * 60;   // 4:00 AM
  
  const nyAmWindowStart = 10 * 60;  // 10:00 AM
  const nyAmWindowEnd = 11 * 60;    // 11:00 AM
  
  const nyPmWindowStart = 14 * 60;  // 2:00 PM
  const nyPmWindowEnd = 15 * 60;    // 3:00 PM
  
  const isLondon = timeInMinutes >= londonWindowStart && timeInMinutes <= londonWindowEnd;
  const isNyAm = timeInMinutes >= nyAmWindowStart && timeInMinutes <= nyAmWindowEnd;
  const isNyPm = timeInMinutes >= nyPmWindowStart && timeInMinutes <= nyPmWindowEnd;
  
  return isLondon || isNyAm || isNyPm;
};

export const getMarketSession = (tradeDateIso: string): string => {
  const date = new Date(tradeDateIso);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const [hourStr, minuteStr] = formatter.format(date).split(':');
  const timeInMinutes = parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10);
  
  if (timeInMinutes >= 18 * 60 || timeInMinutes <= 3 * 60) return 'Asian';
  if (timeInMinutes > 3 * 60 && timeInMinutes < 8 * 60) return 'London';
  if (timeInMinutes >= 8 * 60 && timeInMinutes <= 12 * 60) return 'NY Overlap';
  if (timeInMinutes > 12 * 60 && timeInMinutes <= 17 * 60) return 'New York';
  
  return 'Other';
};

/**
 * Calculate Session-Specific PnL
 */
export const calculateSessionPnL = (trades: Trade[], session: 'Asian' | 'London' | 'NY Overlap' | 'New York' | 'Other'): number => {
  return trades
    .filter(t => getMarketSession(t.entryDate) === session)
    .reduce((sum, t) => sum + t.netPnL, 0);
};

/**
 * Win-Rate & Expectancy
 */
export const calculateAdvancedStats = (trades: Trade[]) => {
   const winningTrades = trades.filter(t => t.netPnL > 0);
   const losingTrades = trades.filter(t => t.netPnL <= 0);
   
   const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
   
   const totalWin = winningTrades.reduce((sum, t) => sum + t.netPnL, 0);
   const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.netPnL, 0));

   const avgWin = winningTrades.length > 0 
     ? totalWin / winningTrades.length 
     : 0;
     
   const avgLoss = losingTrades.length > 0 
     ? losingTrades.reduce((sum, t) => sum + Math.abs(t.netPnL), 0) / losingTrades.length 
     : 0;
     
   const rrRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
   
   // Expectancy = (Win % * Avg Win) - (Loss % * Avg Loss)
   const lossRate = 100 - winRate;
   const expectancy = ((winRate / 100) * avgWin) - ((lossRate / 100) * avgLoss);
   
   const netProfit = trades.reduce((sum, t) => sum + t.netPnL, 0);
   const profitFactor = totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? Number.POSITIVE_INFINITY : 0;

   return {
     totalTrades: trades.length,
     winRate,
     avgWin,
     avgLoss,
     rrRatio,
     expectancy,
     netProfit,
     profitFactor
   };
};

/**
 * Data Cleanup Tool Verification
 * Returns a list of issues found in the trades (missing lot sizes, stop losses, etc).
 */
export const checkTradeDataIntegrity = (trades: Trade[]) => {
  const issues: { index: number; id: string; issue: string }[] = [];
  
  trades.forEach((t, idx) => {
    const missingFields: string[] = [];
    if (!t.quantity || t.quantity <= 0) missingFields.push('Lot Quantity');
    if (!t.entryPrice || t.entryPrice <= 0) missingFields.push('Entry Price');
    if (t.stopLossPrice === undefined || t.stopLossPrice <= 0) missingFields.push('Stop Loss');
    if (t.takeProfitPrice === undefined || t.takeProfitPrice <= 0) missingFields.push('Take Profit');
    if (!t.setup || t.setup.trim() === '') missingFields.push('Setup');

    if (missingFields.length > 0) {
      issues.push({ index: idx, id: t.id, issue: `Missing/invalid: ${missingFields.join(', ')}` });
    }
  });

  return issues;
};
