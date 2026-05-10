import React, { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import { History, Play, Pause, SkipForward, TrendingUp, TrendingDown, RefreshCw, XCircle, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

// Generates simulated historical data (Geometric Brownian Motion)
function generateHistoricalData(count: number, startPrice: number, startDate: Date): CandlestickData[] {
  const data: CandlestickData[] = [];
  let currentPrice = startPrice;
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const volatility = 0.002; // Roughly 0.2% volatility per period
    const open = currentPrice;
    
    // Simulate intraday movement
    const move1 = open * (Math.random() - 0.5) * volatility;
    const move2 = open * (Math.random() - 0.5) * volatility;
    const move3 = open * (Math.random() - 0.5) * volatility;
    const move4 = open * (Math.random() - 0.5) * volatility;

    const points = [open, open + move1, open + move1 + move2, open + move1 + move2 + move3, open + move1 + move2 + move3 + move4];
    
    const high = Math.max(...points);
    const low = Math.min(...points);
    const close = points[4];

    data.push({
      time: (currentDate.getTime() / 1000) as Time,
      open,
      high,
      low,
      close,
    });

    currentPrice = close;
    // Add 1 hour
    currentDate.setTime(currentDate.getTime() + 60 * 60 * 1000);
  }
  return data;
}

interface ReplayTrade {
  id: string;
  type: 'Long' | 'Short';
  entryPrice: number;
  exitPrice?: number;
  entryTime: number;
  exitTime?: number;
  pnl?: number;
}

export function BacktestReplay() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [candlestickSeries, setCandlestickSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackIntervalRef = useRef<any>(null);

  const [trades, setTrades] = useState<ReplayTrade[]>([]);
  const [balance, setBalance] = useState(100000);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize data
  useEffect(() => {
    const data = generateHistoricalData(3000, 1.1000, new Date('2024-01-01T00:00:00Z'));
    setHistoricalData(data);
    // Start playback at index 100 to show some history initially
    setCurrentDataIndex(100);
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || historicalData.length === 0) return;

    const newChart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // Normal mode
        vertLine: {
          color: '#7f8fa6',
          width: 1,
          style: 1,
        },
        horzLine: {
          color: '#7f8fa6',
          width: 1,
          style: 1,
        },
      },
    });

    const series = newChart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    setChart(newChart);
    setCandlestickSeries(series);

    // Initial data setup
    const initialData = historicalData.slice(0, 100);
    series.setData(initialData);
    newChart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        newChart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      newChart.remove();
    };
  }, [historicalData]);

  // Handle Playback
  useEffect(() => {
    if (isPlaying && currentDataIndex < historicalData.length - 1) {
      playbackIntervalRef.current = setInterval(() => {
        stepForward();
      }, 1000 / playbackSpeed);
    } else {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    }

    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed, currentDataIndex, historicalData]);

  const stepForward = () => {
    setCurrentDataIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex >= historicalData.length) {
        setIsPlaying(false);
        return prev;
      }
      
      if (candlestickSeries) {
        candlestickSeries.update(historicalData[nextIndex]);
      }
      return nextIndex;
    });
  };

  const handleExecuteTrade = (type: 'Long' | 'Short') => {
    const currentPrice = historicalData[currentDataIndex].close;
    const newTrade: ReplayTrade = {
      id: Math.random().toString(36).substring(7),
      type,
      entryPrice: currentPrice,
      entryTime: historicalData[currentDataIndex].time as number,
    };
    setTrades([newTrade, ...trades]);
  };

  const handleCloseTrade = (tradeId: string) => {
    const currentPrice = historicalData[currentDataIndex].close;
    
    setTrades(trades.map(trade => {
      if (trade.id === tradeId && !trade.exitPrice) {
        const isLong = trade.type === 'Long';
        // Arbitrary multiplier to make PnL look realistic (e.g. 1 standard lot)
        const priceDiff = isLong ? currentPrice - trade.entryPrice : trade.entryPrice - currentPrice;
        const pnl = priceDiff * 100000; 
        
        setBalance(prev => prev + pnl);
        
        return {
          ...trade,
          exitPrice: currentPrice,
          exitTime: historicalData[currentDataIndex].time as number,
          pnl
        };
      }
      return trade;
    }));
  };

  const currentPrice = historicalData[currentDataIndex]?.close || 0;
  const activeTrades = trades.filter(t => !t.exitPrice);
  const closedTrades = trades.filter(t => t.exitPrice);
  
  // Calculate unrealized PnL
  const unrealizedPnL = activeTrades.reduce((acc, trade) => {
    const isLong = trade.type === 'Long';
    const priceDiff = isLong ? currentPrice - trade.entryPrice : trade.entryPrice - currentPrice;
    return acc + (priceDiff * 100000);
  }, 0);

  return (
    <div className="flex flex-col h-full space-y-4 font-sans max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center space-x-3">
            <History className="text-indigo-400" />
            <span>Replay Backtest</span>
          </h1>
          <p className="text-gray-400">Master your strategy with realistic bar-replay market simulation.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="glass-panel px-4 py-2 border border-white/5 flex space-x-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Account Balance</span>
              <span className="text-lg font-mono font-bold text-white">${balance.toFixed(2)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Open P&L</span>
              <span className={clsx("text-lg font-mono font-bold", unrealizedPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                {unrealizedPnL >= 0 ? '+' : ''}{unrealizedPnL.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="glass-panel p-1 flex-1 relative border border-white/5 overflow-hidden flex flex-col group">
             {/* Chart Overlay Controls */}
             <div className="absolute top-4 left-4 z-10 flex items-center space-x-4">
               <div className="bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 flex items-center space-x-3 shadow-lg">
                 <span className="font-mono text-sm text-gray-300">EURUSD</span>
                 <span className="font-mono text-sm font-bold text-white">{currentPrice.toFixed(5)}</span>
               </div>
             </div>

             <div className="flex-1 w-full relative" ref={chartContainerRef}></div>
             
             {/* Playback Controls Footer */}
             <div className="bg-gray-900/90 backdrop-blur-md border-t border-white/10 p-3 flex justify-between items-center z-10 opacity-60 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center space-x-2">
                 <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={clsx(
                      "p-2 rounded transition-all",
                      isPlaying ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                    )}
                 >
                   {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                 </button>
                 <button
                    onClick={stepForward}
                    disabled={isPlaying}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all disabled:opacity-50"
                 >
                   <SkipForward size={18} />
                 </button>
                 <div className="h-6 w-px bg-white/10 mx-2"></div>
                 <div className="flex bg-black/40 rounded p-1">
                   {[1, 5, 10, 50].map(speed => (
                     <button
                       key={speed}
                       onClick={() => setPlaybackSpeed(speed)}
                       className={clsx(
                         "px-2 py-1 text-xs font-mono rounded transition-all",
                         playbackSpeed === speed ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300"
                       )}
                     >
                       {speed}x
                     </button>
                   ))}
                 </div>
               </div>
               
               <div className="text-xs font-mono text-gray-500">
                 {historicalData[currentDataIndex] && new Date(Number(historicalData[currentDataIndex].time) * 1000).toLocaleString()}
               </div>
             </div>
          </div>

          {/* Execution Panel Below Chart */}
          <div className="glass-panel p-4 flex justify-between items-center border border-white/5">
             <div className="flex items-center space-x-4">
               <button 
                 onClick={() => handleExecuteTrade('Short')}
                 className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold tracking-widest text-sm uppercase transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
               >
                 <TrendingDown size={20} /> <span>Short Market</span>
               </button>
               <button 
                 onClick={() => handleExecuteTrade('Long')}
                 className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold tracking-widest text-sm uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
               >
                 <TrendingUp size={20} /> <span>Long Market</span>
               </button>
             </div>
             <div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-all border border-white/5"
                >
                  <Settings size={20} />
                </button>
             </div>
          </div>
        </div>

        {/* Right Sidebar - Positions & History */}
        <div className="glass-panel p-4 flex flex-col h-full border border-white/5 overflow-hidden">
          <h2 className="font-semibold text-lg mb-4 text-white">Active Positions <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded ml-2">{activeTrades.length}</span></h2>
          
          <div className="flex-1 overflow-y-auto min-h-[150px] mb-6 space-y-3 pr-2 scrollbar-hide">
            {activeTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 opacity-60 flex-1 py-10">
                <History size={32} />
                <p className="text-sm">No active positions</p>
              </div>
            ) : (
              activeTrades.map(trade => {
                const isLong = trade.type === 'Long';
                const currentPnL = (isLong ? currentPrice - trade.entryPrice : trade.entryPrice - currentPrice) * 100000;
                
                return (
                  <div key={trade.id} className="bg-black/40 border border-white/5 p-3 rounded-xl relative overflow-hidden group">
                    <div className={clsx("absolute top-0 left-0 w-1 h-full", isLong ? "bg-emerald-500" : "bg-red-500")} />
                    <div className="flex justify-between items-start pl-2">
                       <div>
                         <div className="flex items-center space-x-2">
                           <span className={clsx("text-xs font-bold uppercase", isLong ? "text-emerald-400" : "text-red-400")}>{trade.type}</span>
                           <span className="text-xs font-mono text-gray-500">@{trade.entryPrice.toFixed(5)}</span>
                         </div>
                         <div className={clsx("font-mono font-bold mt-1 text-sm", currentPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                           {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)}
                         </div>
                       </div>
                       <button 
                         onClick={() => handleCloseTrade(trade.id)}
                         className="p-1.5 bg-white/5 hover:bg-white/20 hover:text-white rounded text-gray-400 transition-colors"
                         title="Close Position"
                       >
                         <XCircle size={16} />
                       </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <h2 className="font-semibold text-lg border-t border-white/10 pt-4 mb-4 text-white">Closed History</h2>
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-2">
            {closedTrades.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No closed trades yet.</p>
            ) : (
              closedTrades.map(trade => (
                <div key={trade.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-default">
                  <div className="flex flex-col">
                    <span className={clsx("text-[10px] font-bold uppercase", trade.type === 'Long' ? "text-emerald-500" : "text-red-500")}>
                      {trade.type}
                    </span>
                    <span className="text-xs font-mono text-gray-400 mt-0.5">{new Date(trade.entryTime * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className={clsx("font-mono font-bold text-xs", (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {(trade.pnl || 0) >= 0 ? '+' : ''}{(trade.pnl || 0).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
