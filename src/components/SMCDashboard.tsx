import React, { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import { Settings, Info, ArrowUpRight, ArrowDownRight, Activity, Clock, ShieldCheck, Target } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

const ASSETS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', 'ETH/USD'];

interface Signal {
  id: string;
  time: string;
  type: 'BUY' | 'SELL' | 'NEUTRAL';
  entry: number;
  sl: number;
  tp: number;
  session: string;
  confidence: number;
}

export function SMCDashboard({ journalTradeId }: { journalTradeId?: string }) {
  const [activeAsset, setActiveAsset] = useState(ASSETS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    // Mock fetching data for the chosen asset
    setIsLoading(true);
    let chart: IChartApi;
    
    setTimeout(() => {
      if (chartContainerRef.current) {
        chart = createChart(chartContainerRef.current, {
          layout: {
            background: { color: 'transparent' },
            textColor: '#9ca3af',
          },
          grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        });

        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });

        // Generate some mock candle data
        const basePrice = activeAsset.includes('BTC') ? 65000 : activeAsset.includes('ETH') ? 3500 : activeAsset.includes('XAU') ? 2300 : 1.1;
        const volatility = activeAsset.includes('BTC') ? 100 : activeAsset.includes('ETH') ? 20 : activeAsset.includes('XAU') ? 5 : 0.001;
        
        let data: CandlestickData[] = [];
        let time = Math.floor(Date.now() / 1000) - 100 * 3600;
        let lastClose = basePrice;
        
        for (let i = 0; i < 100; i++) {
          const open = lastClose + (Math.random() - 0.5) * volatility;
          const high = Math.max(open, open + Math.random() * volatility);
          const low = Math.min(open, open - Math.random() * volatility);
          const close = (open + high + low) / 3 + (Math.random() - 0.5) * volatility;
          
          data.push({
            time: time as Time,
            open,
            high,
            low,
            close,
          });
          
          time += 3600;
          lastClose = close;
        }
        
        series.setData(data);
        
        createSeriesMarkers(series, [
          { time: data[20].time, position: 'aboveBar', color: '#f59e0b', shape: 'arrowDown', text: 'CHoCH Down' },
          { time: data[50].time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'BOS Up' },
          { time: data[80].time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'CHoCH Up' }
        ]);

        chart.timeScale().fitContent();

        // Generate synthetic signals
        setSignals([
          { id: '1', time: new Date(Date.now() - 3600000).toLocaleTimeString(), type: 'BUY', entry: data[99].close, sl: data[99].close - volatility * 2, tp: data[99].close + volatility * 4, session: 'NY', confidence: 85 },
          { id: '2', time: new Date(Date.now() - 7200000).toLocaleTimeString(), type: 'SELL', entry: data[90].close, sl: data[90].close + volatility * 2, tp: data[90].close - volatility * 4, session: 'London', confidence: 72 },
          { id: '3', time: new Date(Date.now() - 14400000).toLocaleTimeString(), type: 'BUY', entry: data[80].close, sl: data[80].close - volatility * 2, tp: data[80].close + volatility * 4, session: 'Asian', confidence: 60 }
        ]);
        
        setIsLoading(false);
      }
    }, 800);

    return () => {
      if (chart) chart.remove();
    };
  }, [activeAsset]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-2">
            Whale Algo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Institutional Smart Money Concepts Dashboard</p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-300 rounded-lg text-sm font-bold">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          ACTIVE: London/NY Overlap
        </div>
      </div>

      <div className="glass-panel p-2 flex overflow-x-auto scrollbar-hide space-x-2 border border-blue-500/10">
        {ASSETS.map((asset) => (
          <button
            key={asset}
            onClick={() => setActiveAsset(asset)}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 font-mono",
              activeAsset === asset 
                ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            {asset}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-4 border border-white/5 rounded-2xl relative h-[500px]">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-2xl">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div ref={chartContainerRef} className="w-full h-full" />
          </div>

          <div className="glass-panel border border-white/5 rounded-2xl p-4 overflow-x-auto">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-indigo-400"/> Live SMC Signals
            </h3>
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Time</th>
                  <th className="px-4 py-3">Signal</th>
                  <th className="px-4 py-3 font-mono text-right">Entry</th>
                  <th className="px-4 py-3 font-mono text-right text-red-500">SL</th>
                  <th className="px-4 py-3 font-mono text-right text-emerald-500">TP</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3 rounded-tr-lg">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {signals.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.time}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("flex items-center gap-1 font-bold", s.type === 'BUY' ? "text-emerald-500" : "text-red-500")}>
                        {s.type === 'BUY' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-gray-900 dark:text-white">{s.entry.toFixed(5)}</td>
                    <td className="px-4 py-3 font-mono text-right text-red-500/80">{s.sl.toFixed(5)}</td>
                    <td className="px-4 py-3 font-mono text-right text-emerald-500/80">{s.tp.toFixed(5)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300">
                        {s.session}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={clsx("h-full", s.confidence > 80 ? "bg-emerald-500" : s.confidence > 65 ? "bg-amber-500" : "bg-red-500")}
                            style={{width: `${s.confidence}%`}}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{s.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-5 border border-white/5 rounded-2xl">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-400"/> Backtest Stats (30D)
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/50 dark:bg-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Win Rate</span>
                <span className="font-mono font-bold text-emerald-500">68.4%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/50 dark:bg-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Profit Factor</span>
                <span className="font-mono font-bold text-blue-400">2.14</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/50 dark:bg-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Max DD</span>
                <span className="font-mono font-bold text-red-400">-4.2%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/50 dark:bg-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">1.85</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2 border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 rounded-xl font-bold transition-colors text-sm">
              Run New Backtest
            </button>
          </div>

          <div className="glass-panel p-5 border border-white/5 rounded-2xl">
             <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target size={16} className="text-purple-400"/> Current Setup
            </h3>
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10">
                 <Target size={64} />
               </div>
               <div className="space-y-2 relative z-10">
                 <div className="flex items-center gap-2">
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">CHoCH</span>
                   <span className="text-xs text-gray-500 dark:text-gray-400">1H Change of Character</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-500">FVG</span>
                   <span className="text-xs text-gray-500 dark:text-gray-400">Bullish Imbalance M15</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400">OB</span>
                   <span className="text-xs text-gray-500 dark:text-gray-400">Valid Order Block @ {activeAsset.includes('BTC') ? '62450.00' : '1.0924'}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
