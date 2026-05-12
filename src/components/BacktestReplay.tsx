import React, { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, MouseEventParams, createSeriesMarkers } from 'lightweight-charts';
import { History, Play, Pause, SkipForward, TrendingUp, TrendingDown, RefreshCw, XCircle, Settings, MousePointer2, MoveDiagonal, AlignJustify, Trash2, Target, Crosshair, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

// Generates simulated historical data using Geometric Brownian Motion with momentum and jumps
function generateHistoricalData(count: number, startPrice: number, startDate: Date, timeframeMinutes: number): CandlestickData[] {
  const data: CandlestickData[] = [];
  let currentPrice = startPrice;
  let currentDate = new Date(startDate);
  
  // Base volatility scale per minute
  const baseVolatility = 0.0004; 
  let trend = 0; // Short-term trend (momentum)

  for (let i = 0; i < count; i++) {
    const volatility = baseVolatility * Math.sqrt(timeframeMinutes);
    const open = currentPrice;
    
    let high = open;
    let low = open;
    let close = open;
    
    // Simulate multiple ticks within each candle to get realistic high/low wicks
    const steps = 10;
    let tickPrice = open;
    
    // Auto-correlate trend (momentum)
    trend += (Math.random() - 0.5) * 0.0001;
    trend *= 0.95; // Mean reversion of trend

    for (let j = 0; j < steps; j++) {
      // Box-Muller transform for normal distribution approximation
      let u = 0, v = 0;
      while(u === 0) u = Math.random();
      while(v === 0) v = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      
      const move = tickPrice * (z0 * volatility / Math.sqrt(steps) + trend / steps);
      tickPrice += move;
      
      if (tickPrice > high) high = tickPrice;
      if (tickPrice < low) low = tickPrice;
    }
    
    close = tickPrice;

    // Small chance of price gap between candles (0.5%)
    if (Math.random() < 0.005) {
      close += close * (Math.random() - 0.5) * volatility * 2;
    }

    data.push({
      time: (currentDate.getTime() / 1000) as Time,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
    });

    currentPrice = close;
    
    // Advance time
    currentDate = new Date(currentDate.getTime() + timeframeMinutes * 60000);
    
    // Skip weekends for traditional hours (simplified)
    if (currentDate.getUTCDay() === 6) {
      currentDate = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    } else if (currentDate.getUTCDay() === 0) {
      currentDate = new Date(currentDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    }
  }

  return data;
}

const TIMEFRAMES = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '1h': 60,
  '4h': 240,
  '1D': 1440
} as const;

type Timeframe = keyof typeof TIMEFRAMES;

const ASSETS = [
  { symbol: 'EURUSD', type: 'Forex', startPrice: 1.1000, decimals: 5, pipSize: 0.0001, lotSize: 100000 },
  { symbol: 'GBPUSD', type: 'Forex', startPrice: 1.2500, decimals: 5, pipSize: 0.0001, lotSize: 100000 },
  { symbol: 'BTCUSD', type: 'Crypto', startPrice: 65000, decimals: 2, pipSize: 1, lotSize: 1 },
  { symbol: 'ETHUSD', type: 'Crypto', startPrice: 3500, decimals: 2, pipSize: 1, lotSize: 10 },
  { symbol: 'SPX500', type: 'Indices', startPrice: 5200, decimals: 1, pipSize: 0.1, lotSize: 10 },
  { symbol: 'NAS100', type: 'Indices', startPrice: 18000, decimals: 1, pipSize: 0.1, lotSize: 1 },
  { symbol: 'US30', type: 'Indices', startPrice: 38000, decimals: 1, pipSize: 1, lotSize: 1 },
  { symbol: 'XAUUSD', type: 'Commodities', startPrice: 2300, decimals: 2, pipSize: 0.1, lotSize: 100 },
  { symbol: 'AAPL', type: 'Stocks', startPrice: 170, decimals: 2, pipSize: 0.01, lotSize: 100 },
  { symbol: 'TSLA', type: 'Stocks', startPrice: 175, decimals: 2, pipSize: 0.01, lotSize: 100 },
  { symbol: 'MSFT', type: 'Stocks', startPrice: 400, decimals: 2, pipSize: 0.01, lotSize: 100 },
  { symbol: 'Vol 75 Index', type: 'Synthetics', startPrice: 450000, decimals: 2, pipSize: 1, lotSize: 1 },
  { symbol: 'Boom 1000 Index', type: 'Synthetics', startPrice: 12000, decimals: 4, pipSize: 0.0001, lotSize: 1 },
];

interface ReplayTrade {
  id: string;
  symbol: string;
  type: 'Long' | 'Short';
  entryPrice: number;
  exitPrice?: number;
  entryTime: number;
  exitTime?: number;
  pnl?: number;
  sl?: number;
  tp?: number;
  trailingSl?: boolean;
  slDistance?: number;
}

export interface DrawingPoint { logical: number, price: number }
export interface ChartDrawing { id: string, type: 'trendline' | 'fibonacci', p1: DrawingPoint, p2?: DrawingPoint }

function DrawingsOverlay({ 
  chart, series, drawings, currentPoints, mode, selectedId, onSelect, onDelete, onUpdate
}: { 
  chart: IChartApi | null, series: ISeriesApi<"Candlestick"> | null, 
  drawings: ChartDrawing[], currentPoints: DrawingPoint[], mode: string,
  selectedId: string | null, onSelect: (id: string | null) => void, onDelete: (id: string) => void,
  onUpdate: (id: string, drawing: ChartDrawing) => void
}) {
  const [rev, setRev] = useState(0);
  const mouseRef = useRef<{logical: number, price: number} | null>(null);

  const [dragging, setDragging] = useState<{id: string, point: 'p1'|'p2'|'move', xOffset?: number, yOffset?: number} | null>(null);

  useEffect(() => {
    if (!chart || !series) return;
    const handler = () => setRev(r => r + 1);
    const crosshairHandler = (param: MouseEventParams) => {
       if (param.logical !== undefined && param.point) {
          const price = series.coordinateToPrice(param.point.y);
          const logical = param.logical as number;
          mouseRef.current = { logical, price: price || 0 };

          if (dragging) {
             const d = drawings.find(x => x.id === dragging.id);
             if (d) {
                if (dragging.point === 'move' && dragging.xOffset !== undefined && dragging.yOffset !== undefined) {
                   // move both
                   const plDiff = logical - dragging.xOffset;
                   const prDiff = (price || 0) - dragging.yOffset;
                   onUpdate(d.id, {
                     ...d,
                     p1: { logical: d.p1.logical + plDiff, price: d.p1.price + prDiff },
                     p2: d.p2 ? { logical: d.p2.logical + plDiff, price: d.p2.price + prDiff } : undefined
                   });
                   // update relative offsets
                   setDragging({id: dragging.id, point: 'move', xOffset: logical, yOffset: price || 0});
                } else if (dragging.point === 'p1') {
                   onUpdate(d.id, { ...d, p1: { logical, price: price || 0 } });
                } else if (dragging.point === 'p2' && d.p2) {
                   onUpdate(d.id, { ...d, p2: { logical, price: price || 0 } });
                }
             }
          }
       } else {
          mouseRef.current = null;
       }
       if (currentPoints.length > 0 || dragging) handler();
    };
    
    chart.timeScale().subscribeVisibleLogicalRangeChange(handler);
    chart.timeScale().subscribeSizeChange(handler);
    chart.subscribeCrosshairMove(crosshairHandler);
    
    const mouseUpHandler = () => setDragging(null);
    window.addEventListener('mouseup', mouseUpHandler);
    
    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      chart.timeScale().unsubscribeSizeChange(handler);
      chart.unsubscribeCrosshairMove(crosshairHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
    }
  }, [chart, series, currentPoints.length, dragging, drawings]);

  if (!chart || !series) return null;

  const toCoords = (p: DrawingPoint) => {
     const x = chart.timeScale().logicalToCoordinate(p.logical as any);
     const y = series.priceToCoordinate(p.price);
     return { x: x || -1000, y: y || -1000 };
  };

  const activeMouse = mouseRef.current ? toCoords(mouseRef.current) : null;

  const renderFib = (d: ChartDrawing | { p1: DrawingPoint, p2: DrawingPoint }, isSelected: boolean, id: string) => {
    const c1 = toCoords(d.p1);
    const c2 = toCoords(d.p2!);
    const minX = Math.min(c1.x, c2.x);
    const maxX = Math.max(c1.x, c2.x);
    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    
    return (
      <g key={id} style={{ pointerEvents: 'auto' }}>
        <rect 
           x={minX} y={Math.min(c1.y, c2.y) - 20} width={Math.max(10, maxX - minX)} height={Math.max(10, Math.abs(c1.y - c2.y) + 40)} 
           fill="transparent" 
           onClick={() => onSelect(id)} 
           onMouseDown={(e) => { e.stopPropagation(); setDragging({id, point: 'move', xOffset: mouseRef.current?.logical, yOffset: mouseRef.current?.price}); onSelect(id); }}
           className={isSelected ? "cursor-move" : "cursor-pointer"}
        />
        {isSelected && (
           <>
              <circle cx={c1.x} cy={c1.y} r={8} fill="#8b5cf6" className="cursor-crosshair" onMouseDown={(e) => { e.stopPropagation(); setDragging({id, point: 'p1'}); }} />
              <circle cx={c2.x} cy={c2.y} r={8} fill="#8b5cf6" className="cursor-crosshair" onMouseDown={(e) => { e.stopPropagation(); setDragging({id, point: 'p2'}); }} />
           </>
        )}
        {fibLevels.map(level => {
           const y = c1.y + (c2.y - c1.y) * level;
           return (
             <g key={level} style={{ pointerEvents: 'none' }}>
               <line x1={minX} y1={y} x2={maxX} y2={y} stroke={level === 0 || level === 1 ? '#6b7280' : '#8b5cf6'} strokeWidth={1} strokeDasharray="4 4" />
               <text x={minX} y={y - 4} fill="#9ca3af" fontSize={10}>{level}</text>
             </g>
           );
        })}
      </g>
    );
  };

  return (
    <>
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none', zIndex: 20 }}>
        {drawings.map(d => {
          if (!d.p2) return null;
          const isSelected = selectedId === d.id;
          if (d.type === 'trendline') {
             const c1 = toCoords(d.p1);
             const c2 = toCoords(d.p2);
             return (
               <g key={d.id} style={{ pointerEvents: 'auto' }}>
                 <line 
                   x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} 
                   stroke="transparent" strokeWidth={20} 
                   onClick={() => onSelect(d.id)}
                   onMouseDown={(e) => { e.stopPropagation(); setDragging({id: d.id, point: 'move', xOffset: mouseRef.current?.logical, yOffset: mouseRef.current?.price}); onSelect(d.id); }}
                   className={isSelected ? "cursor-move" : "cursor-pointer"}
                 />
                 <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke={isSelected ? "#60a5fa" : "#3b82f6"} strokeWidth={2} style={{pointerEvents:'none'}} />
                 {isSelected && (
                   <>
                     <circle cx={c1.x} cy={c1.y} r={8} fill="#60a5fa" className="cursor-crosshair" onMouseDown={(e) => { e.stopPropagation(); setDragging({id: d.id, point: 'p1'}); }} />
                     <circle cx={c2.x} cy={c2.y} r={8} fill="#60a5fa" className="cursor-crosshair" onMouseDown={(e) => { e.stopPropagation(); setDragging({id: d.id, point: 'p2'}); }} />
                   </>
                 )}
               </g>
             );
          } else if (d.type === 'fibonacci') {
             return renderFib(d, isSelected, d.id);
          }
          return null;
        })}
        
        {currentPoints.length === 1 && activeMouse && (
          mode === 'trendline' ? (
             <line x1={toCoords(currentPoints[0]).x} y1={toCoords(currentPoints[0]).y} x2={activeMouse.x} y2={activeMouse.y} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" />
          ) : mode === 'fibonacci' ? renderFib({ p1: currentPoints[0], p2: mouseRef.current! } as any, false, 'preview') : null
        )}
      </svg>
      {selectedId && mode === 'cursor' && drawings.find(d => d.id === selectedId) && (
        <div className="absolute top-4 right-4 z-30 bg-gray-900 border border-white/10 rounded shadow-lg p-1">
           <button onClick={() => onDelete(selectedId)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded">
             <Trash2 size={16} />
           </button>
        </div>
      )}
    </>
  );
}

export function BacktestReplay() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [candlestickSeries, setCandlestickSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const seriesMarkersPluginRef = useRef<any>(null);
  
  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackIntervalRef = useRef<any>(null);

  const [trades, setTrades] = useState<ReplayTrade[]>([]);
  const balance = 100000 + trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const [showSettings, setShowSettings] = useState(false);

  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [slPips, setSlPips] = useState<number | ''>(50);
  const [tpPips, setTpPips] = useState<number | ''>(100);
  const [trailingSlEnabled, setTrailingSlEnabled] = useState(false);
  
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2024-06-01');

  type ToastInfo = { id: string, message: string, type: 'success' | 'warning' | 'error' | 'info' };
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const addToast = (message: string, type: ToastInfo['type'] = 'info') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const jumpToTime = (time: number) => {
    const idx = historicalData.findIndex(d => (d.time as number) === time);
    if (idx !== -1) {
      setCurrentDataIndex(idx);
      setIsPlaying(false);
      if (candlestickSeries) {
        candlestickSeries.setData(historicalData.slice(0, idx + 1));
      }
    }
  };

  const [drawingMode, setDrawingMode] = useState<'cursor' | 'trendline' | 'fibonacci'>('cursor');
  const drawingModeRef = useRef(drawingMode);
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [currentPoints, setCurrentPoints] = useState<DrawingPoint[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [showTradeHistory, setShowTradeHistory] = useState(false);

  useEffect(() => {
    drawingModeRef.current = drawingMode;
  }, [drawingMode]);

  const [isFetchingData, setIsFetchingData] = useState(false);

  // Initialize data
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setIsFetchingData(true);
      const tfMinutes = TIMEFRAMES[timeframe];
      const start = new Date(`${startDate}T00:00:00Z`);
      const end = new Date(`${endDate}T23:59:59Z`);
      
      // Check for valid dates
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        setIsFetchingData(false);
        return; 
      }

      let data: CandlestickData[] = [];
      try {
         // Attempt to fetch real historical data
         const tfParam = timeframe === '1D' ? '1d' : timeframe === '1h' ? '60m' : timeframe;
         const res = await fetch(`/api/historical?symbol=${selectedAsset.symbol}&start=${start.toISOString()}&end=${end.toISOString()}&interval=${tfParam}`);
         if (!res.ok) throw new Error("Failed to fetch real data");
         
         const json = await res.json();
         if (active && Array.isArray(json) && json.length > 50) {
            data = json as CandlestickData[];
            addToast(`Loaded ${data.length} real bars for ${selectedAsset.symbol}`, 'success');
         } else {
            throw new Error("Invalid or insufficient data length");
         }
      } catch (e) {
         // Fallback to simulated data if real data fails
         if (active) {
            addToast(`Real data unavailable for ${selectedAsset.symbol} on this timeframe. Using simulated data.`, 'warning');
            let count = Math.floor((end.getTime() - start.getTime()) / (tfMinutes * 60 * 1000));
            if (count < 100) count = 100;
            if (count > 200000) count = 200000;
            data = generateHistoricalData(count, selectedAsset.startPrice, start, tfMinutes);
         }
      }

      if (active && data.length > 0) {
        setHistoricalData(data);
        setCurrentDataIndex(Math.min(100, data.length - 1));
        setIsPlaying(false);
        setTrades([]);
      }
      if (active) setIsFetchingData(false);
    };

    fetchData();

    return () => { active = false; };
  }, [timeframe, startDate, endDate, selectedAsset]);

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
      localization: {
        priceFormatter: (price: number) => price.toFixed(selectedAsset.decimals),
      },
    });

    const series = newChart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
      priceFormat: {
        type: 'price',
        precision: selectedAsset.decimals,
        minMove: selectedAsset.pipSize,
      },
    });

    setChart(newChart);
    setCandlestickSeries(series);
    
    // Create markers plugin
    const markersPlugin = createSeriesMarkers(series as any, []);
    seriesMarkersPluginRef.current = markersPlugin;

    // Initial data setup
    const initialData = historicalData.slice(0, 100);
    series.setData(initialData);
    newChart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        newChart.applyOptions({ 
           width: chartContainerRef.current.clientWidth, 
           height: chartContainerRef.current.clientHeight 
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      newChart.remove();
    };
  }, [historicalData, selectedAsset.decimals, selectedAsset.pipSize]);

  // Click handler for drawing
  useEffect(() => {
    if (!chart || !candlestickSeries) return;

    const handleClick = (param: MouseEventParams) => {
       if (drawingModeRef.current === 'cursor') {
          // Selecting is handled by SVG onClick directly!
          if (!param.point) {
            setSelectedDrawingId(null);
          }
          return;
       }

       if (param.logical === undefined || param.point === undefined) return;
       
       const price = candlestickSeries.coordinateToPrice(param.point.y);
       if (price === null) return;
       
       const newPoint: DrawingPoint = { logical: param.logical as number, price };
       
       setCurrentPoints(prev => {
          if (prev.length === 0) return [newPoint];
          if (prev.length === 1) {
             const newDrawing: ChartDrawing = {
                id: Math.random().toString(),
                type: drawingModeRef.current as any,
                p1: prev[0],
                p2: newPoint
             };
             setDrawings(d => [...d, newDrawing]);
             setDrawingMode('cursor');
             return [];
          }
          return prev;
       });
    };

    chart.subscribeClick(handleClick);
    return () => chart.unsubscribeClick(handleClick);
  }, [chart, candlestickSeries]);

  const clearDrawings = () => {
    setDrawings([]);
    setCurrentPoints([]);
    setSelectedDrawingId(null);
    setDrawingMode('cursor');
  };

  const priceLinesRef = useRef<any[]>([]);

  const [closedTradeFilter, setClosedTradeFilter] = useState<'All' | 'Win' | 'Loss' | 'Break-even'>('All');

  useEffect(() => {
    if (!candlestickSeries) return;

    // Clear old price lines
    priceLinesRef.current.forEach(line => {
      try {
        candlestickSeries.removePriceLine(line);
      } catch (e) {
        // ignore errors if line was already removed
      }
    });
    priceLinesRef.current = [];

    // Draw active trades
    trades.forEach(trade => {
      if (trade.exitPrice) return; // Only open trades
      if (trade.symbol && trade.symbol !== selectedAsset.symbol) return;

      const shortId = trade.id.substring(0, 4);

      const entryLine = candlestickSeries.createPriceLine({
        price: trade.entryPrice,
        color: trade.type === 'Long' ? '#10b981' : '#ef4444',
        lineWidth: 2,
        lineStyle: 0, // Solid line for entry
        axisLabelVisible: true,
        title: `${trade.type} Entry (${shortId})`,
      });
      priceLinesRef.current.push(entryLine);

      if (trade.sl) {
        const slLine = candlestickSeries.createPriceLine({
          price: trade.sl,
          color: '#f43f5e', // Rose
          lineWidth: 2,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: `SL (${shortId})`,
        });
        priceLinesRef.current.push(slLine);
      }

      if (trade.tp) {
        const tpLine = candlestickSeries.createPriceLine({
          price: trade.tp,
          color: '#10b981', // Emerald
          lineWidth: 2,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: `TP (${shortId})`,
        });
        priceLinesRef.current.push(tpLine);
      }
    });

    // Draw trade history markers
    const markers: any[] = [];
    if (showTradeHistory) {
      trades.forEach(t => {
        if (t.symbol && t.symbol !== selectedAsset.symbol) return;
        if (t.exitPrice && t.exitTime) {
          markers.push({
            time: t.entryTime as Time,
            position: t.type === 'Long' ? 'belowBar' : 'aboveBar',
            color: t.type === 'Long' ? '#10b981' : '#ef4444',
            shape: t.type === 'Long' ? 'arrowUp' : 'arrowDown',
            text: `Entry ${t.type}`
          });
          markers.push({
            time: t.exitTime as Time,
            position: t.type === 'Long' ? 'aboveBar' : 'belowBar',
            color: (t.pnl || 0) >= 0 ? '#10b981' : '#f43f5e',
            shape: t.type === 'Long' ? 'arrowDown' : 'arrowUp', 
            text: `Exit ${(t.pnl || 0) >= 0 ? 'Win' : 'Loss'}`
          });
        }
      });
      markers.sort((a, b) => (a.time as number) - (b.time as number));
    }
    if (seriesMarkersPluginRef.current) {
        seriesMarkersPluginRef.current.setMarkers(markers);
    }
  }, [trades, candlestickSeries, showTradeHistory, selectedAsset.symbol]);

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

  const tradesRef = useRef(trades);
  useEffect(() => {
    tradesRef.current = trades;
  }, [trades]);

  // Simulate SL/TP triggers
  useEffect(() => {
    if (currentDataIndex <= 0 || !historicalData[currentDataIndex]) return;
    
    const currentCandle = historicalData[currentDataIndex];
    let changed = false;
    const messages: {msg: string, type: 'success' | 'warning'}[] = [];

    const newTrades = tradesRef.current.map(trade => {
      if (trade.exitPrice) return trade; // Already closed

      let triggerPrice: number | undefined;
      let triggerType = '';
      
      let currentSl = trade.sl;
      let slChanged = false;

      if (trade.trailingSl && trade.slDistance) {
         if (trade.type === 'Long') {
             const newSl = currentCandle.close - trade.slDistance;
             if (!currentSl || newSl > currentSl) { currentSl = newSl; slChanged = true; }
         } else {
             const newSl = currentCandle.close + trade.slDistance;
             if (!currentSl || newSl < currentSl) { currentSl = newSl; slChanged = true; }
         }
      }

      if (trade.type === 'Long') {
        if (currentSl && currentCandle.low <= currentSl) { triggerPrice = currentSl; triggerType = 'SL'; }
        else if (trade.tp && currentCandle.high >= trade.tp) { triggerPrice = trade.tp; triggerType = 'TP'; }
      } else {
        if (currentSl && currentCandle.high >= currentSl) { triggerPrice = currentSl; triggerType = 'SL'; }
        else if (trade.tp && currentCandle.low <= trade.tp) { triggerPrice = trade.tp; triggerType = 'TP'; }
      }

      if (triggerPrice !== undefined) {
        changed = true;
        const pnl = (trade.type === 'Long' ? triggerPrice - trade.entryPrice : trade.entryPrice - triggerPrice) * selectedAsset.lotSize;
        messages.push({
          msg: `${trade.type} position hit ${triggerType} at ${triggerPrice.toFixed(selectedAsset.decimals)}`,
          type: pnl >= 0 ? 'success' : 'warning'
        });
        return {
          ...trade,
          exitPrice: triggerPrice,
          exitTime: currentCandle.time as number,
          pnl
        };
      }
      
      if (slChanged) {
        changed = true;
        return {
           ...trade,
           sl: currentSl
        }
      }
      return trade;
    });

    if (changed) {
      setTrades(newTrades);
      messages.forEach(m => addToast(m.msg, m.type));
    }
  }, [currentDataIndex, historicalData, selectedAsset]);

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
    const currentCandle = historicalData[currentDataIndex];
    if (!currentCandle) return;

    const { atr, spread } = marketConditions;
    
    // Dynamic slippage: random up to 10% of ATR
    const slippage = Math.random() * (atr * 0.1);

    const entryPrice = type === 'Long' 
      ? marketConditions.ask + slippage 
      : marketConditions.bid - slippage;

    let sl: number | undefined;
    let tp: number | undefined;

    if (slPips) {
      const slDist = slPips * selectedAsset.pipSize;
      sl = type === 'Long' ? entryPrice - slDist : entryPrice + slDist;
    }
    if (tpPips) {
      const tpDist = tpPips * selectedAsset.pipSize;
      tp = type === 'Long' ? entryPrice + tpDist : entryPrice - tpDist;
    }

    const newTrade: ReplayTrade = {
      id: Math.random().toString(36).substring(7),
      symbol: selectedAsset.symbol,
      type,
      entryPrice,
      entryTime: currentCandle.time as number,
      sl,
      tp,
      trailingSl: trailingSlEnabled,
      slDistance: slPips ? slPips * selectedAsset.pipSize : undefined
    };
    setTrades([newTrade, ...trades]);
    addToast(`${type} Market executed at ${entryPrice.toFixed(selectedAsset.decimals)}`, 'info');
  };

  const handleCloseTrade = (tradeId: string) => {
    let newToast: { msg: string, type: 'success' | 'error' } | null = null;
    
    setTrades(prevTrades => prevTrades.map(trade => {
      if (trade.id === tradeId && !trade.exitPrice) {
        const isLong = trade.type === 'Long';
        // Close long -> sell at Bid. Close short -> buy at Ask.
        const exitPrice = isLong ? marketConditions.bid : marketConditions.ask;
        
        // Use lot size from selected asset config
        const priceDiff = isLong ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
        const pnl = priceDiff * selectedAsset.lotSize; 
        
        newToast = {
          msg: `Trade ${trade.type} closed manually at ${exitPrice.toFixed(selectedAsset.decimals)}`,
          type: pnl >= 0 ? 'success' : 'error'
        };

        return {
          ...trade,
          exitPrice,
          exitTime: historicalData[currentDataIndex].time as number,
          pnl
        };
      }
      return trade;
    }));
    if (newToast) {
       addToast(newToast.msg, newToast.type);
    }
  };

  const currentCandle = historicalData[currentDataIndex];
  const currentPrice = currentCandle?.close || 0;

  const marketConditions = React.useMemo(() => {
    let atr = 0.0020; // fallback 20 pips
    if (historicalData.length > 0 && currentDataIndex > 0) {
      const lookback = Math.min(currentDataIndex, 10);
      let trSum = 0;
      let actualLookback = 0;
      for (let i = 1; i <= lookback; i++) {
        const curr = historicalData[currentDataIndex - i + 1];
        const prev = historicalData[currentDataIndex - i];
        if (curr && prev) {
          const tr = Math.max(
            curr.high - curr.low,
            Math.abs(curr.high - prev.close),
            Math.abs(curr.low - prev.close)
          );
          trSum += tr;
          actualLookback++;
        }
      }
      if (actualLookback > 0) atr = trSum / actualLookback;
    }
    
    // Dynamic spread: 0.5 pips base + 5% of ATR
    const spread = (0.5 * selectedAsset.pipSize) + (atr * 0.05);

    return {
      atr,
      spread,
      ask: currentPrice + (spread / 2),
      bid: currentPrice - (spread / 2)
    };
  }, [historicalData, currentDataIndex, currentPrice, selectedAsset]);

  const activeTrades = trades.filter(t => !t.exitPrice);
  const closedTrades = trades.filter(t => t.exitPrice).filter(t => {
    if (closedTradeFilter === 'All') return true;
    if (closedTradeFilter === 'Win') return (t.pnl || 0) > 0;
    if (closedTradeFilter === 'Loss') return (t.pnl || 0) < 0;
    if (closedTradeFilter === 'Break-even') return (t.pnl || 0) === 0;
    return true;
  });
  
  // Calculate unrealized PnL
  const unrealizedPnL = activeTrades.reduce((acc, trade) => {
    const isLong = trade.type === 'Long';
    const exitPrice = isLong ? marketConditions.bid : marketConditions.ask;
    const priceDiff = isLong ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
    return acc + (priceDiff * selectedAsset.lotSize);
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
        <div className="lg:col-span-3 flex flex-col space-y-4 min-h-[500px] lg:min-h-0">
          <div className="glass-panel p-1 flex-1 relative border border-white/5 overflow-hidden flex flex-col group">
              {/* Chart Overlay Controls */}
             {isFetchingData && (
               <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                 <div className="flex items-center space-x-3 text-indigo-400 bg-gray-900 px-6 py-4 rounded-xl border border-white/10 shadow-2xl">
                   <RefreshCw className="animate-spin" size={24} />
                   <span className="font-semibold text-white">Fetching Historical Data...</span>
                 </div>
               </div>
             )}

             <div className="absolute top-4 left-4 z-10 flex items-center space-x-4">
               <div className="bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 flex items-center space-x-3 shadow-lg pointer-events-auto">
                 <select 
                   value={selectedAsset.symbol} 
                   onChange={e => setSelectedAsset(ASSETS.find(a => a.symbol === e.target.value) || ASSETS[0])}
                   className="bg-transparent text-sm font-mono text-gray-300 focus:outline-none focus:text-white cursor-pointer"
                 >
                   {ASSETS.map(asset => (
                     <option key={asset.symbol} value={asset.symbol} className="bg-gray-900">{asset.symbol}</option>
                   ))}
                 </select>
                 <span className="font-mono text-sm font-bold text-white">{currentPrice.toFixed(selectedAsset.decimals)}</span>
               </div>
               
               <div className="bg-gray-900/80 backdrop-blur-md p-1 rounded border border-white/10 flex items-center space-x-1 shadow-lg pointer-events-auto">
                 {(Object.keys(TIMEFRAMES) as Timeframe[]).map(tf => (
                   <button
                     key={tf}
                     onClick={() => setTimeframe(tf)}
                     className={clsx(
                       "px-2 py-0.5 text-xs font-mono font-bold rounded transition-colors",
                       timeframe === tf ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white hover:bg-white/5"
                     )}
                   >
                     {tf}
                   </button>
                 ))}
               </div>

               <div className="bg-gray-900/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center space-x-2 shadow-lg pointer-events-auto">
                 <input 
                   type="date"
                   value={startDate}
                   onChange={e => setStartDate(e.target.value)}
                   className="bg-transparent text-xs text-gray-300 focus:outline-none focus:text-white font-mono cursor-pointer"
                   style={{ colorScheme: 'dark' }}
                   title="Start Date"
                 />
                 <span className="text-gray-600">-</span>
                 <input 
                   type="date"
                   value={endDate}
                   onChange={e => setEndDate(e.target.value)}
                   className="bg-transparent text-xs text-gray-300 focus:outline-none focus:text-white font-mono cursor-pointer"
                   style={{ colorScheme: 'dark' }}
                   title="End Date"
                 />
               </div>
             </div>

             {/* Drawing Tools Sidebar */}
             <div className="absolute top-20 left-4 z-10 flex flex-col items-center space-y-1.5 bg-gray-900/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-lg pointer-events-auto cursor-default">
                <button
                  onClick={() => setDrawingMode('cursor')}
                  className={clsx("p-2 rounded transition-colors", drawingMode === 'cursor' ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white hover:bg-white/5")}
                  title="Cursor"
                >
                  <MousePointer2 size={18} />
                </button>
                <button
                  onClick={() => setDrawingMode('trendline')}
                  className={clsx("p-2 rounded transition-colors", drawingMode === 'trendline' ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white hover:bg-white/5")}
                  title="Trend Line"
                >
                  <MoveDiagonal size={18} />
                </button>
                <button
                  onClick={() => setDrawingMode('fibonacci')}
                  className={clsx("p-2 rounded transition-colors", drawingMode === 'fibonacci' ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white hover:bg-white/5")}
                  title="Fibonacci Retracements"
                >
                  <AlignJustify size={18} />
                </button>
                <button
                  onClick={() => setShowTradeHistory(!showTradeHistory)}
                  className={clsx("p-2 rounded transition-colors relative", showTradeHistory ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white hover:bg-white/5")}
                  title="Show Trade History on Chart"
                >
                  <History size={18} />
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-gray-900 bg-gradient-to-r from-red-500 to-blue-500" />
                </button>
                <div className="w-6 h-px bg-white/10 my-1" />
                <button
                  onClick={clearDrawings}
                  className="p-2 rounded transition-colors text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  title="Clear All Drawings"
                >
                  <Trash2 size={18} />
                </button>
             </div>

             <div className="flex-1 w-full relative">
               <div className="absolute inset-0" ref={chartContainerRef}></div>
               <DrawingsOverlay 
                 chart={chart} 
                 series={candlestickSeries} 
                 drawings={drawings} 
                 currentPoints={currentPoints} 
                 mode={drawingMode} 
                 selectedId={selectedDrawingId}
                 onSelect={setSelectedDrawingId}
                 onDelete={(id) => setDrawings(d => d.filter(x => x.id !== id))}
                 onUpdate={(id, update) => setDrawings(d => d.map(x => x.id === id ? update : x))}
               />
             </div>
             
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
                 <div className="flex items-center space-x-3 bg-black/40 rounded px-3 py-1.5 border border-white/5">
                   <span className="text-[10px] uppercase font-bold text-gray-500 w-6">{playbackSpeed}x</span>
                   <input 
                     type="range" 
                     min="1" 
                     max="50" 
                     step="1"
                     value={playbackSpeed} 
                     onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                     className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                   />
                 </div>
               </div>
               
               <div className="flex items-center space-x-4 text-xs font-mono text-gray-400">
                 <div className="flex items-center space-x-1" title="Current Spread">
                   <span className="text-gray-500">Spread:</span>
                   <span>{(marketConditions.spread / selectedAsset.pipSize).toFixed(1)}</span>
                 </div>
                 <div className="h-3 w-px bg-white/10"></div>
                 <div className="flex items-center space-x-1" title="Current Volatility (ATR)">
                   <span className="text-gray-500">Vol:</span>
                   <span>{(marketConditions.atr / selectedAsset.pipSize).toFixed(1)}</span>
                 </div>
                 <div className="h-3 w-px bg-white/10"></div>
                 <span className="text-gray-500">
                   {historicalData[currentDataIndex] && new Date(Number(historicalData[currentDataIndex].time) * 1000).toLocaleString()}
                 </span>
               </div>
             </div>
          </div>

          {/* Execution Panel Below Chart */}
          <div className="glass-panel p-4 flex justify-between items-center border border-white/5">
             <div className="flex items-center space-x-4">
               <button 
                 onClick={() => handleExecuteTrade('Short')}
                 className="flex flex-col items-center justify-center bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] w-48"
               >
                 <div className="flex items-center space-x-2 font-bold tracking-widest text-sm uppercase">
                   <TrendingDown size={16} /> <span>Short Market</span>
                 </div>
                 <span className="font-mono text-xs text-white/80 mt-1">Bid {marketConditions.bid.toFixed(selectedAsset.decimals)}</span>
               </button>
               <button 
                 onClick={() => handleExecuteTrade('Long')}
                 className="flex flex-col items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] w-48"
               >
                 <div className="flex items-center space-x-2 font-bold tracking-widest text-sm uppercase">
                   <TrendingUp size={16} /> <span>Long Market</span>
                 </div>
                 <span className="font-mono text-xs text-white/80 mt-1">Ask {marketConditions.ask.toFixed(selectedAsset.decimals)}</span>
               </button>
             </div>

             <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 text-xs">
                  <label className="text-gray-400 font-bold uppercase tracking-wider">SL (PTS)</label>
                  <input 
                    type="number" 
                    value={slPips} 
                    onChange={e => setSlPips(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-black/50 border border-white/10 rounded px-2 py-1.5 w-16 text-center text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <label className="text-gray-400 font-bold uppercase tracking-wider">TP (PTS)</label>
                  <input 
                    type="number" 
                    value={tpPips} 
                    onChange={e => setTpPips(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-black/50 border border-white/10 rounded px-2 py-1.5 w-16 text-center text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <label className="text-gray-400 font-bold uppercase tracking-wider cursor-pointer flex items-center space-x-1.5">
                    <input 
                      type="checkbox"
                      checked={trailingSlEnabled}
                      onChange={e => setTrailingSlEnabled(e.target.checked)}
                      className="accent-indigo-500 w-3 h-3 cursor-pointer"
                    />
                    <span>Trailing SL</span>
                  </label>
                </div>
             </div>

             <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl text-gray-300 transition-all border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:border-indigo-500/50 hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-95"
                  title="Backtest Settings"
                >
                  <Settings size={20} className={showSettings ? "animate-[spin_4s_linear_infinite] text-indigo-400" : ""} />
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 mb-3 w-64 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col"
                    >
                      <div className="p-3 border-b border-white/10 bg-black/20">
                         <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                           <Settings size={16} className="text-indigo-400" />
                           <span>Replay Settings</span>
                         </h3>
                      </div>
                      <div className="p-2 flex flex-col space-y-1">
                        <button 
                          onClick={() => {
                            setTrades([]);
                            setCurrentDataIndex(100);
                            setIsPlaying(false);
                            setShowSettings(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <RefreshCw size={16} />
                          <span>Restart Session</span>
                        </button>
                        <button 
                          onClick={() => {
                            const activeIds = trades.filter(t => !t.exitPrice).map(t => t.id);
                            activeIds.forEach(id => handleCloseTrade(id));
                            setShowSettings(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <XCircle size={16} />
                          <span>Close All Positions</span>
                        </button>
                        <div className="h-px bg-white/10 my-1"></div>
                        <button 
                          onClick={() => {
                            clearDrawings();
                            setShowSettings(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <Trash2 size={16} />
                          <span>Clear Chart Drawings</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                const exitPrice = isLong ? marketConditions.bid : marketConditions.ask;
                const currentPnL = (isLong ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice) * selectedAsset.lotSize;
                
                return (
                  <div 
                    key={trade.id} 
                    onClick={() => setSelectedTradeId(selectedTradeId === trade.id ? null : trade.id)}
                    className={clsx(
                      "bg-indigo-950/20 border p-3 rounded-xl relative overflow-hidden transition-all cursor-pointer",
                      selectedTradeId === trade.id ? "border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.25)]" : "border-indigo-500/20 hover:border-indigo-500/40"
                    )}
                  >
                    <div className={clsx("absolute top-0 left-0 w-1.5 h-full", isLong ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")} />
                    <div className="flex justify-between items-start pl-3">
                       <div className="flex-1">
                         <div className="flex items-center space-x-2">
                           <span className={clsx("text-xs font-bold uppercase tracking-wider", isLong ? "text-emerald-400" : "text-red-400")}>{trade.type} {trade.symbol}</span>
                           <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Active</span>
                         </div>
                         <div className="flex items-center space-x-2 mt-1">
                           <span className="text-xs font-mono text-gray-400">@ {trade.entryPrice.toFixed(selectedAsset.decimals)}</span>
                         </div>
                         <div className={clsx("font-mono font-bold mt-2 text-sm", currentPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                           {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)}
                         </div>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleCloseTrade(trade.id); }}
                         className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors shrink-0"
                         title="Close Position"
                       >
                         <XCircle size={18} />
                       </button>
                    </div>

                    {selectedTradeId === trade.id && (
                      <div className="mt-4 pt-3 border-t border-white/10 pl-3 text-xs space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Opened</span>
                          <span className="text-gray-300">{new Date(trade.entryTime * 1000).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Entry</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-gray-300">{trade.entryPrice.toFixed(selectedAsset.decimals)}</span>
                            <button onClick={(e) => { e.stopPropagation(); jumpToTime(trade.entryTime); }} className="text-indigo-400 hover:text-indigo-300 transition-colors" title="Jump to Entry"><Target size={14}/></button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Current</span>
                          <span className="font-mono text-gray-300">{exitPrice.toFixed(selectedAsset.decimals)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Points Diff</span>
                          <span className={clsx("font-mono", currentPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {((isLong ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice) / selectedAsset.pipSize).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                          <span className="text-gray-500">Unrealized PnL</span>
                          <span className={clsx("font-mono font-bold", currentPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4 mb-4">
            <h2 className="font-semibold text-lg text-white">Closed History</h2>
            <select
              value={closedTradeFilter}
              onChange={(e) => setClosedTradeFilter(e.target.value as any)}
              className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="Break-even">Break-even</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-2">
            {closedTrades.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No closed trades yet.</p>
            ) : (
              closedTrades.map(trade => {
                const isLong = trade.type === 'Long';
                const isWin = (trade.pnl || 0) >= 0;
                
                return (
                <div 
                  key={trade.id} 
                  onClick={() => setSelectedTradeId(selectedTradeId === trade.id ? null : trade.id)}
                  className={clsx(
                    "flex flex-col p-3 rounded-xl transition-all border cursor-pointer relative overflow-hidden",
                    selectedTradeId === trade.id ? "bg-white/10 border-indigo-500/50" : "bg-black/20 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className={clsx("absolute top-0 left-0 w-1 h-full opacity-70", isWin ? "bg-emerald-500" : "bg-red-500")} />

                  <div className="flex items-center justify-between pl-2">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className={clsx("text-[10px] font-bold uppercase tracking-wider", isLong ? "text-emerald-400" : "text-red-400")}>
                          {trade.type} {trade.symbol}
                        </span>
                        <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", isWin ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                          {isWin ? 'Win' : 'Loss'}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-gray-400 mt-1">{new Date(trade.entryTime * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className={clsx("font-mono font-bold text-sm", isWin ? "text-emerald-400" : "text-red-400")}>
                      {isWin ? '+' : ''}{(trade.pnl || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  {selectedTradeId === trade.id && (
                    <div className="mt-3 pt-3 border-t border-white/10 pl-2 text-xs space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Entry</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-gray-300">{trade.entryPrice.toFixed(selectedAsset.decimals)}</span>
                          <button onClick={(e) => { e.stopPropagation(); jumpToTime(trade.entryTime); }} className="text-indigo-400 hover:text-indigo-300 transition-colors" title="Jump to Entry"><Target size={14}/></button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Exit</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-gray-300">{trade.exitPrice?.toFixed(selectedAsset.decimals)}</span>
                          {trade.exitTime && <button onClick={(e) => { e.stopPropagation(); jumpToTime(trade.exitTime!); }} className="text-indigo-400 hover:text-indigo-300 transition-colors" title="Jump to Exit"><Target size={14}/></button>}
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500">Points Diff</span>
                        <span className={clsx("font-mono", (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {((isLong ? (trade.exitPrice || 0) - trade.entryPrice : trade.entryPrice - (trade.exitPrice || 0)) / selectedAsset.pipSize).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-500">Duration</span>
                        <span className="font-mono text-gray-300">
                          {trade.exitTime ? Math.floor((trade.exitTime - trade.entryTime) / 3600) : 0}h
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )})
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } }}
              className={clsx(
                "px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md flex items-center space-x-3 pointer-events-auto",
                toast.type === 'success' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                toast.type === 'warning' ? "bg-amber-500/20 border-amber-500/50 text-amber-400" :
                toast.type === 'error' ? "bg-red-500/20 border-red-500/50 text-red-400" :
                "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
              )}
            >
              <div className="shrink-0">
                {toast.type === 'success' && <CheckCircle2 size={20} />}
                {toast.type === 'warning' && <AlertTriangle size={20} />}
                {toast.type === 'error' && <XCircle size={20} />}
                {toast.type === 'info' && <Info size={20} />}
              </div>
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
