import React, { useState, useEffect } from 'react';
import { Clock, Globe2, Sun, Moon, AlertCircle, Activity, Info } from 'lucide-react';
import { clsx } from 'clsx';

type SessionConfig = {
  name: string;
  timezone: string;
  openUtc: number;
  closeUtc: number;
  color: string;
  darkColor: string;
  bgColor: string;
};

const FOREX_SESSIONS: SessionConfig[] = [
  { name: 'Sydney', timezone: 'AEST', openUtc: 22, closeUtc: 7, color: 'bg-purple-500', darkColor: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { name: 'Tokyo', timezone: 'JST', openUtc: 0, closeUtc: 9, color: 'bg-blue-500', darkColor: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { name: 'London', timezone: 'GMT', openUtc: 8, closeUtc: 17, color: 'bg-emerald-500', darkColor: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  { name: 'New York', timezone: 'EST', openUtc: 13, closeUtc: 22, color: 'bg-orange-500', darkColor: 'text-orange-400', bgColor: 'bg-orange-500/20' },
];

function isWeekend(date: Date) {
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  // Forex is roughly closed from Friday 22:00 UTC to Sunday 22:00 UTC
  if (day === 5 && hour >= 22) return true; // Friday after 22:00
  if (day === 6) return true; // Saturday
  if (day === 0 && hour < 22) return true; // Sunday before 22:00
  return false;
}

function getSessionStatus(currentUtcHour: number, currentUtcMin: number, open: number, close: number) {
  const currentTotalMins = currentUtcHour * 60 + currentUtcMin;
  const openTotalMins = open * 60;
  const closeTotalMins = close * 60;
  
  let isOpen = false;
  if (open > close) {
    // Crosses midnight
    isOpen = currentTotalMins >= openTotalMins || currentTotalMins < closeTotalMins;
  } else {
    isOpen = currentTotalMins >= openTotalMins && currentTotalMins < closeTotalMins;
  }

  // Calculate time until flip (open to close, or close to open)
  let targetMins = isOpen ? closeTotalMins : openTotalMins;
  let remainingMins = targetMins - currentTotalMins;
  
  if (remainingMins < 0) {
    remainingMins += 24 * 60;
  }

  const rHours = Math.floor(remainingMins / 60);
  const rMins = remainingMins % 60;

  return {
    isOpen,
    timeRemaining: `${rHours}h ${rMins}m`
  };
}

export function MarketSessions() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentUtcHour = now.getUTCHours();
  const currentUtcMin = now.getUTCMinutes();
  const currentUtcSec = now.getUTCSeconds();
  const isMarketWeekend = isWeekend(now);

  const openSessionsCount = isMarketWeekend 
    ? 0 
    : FOREX_SESSIONS.filter(s => getSessionStatus(currentUtcHour, currentUtcMin, s.openUtc, s.closeUtc).isOpen).length;

  let marketStatusText = 'Closed (Weekend)';
  let marketStatusColor = 'text-red-400';
  if (!isMarketWeekend) {
    if (openSessionsCount >= 2) {
      marketStatusText = 'High Volatility (Overlap)';
      marketStatusColor = 'text-emerald-400';
    } else if (openSessionsCount === 1) {
      marketStatusText = 'Normal Volatility';
      marketStatusColor = 'text-blue-400';
    } else {
      marketStatusText = 'Low Volatility (Transition)';
      marketStatusColor = 'text-gray-400';
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center space-x-3">
          <Globe2 className="text-blue-400" />
          <span>Market Sessions</span>
        </h1>
        <p className="text-gray-400">Track active global trading sessions, overlaps, and market volatility.</p>
      </header>

      {/* Top Status Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-2">
          <Clock className="w-8 h-8 text-gray-400 mb-2" />
          <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Your Local Time</div>
          <div className="text-3xl font-mono text-white font-bold">
            {now.toLocaleTimeString([], { hour12: false })}
          </div>
          <div className="text-sm text-gray-500">{now.toLocaleDateString()}</div>
        </div>

        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-2">
          <Globe2 className="w-8 h-8 text-blue-400 mb-2" />
          <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">UTC Time</div>
          <div className="text-3xl font-mono text-white font-bold">
            {now.toISOString().substring(11, 19)}
          </div>
          <div className="text-sm text-gray-500">Standard forex base time</div>
        </div>

        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
          <div className={clsx("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20", marketStatusColor.replace('text', 'bg'))}></div>
          <Activity className={clsx("w-8 h-8 mb-2", marketStatusColor)} />
          <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Global Market Status</div>
          <div className={clsx("text-xl font-bold", marketStatusColor)}>
            {marketStatusText}
          </div>
          <div className="text-sm text-gray-500">
            {isMarketWeekend ? 'Market resumes Sunday 22:00 UTC' : `${openSessionsCount} Active Sessions`}
          </div>
        </div>
      </div>

      {/* 24-Hour Timeline */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Clock className="text-gray-400" />
            <span>24-Hour Session Overlap (UTC)</span>
          </h2>
          <div className="text-sm text-gray-400 flex items-center space-x-2">
            <Info size={16} />
            <span>Overlaps usually mean higher liquidity & volume.</span>
          </div>
        </div>

        <div className="relative pt-8 pb-4">
          {/* Time markers */}
          <div className="flex justify-between text-xs text-gray-500 absolute top-0 left-0 right-0 px-[2%]">
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map(h => (
              <span key={h} className="translate-x-[-50%]">{h}:00</span>
            ))}
          </div>

          <div className="relative h-48 bg-gray-900/50 rounded-xl border border-white/5 mx-[2%] overflow-hidden">
            {/* Hour grid lines */}
            <div className="absolute inset-0 flex justify-between">
              {[...Array(25)].map((_, i) => (
                <div key={i} className="h-full w-px bg-white/5"></div>
              ))}
            </div>

            {/* Current Time Indicator */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-20 flex flex-col items-center justify-start transform -translate-x-1/2 transition-all duration-1000 ease-linear"
              style={{ left: `${((currentUtcHour + currentUtcMin / 60) / 24) * 100}%` }}
            >
              <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-b-md">
                NOW
              </div>
            </div>

            {/* Session Blocks */}
            <div className="absolute inset-0 flex flex-col justify-around py-4">
              {FOREX_SESSIONS.map(session => {
                let left = (session.openUtc / 24) * 100;
                let width = ((session.closeUtc < session.openUtc ? session.closeUtc + 24 - session.openUtc : session.closeUtc - session.openUtc) / 24) * 100;
                let isSplit = left + width > 100;

                return (
                  <div key={session.name} className="relative h-8 w-full">
                    {!isSplit ? (
                      <div 
                        className={clsx("absolute top-0 bottom-0 rounded-md backdrop-blur-sm shadow-sm flex items-center px-3", session.bgColor, session.color.replace('bg-', 'border-l-4 border-'))}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <span className={clsx("text-xs font-bold whitespace-nowrap", session.darkColor)}>{session.name}</span>
                      </div>
                    ) : (
                      <>
                        <div 
                          className={clsx("absolute top-0 bottom-0 rounded-l-md backdrop-blur-sm shadow-sm flex items-center px-3", session.bgColor, session.color.replace('bg-', 'border-l-4 border-'))}
                          style={{ left: `${left}%`, width: `${100 - left}%` }}
                        >
                          <span className={clsx("text-xs font-bold whitespace-nowrap", session.darkColor)}>{session.name}</span>
                        </div>
                        <div 
                          className={clsx("absolute top-0 bottom-0 rounded-r-md backdrop-blur-sm shadow-sm", session.bgColor)}
                          style={{ left: '0%', width: `${width - (100 - left)}%` }}
                        >
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {FOREX_SESSIONS.map(session => {
          const status = getSessionStatus(currentUtcHour, currentUtcMin, session.openUtc, session.closeUtc);
          const isCurrentlyOpen = !isMarketWeekend && status.isOpen;

          return (
            <div key={session.name} className={clsx(
              "rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden",
              isCurrentlyOpen ? "bg-gray-800/80 border-gray-600 shadow-lg" : "bg-gray-900/50 border-gray-800 opacity-60 grayscale-[50%]"
            )}>
              {/* Highlight bar at top */}
              <div className={clsx("absolute top-0 left-0 right-0 h-1", session.color)}></div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{session.name}</h3>
                  <p className="text-xs text-gray-500 font-medium tracking-wider">{session.timezone}</p>
                </div>
                <div className={clsx("px-2.5 py-1 rounded-full text-xs font-bold border", 
                  isCurrentlyOpen 
                    ? `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` 
                    : `bg-gray-500/10 text-gray-400 border-gray-500/20`
                )}>
                  {isMarketWeekend ? 'WEEKEND' : isCurrentlyOpen ? 'OPEN' : 'CLOSED'}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Open (UTC)</span>
                    <span className="text-gray-300 font-mono">{session.openUtc.toString().padStart(2, '0')}:00</span>
                  </div>
                  <div className="w-8 h-[1px] bg-gray-700"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-gray-500 text-xs">Close (UTC)</span>
                    <span className="text-gray-300 font-mono">{session.closeUtc.toString().padStart(2, '0')}:00</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {isMarketWeekend ? 'Resumes in:' : isCurrentlyOpen ? 'Closes in:' : 'Opens in:'}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {isMarketWeekend ? '--h --m' : status.timeRemaining}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
