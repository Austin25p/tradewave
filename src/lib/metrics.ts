import { Trade } from './types';

export interface Metrics {
  profitFactor: number;
  winRate: number;
  expectancy: number;
  maxDrawdown: number;
  avgHoldTimeWinners: number; // in hours
  avgHoldTimeLosers: number; // in hours
  totalTrades: number;
  netPnL: number;
}

export function calculateMetrics(trades: Trade[]): Metrics {
  if (trades.length === 0) {
    return {
      profitFactor: 0,
      winRate: 0,
      expectancy: 0,
      maxDrawdown: 0,
      avgHoldTimeWinners: 0,
      avgHoldTimeLosers: 0,
      totalTrades: 0,
      netPnL: 0,
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalHoldTimeWinners = 0;
  let totalHoldTimeLosers = 0;
  let netPnL = 0;

  // Max drawdown calculation
  let peakEquity = 0;
  let currentEquity = 0;
  let maxDrawdown = 0;

  // Ensure trades are sorted chronologically by exit for accurate equity curve and drawdown
  const sortedTrades = [...trades].sort((a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime());

  for (const trade of sortedTrades) {
    netPnL += trade.netPnL;
    currentEquity += trade.netPnL;

    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const drawdown = peakEquity - currentEquity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    const holdTimeMs = new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime();
    const holdTimeHours = holdTimeMs / (1000 * 60 * 60);

    if (trade.netPnL > 0) {
      grossProfit += trade.netPnL;
      winningTrades++;
      totalHoldTimeWinners += holdTimeHours;
    } else {
      grossLoss += Math.abs(trade.netPnL);
      losingTrades++;
      totalHoldTimeLosers += holdTimeHours;
    }
  }

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Number.POSITIVE_INFINITY : 0;
  
  const avgWinner = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoser = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const expectancy = (winRate * avgWinner) - ((1 - winRate) * avgLoser);

  return {
    profitFactor,
    winRate,
    expectancy,
    maxDrawdown,
    avgHoldTimeWinners: winningTrades > 0 ? totalHoldTimeWinners / winningTrades : 0,
    avgHoldTimeLosers: losingTrades > 0 ? totalHoldTimeLosers / losingTrades : 0,
    totalTrades,
    netPnL,
  };
}
