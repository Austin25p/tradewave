import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from 'date-fns';
import { Trade, DailySentiment } from '../lib/types';
import { clsx } from 'clsx';
import { isGoldenBulletCompliant } from '../lib/goldenBullet';
import { Star } from 'lucide-react';

interface CalendarProps {
  trades: Trade[];
  sentiments: Record<string, DailySentiment>;
}

const MOOD_EMOJIS: Record<string, string> = {
  'Disciplined': '🧘',
  'FOMO': '📉',
  'Tilted': '🌋',
  'Confident': '🦁',
  'Anxious': '😰',
};

export function PerformanceCalendar({ trades, sentiments }: CalendarProps) {
  const currentDate = new Date(); // Start with current month in a real app, mock is fine
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });
  
  // padding for start of month
  const startingDayIndex = getDay(firstDay);
  const paddingDays = Array.from({ length: startingDayIndex }).map((_, i) => i);

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const map = new Map<string, Trade[]>();
    trades.forEach(t => {
      const dateStr = format(new Date(t.exitDate), 'yyyy-MM-dd');
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(t);
    });
    return map;
  }, [trades]);

  const getDayColor = (pnl: number) => {
    if (pnl > 0) return 'bg-emerald-500/20 border-emerald-500/30';
    if (pnl < 0) return 'bg-red-500/20 border-red-500/30';
    return 'bg-white dark:bg-white/5 shadow-sm dark:shadow-none border-gray-200 dark:border-white/10';
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Performance Calendar</h1>
        <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Track your P&L and emotional state day by day.</p>
      </header>

      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
          <div className="flex space-x-4 text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-emerald-500/40"></div><span>Winning Day</span></span>
            <span className="flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-red-500/40"></div><span>Losing Day</span></span>
            <span className="flex items-center space-x-1"><Star size={12} className="text-amber-400 fill-amber-400" /><span>Golden Bullet Trade</span></span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {paddingDays.map((_, i) => (
            <div key={"padding-" + i} className="h-28 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none opacity-50" />
          ))}
          
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTrades = tradesByDate.get(dateStr) || [];
            const dayPnL = dayTrades.reduce((sum, t) => sum + t.netPnL, 0);
            const sentiment = sentiments[dateStr];
            const hasGoldenBullet = dayTrades.some(t => isGoldenBulletCompliant(t.entryDate));
            
            return (
              <div 
                key={dateStr} 
                className={clsx(
                  'h-28 rounded-xl border p-3 flex flex-col transition-all hover:scale-105 cursor-pointer relative',
                  getDayColor(dayTrades.length > 0 ? dayPnL : 0),
                  isToday(day) && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900'
                )}
              >
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center space-x-1">
                    <span>{format(day, 'd')}</span>
                    {hasGoldenBullet && (
                      <span title="Golden Bullet Trade Taken">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                      </span>
                    )}
                  </span>
                  {sentiment && (
                    <span className="text-xl" title={sentiment.mood}>{MOOD_EMOJIS[sentiment.mood]}</span>
                  )}
                </div>
                
                {dayTrades.length > 0 && (
                  <div className="mt-auto flex flex-col items-end">
                    <span className={"text-sm font-bold " + (dayPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                      {dayPnL >= 0 ? '+' : ''}${Math.abs(dayPnL).toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{dayTrades.length} trades</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
