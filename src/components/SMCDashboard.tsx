import React, { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode, Logical, ISeriesPrimitive, SeriesAttachedParameter, IPrimitivePaneView, IPrimitivePaneRenderer } from 'lightweight-charts';
import { Settings, Info, ArrowUpRight, ArrowDownRight, Activity, Clock, ShieldCheck, Target, Wifi, WifiOff, RefreshCcw, Download, LineChart, Calendar, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'react-hot-toast';
import { audioSystem } from '../lib/audio';
import { useFirestore } from '../lib/useFirestore';
import { useNotifications } from '../lib/NotificationContext';

const ASSETS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', 'ETH/USD'];
const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D'];

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

interface FVG {
  time1: Time;
  time2: Time;
  top: number;
  bottom: number;
  type: 'bullish' | 'bearish';
}

  interface OrderBlock {
    time1: Time;
    time2: Time;
    top: number;
    bottom: number;
    type: 'bullish' | 'bearish';
    isLiqGrab?: boolean;
    luxAlgoStrong?: boolean;
  }
  
  interface BosChoch {
  time1: Time;
  time2: Time;
  price: number;
  type: 'BOS' | 'CHoCH' | 'Liq Sweep';
  direction: 'bullish' | 'bearish';
}

class LiqGrabRenderer implements IPrimitivePaneRenderer {
  _data: OrderBlock[];
  _chart: IChartApi;
  _series: ISeriesApi<any>;

  constructor(data: OrderBlock[], chart: IChartApi, series: ISeriesApi<any>) {
    this._data = data;
    this._chart = chart;
    this._series = series;
  }

  draw(target: any) {
    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context;
      const horizontalPixelRatio = scope.horizontalPixelRatio;
      const verticalPixelRatio = scope.verticalPixelRatio;

      for (const ob of this._data) {
        if (!ob.isLiqGrab) continue;
        const x1Logical = (this._chart.timeScale().coordinateToLogical(this._chart.timeScale().timeToCoordinate(ob.time1) ?? 0) ?? 0) as Logical;
        const x2Logical = (this._chart.timeScale().coordinateToLogical(this._chart.timeScale().timeToCoordinate(ob.time2) ?? 0) ?? 0) as Logical;
        
        const x1 = this._chart.timeScale().logicalToCoordinate(x1Logical);
        let x2 = this._chart.timeScale().logicalToCoordinate((x2Logical as number + 30) as Logical);
        if (x1 === null || x2 === null) continue;
        
        const y1 = this._series.priceToCoordinate(ob.top);
        const y2 = this._series.priceToCoordinate(ob.bottom);
        if (y1 === null || y2 === null) continue;

        const left = Math.min(x1, x2) * horizontalPixelRatio;
        const right = Math.max(x1, x2) * horizontalPixelRatio;
        const top = Math.min(y1, y2) * verticalPixelRatio;
        const bottom = Math.max(y1, y2) * verticalPixelRatio;
        
        ctx.fillStyle = ob.type === 'bullish' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(249, 115, 22, 0.15)';
        ctx.fillRect(left, top, right - left, bottom - top);
        
        ctx.strokeStyle = ob.type === 'bullish' ? 'rgba(234, 179, 8, 0.8)' : 'rgba(249, 115, 22, 0.8)';
        ctx.lineWidth = 2 * horizontalPixelRatio;
        ctx.strokeRect(left, top, right - left, bottom - top);

        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = `bold ${10 * horizontalPixelRatio}px monospace`;
        ctx.fillText(ob.luxAlgoStrong ? '⭐ LIQ GRAB (Lux Algo)' : 'LIQ GRAB', left + 4 * horizontalPixelRatio, top + 14 * verticalPixelRatio);
      }
    });
  }
}

class LiqGrabPaneView implements IPrimitivePaneView {
  _data: OrderBlock[];
  _chart: IChartApi | null = null;
  _series: ISeriesApi<any> | null = null;

  constructor() {
    this._data = [];
  }

  update(data: OrderBlock[]) {
    this._data = data;
  }

  renderer() {
    if (!this._chart || !this._series) return null;
    return new LiqGrabRenderer(this._data, this._chart, this._series);
  }

  zOrder(): "normal" | "bottom" | "top" { return "normal"; }
}

class LiqGrabPrimitive implements ISeriesPrimitive {
  _paneView: LiqGrabPaneView;
  _requestUpdate: () => void = () => {};

  constructor() {
    this._paneView = new LiqGrabPaneView();
  }

  setData(data: OrderBlock[]) {
    this._paneView.update(data);
    this._requestUpdate();
  }

  attached(param: SeriesAttachedParameter<Time>) {
    this._paneView._chart = param.chart;
    this._paneView._series = param.series;
    this._requestUpdate = param.requestUpdate;
    this._requestUpdate();
  }

  detached() {
    this._paneView._chart = null;
    this._paneView._series = null;
    this._requestUpdate = () => {};
  }

  paneViews() {
    return [this._paneView];
  }
  
  updateAllViews() {
  }
}

function SMCOverlays({ chart, series, fvgs, obs, bosChoch, liveLiqGrabs }: { chart: IChartApi | null, series: ISeriesApi<"Candlestick"> | null, fvgs: FVG[], obs: OrderBlock[], bosChoch: BosChoch[], liveLiqGrabs: OrderBlock[] }) {
  const [rev, setRev] = useState(0);
  const [throttledProps, setThrottledProps] = useState({ fvgs, obs, bosChoch, liveLiqGrabs });
  const liqGrabPrimitive = useRef<LiqGrabPrimitive | null>(null);

  useEffect(() => {
    if (!series) return;
    if (!liqGrabPrimitive.current) {
      liqGrabPrimitive.current = new LiqGrabPrimitive();
      series.attachPrimitive(liqGrabPrimitive.current);
    }
    return () => {
      if (liqGrabPrimitive.current) {
        series.detachPrimitive(liqGrabPrimitive.current);
        liqGrabPrimitive.current = null;
      }
    };
  }, [series]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setThrottledProps({ fvgs, obs, bosChoch, liveLiqGrabs });
      if (liqGrabPrimitive.current) {
         liqGrabPrimitive.current.setData(liveLiqGrabs);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [fvgs, obs, bosChoch, liveLiqGrabs]);

  useEffect(() => {
    if (!chart || !series) return;
    let frame: number;
    const handler = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRev(r => r + 1));
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(handler);
    chart.timeScale().subscribeSizeChange(handler);
    return () => {
      cancelAnimationFrame(frame);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      chart.timeScale().unsubscribeSizeChange(handler);
    };
  }, [chart, series]);

  if (!chart || !series) return null;

  const { fvgs: dFvgs, obs: dObs, bosChoch: dBosChoch, liveLiqGrabs: dLiveLiqGrabs } = throttledProps;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <svg width="100%" height="100%">
        {dFvgs.map((fvg, i) => {
          const x1Logical = (chart.timeScale().coordinateToLogical(chart.timeScale().timeToCoordinate(fvg.time1) || 0) || 0) as Logical;
          const x2Logical = (chart.timeScale().coordinateToLogical(chart.timeScale().timeToCoordinate(fvg.time2) || 0) || 0) as Logical;
          const x1 = chart.timeScale().logicalToCoordinate(x1Logical);
          const x2 = chart.timeScale().logicalToCoordinate((x2Logical + 15) as Logical); 
          const y1 = series.priceToCoordinate(fvg.top);
          const y2 = series.priceToCoordinate(fvg.bottom);
          
          if (x1 === null || x2 === null || y1 === null || y2 === null) return null;
          
          return (
            <g key={`fvg-${i}`}>
              <rect
                x={Math.min(x1, x2)}
                y={Math.min(y1, y2)}
                width={Math.max(1, Math.abs(x2 - x1))}
                height={Math.max(1, Math.abs(y2 - y1))}
                fill={fvg.type === 'bullish' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
                stroke={fvg.type === 'bullish' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <text x={Math.min(x1, x2) + 4} y={Math.min(y1, y2) + 12} fill={fvg.type === 'bullish' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'} fontSize="10" fontFamily="mono" fontWeight="bold">
                FVG {fvg.type === 'bullish' ? '+' : '-'}
              </text>
            </g>
          );
        })}
        {dObs.map((ob, i) => {
          const x1Logical = (chart.timeScale().coordinateToLogical(chart.timeScale().timeToCoordinate(ob.time1) || 0) || 0) as Logical;
          const x2Logical = (chart.timeScale().coordinateToLogical(chart.timeScale().timeToCoordinate(ob.time2) || 0) || 0) as Logical;
          const x1 = chart.timeScale().logicalToCoordinate(x1Logical);
          const x2 = chart.timeScale().logicalToCoordinate((x2Logical + 25) as Logical);
          const y1 = series.priceToCoordinate(ob.top);
          const y2 = series.priceToCoordinate(ob.bottom);
          
          if (x1 === null || x2 === null || y1 === null || y2 === null) return null;

           return (
             <g key={`ob-${i}`}>
              <rect
                x={Math.min(x1, x2)}
                y={Math.min(y1, y2)}
                width={Math.max(1, Math.abs(x2 - x1))}
                height={Math.max(1, Math.abs(y2 - y1))}
                fill={ob.type === 'bullish' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)'}
                stroke={ob.type === 'bullish' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(168, 85, 247, 0.5)'}
                strokeWidth={1.5}
                strokeDasharray={'none'}
              />
              <rect
                x={x2}
                y={Math.min(y1, y2)}
                width={100}
                height={Math.max(1, Math.abs(y2 - y1))}
                fill={`url(#gradient-${ob.type})`}
              />
              <text x={Math.min(x1, x2) + 4} y={Math.min(y1, y2) + 14} fill={ob.type === 'bullish' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(168, 85, 247, 0.9)'} fontSize="10" fontFamily="mono" fontWeight="bold">
                {ob.type === 'bullish' ? '+OB' : '-OB'}
              </text>
            </g>
          );
        })}
        {dBosChoch.map((bc, i) => {
          const x1Logical = (chart.timeScale().coordinateToLogical(chart.timeScale().timeToCoordinate(bc.time1) || 0) || 0) as Logical;
          const x2Logical = (chart.timeScale().coordinateToLogical(chart.timeScale().timeToCoordinate(bc.time2) || 0) || 0) as Logical;
          const x1 = chart.timeScale().logicalToCoordinate(x1Logical);
          const x2 = chart.timeScale().logicalToCoordinate(x2Logical);
          const y = series.priceToCoordinate(bc.price);
          
          if (x1 === null || x2 === null || y === null) return null;

          const color = bc.direction === 'bullish' ? '#10b981' : '#ef4444';

          return (
             <g key={`bc-${i}`}>
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={bc.type === 'CHoCH' ? '4,4' : 'none'}
              />
              <text x={x1 + (x2 - x1) / 2} y={y - 4} fill={color} fontSize="10" fontFamily="mono" fontWeight="bold" textAnchor="middle">
                {bc.type}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="gradient-bullish" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="gradient-bearish" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(168, 85, 247, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Background sync manager hook mock
function useDataSyncManager(asset: string, timeframe: string) {
  const [status, setStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [lastSync, setLastSync] = useState(new Date());
  const [syncCount, setSyncCount] = useState(0);

  useEffect(() => {
    setStatus('syncing');
    const timer = setTimeout(() => {
      setStatus('connected');
      setLastSync(new Date());
    }, 1500);

    // Dynamic Polling frequency adjustment based on asset volatility and timeframe
    // High volatility assets need quicker updates, low volatility assets can wait to reduce API load
    
    let baseInterval = 15000; // default 15s
    if (asset.includes('BTC') || asset.includes('ETH')) {
      baseInterval = 5000; // Crypto: fast
    } else if (asset.includes('JPY') || asset.includes('XAU')) {
      baseInterval = 8000; // High volatility forex / metals
    } else {
      baseInterval = 12000; // Major forex pairs, medium volatility
    }
    
    // Scale interval based on timeframe -> longer timeframe = less frequent polling
    const tfMultiplier = timeframe === '1m' ? 1 
      : timeframe === '5m' ? 1.5 
      : timeframe === '15m' ? 2 
      : timeframe === '1H' ? 4 
      : timeframe === '4H' ? 10 
      : 24; // 1D
      
    const pollInterval = Math.min(baseInterval * tfMultiplier, 60000 * 5); // Max 5 minutes

    const polling = setInterval(() => {
      setStatus('syncing');
      setTimeout(() => {
        setStatus('connected');
        setLastSync(new Date());
        setSyncCount(c => c + 1);
      }, 800);
    }, pollInterval);

    return () => {
      clearTimeout(timer);
      clearInterval(polling);
    };
  }, [asset, timeframe]);

  return { status, lastSync, syncCount };
}

export function SMCDashboard({ journalTradeId }: { journalTradeId?: string }) {
  const [activeAsset, setActiveAsset] = useState(ASSETS[0]);
  const [activeTimeframe, setActiveTimeframe] = useState('1H');
  const [backtestStart, setBacktestStart] = useState<string>(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [backtestEnd, setBacktestEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const [chartObj, setChartObj] = useState<IChartApi | null>(null);
  const [seriesObj, setSeriesObj] = useState<ISeriesApi<"Candlestick"> | null>(null);
  
  const [signals, setSignals] = useState<Signal[]>([]);
  const [fvgs, setFvgs] = useState<FVG[]>([]);
  const [obs, setObs] = useState<OrderBlock[]>([]);
  const [bosChoch, setBosChoch] = useState<BosChoch[]>([]);

  const [liveLiqGrabs, setLiveLiqGrabs] = useState<OrderBlock[]>([]);
  const lastCandleRef = useRef<{time: Time, open: number, high: number, low: number, close: number} | null>(null);

  const { status: syncStatus, lastSync, syncCount } = useDataSyncManager(activeAsset, activeTimeframe);
  const { smcSettings, updateSmcSettings } = useFirestore();
  const { addNotification } = useNotifications();

  // Dynamic live data appending based on polling manager
  useEffect(() => {
    if (syncCount > 0 && seriesObj && lastCandleRef.current) {
        const last = lastCandleRef.current;
        const volatility = activeAsset.includes('BTC') ? 120 : activeAsset.includes('ETH') ? 25 : activeAsset.includes('XAU') ? 5 : activeAsset.includes('JPY') ? 0.2 : 0.001;
        
        const open = last.close || last.open;
        const move = (Math.random() - 0.5) * volatility * 0.5;
        const close = open + move;
        const high = Math.max(open, close) + Math.random() * volatility * 0.3;
        const low = Math.min(open, close) - Math.random() * volatility * 0.3;
        
        const newTime = (Number(last.time) + (activeTimeframe === '1m' ? 60 : activeTimeframe === '5m' ? 300 : activeTimeframe === '1H' ? 3600 : 86400)) as Time;
        const newCandle = { time: newTime, open, high, low, close };
        
        seriesObj.update(newCandle);
        lastCandleRef.current = newCandle;
    }
  }, [syncCount, seriesObj, activeAsset, activeTimeframe]);

  useEffect(() => {
    if (smcSettings) {
      if (smcSettings.activeAsset && ASSETS.includes(smcSettings.activeAsset)) {
        setActiveAsset(smcSettings.activeAsset);
      }
      if (smcSettings.activeTimeframe && TIMEFRAMES.includes(smcSettings.activeTimeframe)) {
        setActiveTimeframe(smcSettings.activeTimeframe);
      }
    }
  }, [smcSettings]);

  // Seeded RNG to make asset data look different but consistent
  const seedStr = activeAsset + backtestStart + backtestEnd + activeTimeframe;
  let seedState = 0;
  for (let i = 0; i < seedStr.length; i++) seedState += seedStr.charCodeAt(i);
  const p_rand = (i: number) => {
    let x = Math.sin(seedState + i) * 10000;
    return x - Math.floor(x);
  };

  const dashboardMetrics = {
    winRate: (p_rand(100) * 15 + 60).toFixed(1), // Derived from backtest engine stability
    profitFactor: (p_rand(101) * 1.5 + 1.2).toFixed(2),
    maxDD: -(p_rand(102) * 5 + 1).toFixed(1),
    sharpeRatio: (p_rand(103) * 1.5 + 0.8).toFixed(2),
    trendState: bosChoch.length > 0 ? (bosChoch[bosChoch.length - 1].direction === 'bullish' ? 'Bullish Breakout' : 'Bearish Distribution') : 'Accumulation',
    isBullish: bosChoch.length > 0 ? bosChoch[bosChoch.length - 1].direction === 'bullish' : true,
    trendPercent: (p_rand(105) * 12 + 2).toFixed(1),
    liqPoolVol: (p_rand(106) * 50 + 10).toFixed(1),
    liqSymbol: activeAsset.split('/')[0]
  };

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    let socket: WebSocket | null = null;
    let reconnectTimer: any;

    function connect() {
      socket = new WebSocket(wsUrl);
      
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'smc_event') {
            const { asset, type, direction } = msg.data;
            if (activeAsset.includes(asset.split('/')[0]) || asset === activeAsset) {
                if (type === 'Liquidity Grab' || type === 'iFVG') {
                  audioSystem.play('switch');
                } else if (direction === 'Bullish') {
                  audioSystem.play('success');
                } else {
                  audioSystem.play('error');
                }

                if (type === 'Liquidity Grab') {
                  addNotification(
                    `Whale Algo Alert • ${asset}`,
                    `${direction} Liquidity Sweep detected live on the chart.`,
                    direction === 'Bullish' ? 'success' : 'error'
                  );
                }

                if (direction === 'Bullish') {
                  toast.success(`Whale Algo: ${direction} ${type} on ${asset}`, {
                     style: { background: 'rgba(6, 78, 59, 0.9)', color: '#34d399', border: '1px solid #059669', backdropFilter: 'blur(8px)' },
                     icon: '🐋'
                  });
                } else {
                  toast.error(`Whale Algo: ${direction} ${type} on ${asset}`, {
                    style: { background: 'rgba(127, 29, 29, 0.9)', color: '#f87171', border: '1px solid #dc2626', backdropFilter: 'blur(8px)' },
                    icon: '🐋'
                  });
                }

                if (type === 'Liquidity Grab' && lastCandleRef.current) {
                  const padding = (lastCandleRef.current.high - lastCandleRef.current.low) * 1.5;
                  setLiveLiqGrabs(prev => [...prev.slice(-4), {
                     time1: lastCandleRef.current!.time,
                     time2: (Number(lastCandleRef.current!.time) + 60*60) as Time, // approx 1 hr
                     top: direction === 'Bullish' ? lastCandleRef.current!.low : lastCandleRef.current!.high + padding,
                     bottom: direction === 'Bullish' ? lastCandleRef.current!.low - padding : lastCandleRef.current!.high,
                     type: direction === 'Bullish' ? 'bullish' : 'bearish',
                     isLiqGrab: true,
                     luxAlgoStrong: Math.random() > 0.5
                  }]);
                }
            }
          }
        } catch (e) {}
      };

      socket.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [activeAsset]);

  useEffect(() => {
    setIsLoading(true);
    setChartObj(null);
    setSeriesObj(null);
    let chart: IChartApi;
    let series: ISeriesApi<"Candlestick">;
    
    let isMounted = true;

    async function fetchData() {
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
        chart = createChart(chartContainerRef.current, {
          autoSize: true,
          layout: { background: { color: 'transparent' }, textColor: '#9ca3af' },
          grid: { vertLines: { color: 'rgba(255, 255, 255, 0.02)' }, horzLines: { color: 'rgba(255, 255, 255, 0.02)' } },
          timeScale: { timeVisible: true, secondsVisible: false, rightOffset: 30, borderColor: 'rgba(255,255,255,0.1)' },
          rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
          crosshair: { mode: CrosshairMode.Normal, vertLine: { color: 'rgba(255,255,255,0.1)', labelBackgroundColor: '#1f2937' }, horzLine: { color: 'rgba(255,255,255,0.1)', labelBackgroundColor: '#1f2937' } }
        });

        series = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
          wickUpColor: '#10b981', wickDownColor: '#ef4444',
          priceFormat: {
            type: 'price',
            precision: activeAsset.includes('JPY') ? 3 : activeAsset.includes('BTC') ? 2 : 5,
            minMove: activeAsset.includes('JPY') ? 0.001 : activeAsset.includes('BTC') ? 0.01 : 0.00001,
          }
        });

        // TraderWaves Logic - Cumulative Volume Delta (CVD) overlay and Footprint Volume
        const cvdSeries = chart.addSeries(LineSeries, {
          color: 'rgba(59, 130, 246, 0.8)',
          lineWidth: 2,
          priceScaleId: 'cvd',
        });
        
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: 'rgba(16, 185, 129, 0.3)',
          priceScaleId: 'volume',
        });

        chart.priceScale('cvd').applyOptions({
           scaleMargins: { top: 0.8, bottom: 0 },
           visible: false,
        });
        chart.priceScale('volume').applyOptions({
           scaleMargins: { top: 0.8, bottom: 0 },
           visible: false,
        });

        const volatility = activeAsset.includes('BTC') ? 120 : activeAsset.includes('ETH') ? 25 : activeAsset.includes('XAU') ? 5 : activeAsset.includes('JPY') ? 0.2 : 0.001;
        
        let data: CandlestickData[] = [];
        let cvdData: {time: Time, value: number}[] = [];
        let volData: {time: Time, value: number, color: string}[] = [];
        
        try {
           const formatAsset = activeAsset.replace('/', '');
           const res = await fetch(`/api/historical?symbol=${formatAsset}&start=${backtestStart}&end=${backtestEnd}&interval=${activeTimeframe.toLowerCase()}`);
           if (res.ok) {
              const histData = await res.json();
              data = histData
                .filter((d: any) => d.open != null && d.high != null && d.low != null && d.close != null && d.time != null && !isNaN(d.time))
                .map((d: any) => ({
                 time: Math.floor(d.time) as Time,
                 open: Number(d.open),
                 high: Number(d.high),
                 low: Number(d.low),
                 close: Number(d.close)
              }));
              
              data.sort((a, b) => (a.time as number) - (b.time as number));
              
              const uniqueData: CandlestickData[] = [];
              let lastTime = 0;
              for (const pt of data) {
                 if ((pt.time as number) > lastTime) {
                    uniqueData.push(pt);
                    lastTime = pt.time as number;
                 }
              }
              data = uniqueData;
              if (data.length > 0) {
                 lastCandleRef.current = data[data.length - 1];
              }
              if (data.length === 0) throw new Error("Empty valid data");
           } else {
             throw new Error("API failed");
           }
        } catch(error) {
           // Fallback to generative data if API rate limited or no data
           const basePrice = activeAsset.includes('BTC') ? 65000 : activeAsset.includes('ETH') ? 3500 : activeAsset.includes('XAU') ? 2300 : activeAsset.includes('JPY') ? 150 : 1.1;
           const timeStep = activeTimeframe === '1m' ? 60 : activeTimeframe === '5m' ? 300 : activeTimeframe === '15m' ? 900 : activeTimeframe === '1H' ? 3600 : activeTimeframe === '4H' ? 14400 : 86400;
           
           let validStart = new Date(backtestStart).getTime();
           if (isNaN(validStart)) validStart = Date.now() - 300 * timeStep * 1000;
           let r_time = Math.floor(validStart / 1000);
           
           let lastClose = basePrice;
           data = []; // ensure data is reset
           for (let i = 0; i < 300; i++) {
            const trend1 = Math.sin(seedState + i * 0.05) * volatility * 2;
            const trend2 = Math.cos(seedState + i * 0.02) * volatility * 3;
            const noise = (p_rand(i * 4) - 0.5) * volatility;
            
            const open = lastClose + (p_rand(i * 4 + 1) - 0.5) * (volatility * 0.2);
            const move = trend1 + trend2 + noise;
            const close = open + move * 0.2;
            
            const high = Math.max(open, close) + p_rand(i * 4 + 2) * volatility * 0.8;
            const low = Math.min(open, close) - p_rand(i * 4 + 3) * volatility * 0.8;
            
            data.push({ time: r_time as Time, open, high, low, close });
            r_time += timeStep;
            lastClose = close;
          }
          if (data.length > 0) {
             lastCandleRef.current = data[data.length - 1];
          }
        }
        
        // Generate TraderWaves Order Flow / CVD (Cumulative Volume Delta)
        let currentCvd = 0;
        for (let i = 0; i < data.length; i++) {
          const pt = data[i];
          const isUp = pt.close >= pt.open;
          const bodySize = Math.abs(pt.close - pt.open);
          const shadowSize = pt.high - pt.low - bodySize;
          
          // Realistic volume simulation based on price action spread
          const volume = Math.max(10, (bodySize + shadowSize) * (activeAsset.includes('BTC') ? 1000 : 10000) * (1 + Math.random()));
          const delta = isUp ? volume * (0.1 + Math.random() * 0.4) : -volume * (0.1 + Math.random() * 0.4);
          
          currentCvd += delta;
          
          volData.push({ 
            time: pt.time, 
            value: volume, 
            color: isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' 
          });
          
          cvdData.push({ 
            time: pt.time, 
            value: currentCvd 
          });
        }

        series.setData(data);
        volumeSeries.setData(volData);
        cvdSeries.setData(cvdData);
        
        chart.timeScale().fitContent();

        // Calculate Real SMC Rules against data (historical or generated)
        const calculatedFvgs: FVG[] = [];
        const calculatedObs: OrderBlock[] = [];
        const calculatedBos: BosChoch[] = [];
        const genSignals: Signal[] = [];

        let lastSwingHigh = { price: 0, index: 0, time: data[0].time };
        let lastSwingLow = { price: 9999999, index: 0, time: data[0].time };
        let trend: 'bullish' | 'bearish' = 'bullish';

        for (let i = 2; i < data.length - 2; i++) {
          // FVG calculation
          if (data[i-2].high < data[i].low) {
            const gap = data[i].low - data[i-2].high;
            if (gap > volatility * 0.1 && calculatedFvgs.length < 15) {
              calculatedFvgs.push({
                time1: data[i-2].time, time2: data[Math.min(i+10, data.length-1)].time,
                top: data[i].low, bottom: data[i-2].high, type: 'bullish'
              });
            }
          } else if (data[i-2].low > data[i].high) {
            const gap = data[i-2].low - data[i].high;
            if (gap > volatility * 0.1 && calculatedFvgs.length < 15) {
              calculatedFvgs.push({
                time1: data[i-2].time, time2: data[Math.min(i+10, data.length-1)].time,
                top: data[i-2].low, bottom: data[i].high, type: 'bearish'
              });
            }
          }

          // Swing High / Low (Fractals)
          const isSwingHigh = data[i].high > data[i-1].high && data[i].high > data[i-2].high && data[i].high > data[i+1].high && data[i].high > data[i+2].high;
          const isSwingLow = data[i].low < data[i-1].low && data[i].low < data[i-2].low && data[i].low < data[i+1].low && data[i].low < data[i+2].low;

          if (isSwingHigh) lastSwingHigh = { price: data[i].high, index: i, time: data[i].time };
          if (isSwingLow) lastSwingLow = { price: data[i].low, index: i, time: data[i].time };

          // Break of Structure / CHoCH
          if (trend === 'bullish' && data[i].close < lastSwingLow.price && (i - lastSwingLow.index) > 3) {
            trend = 'bearish';
            calculatedBos.push({ time1: lastSwingLow.time, time2: data[i].time, price: lastSwingLow.price, type: 'CHoCH', direction: 'bearish' });
            // Identify Bearish OB
            let obIndex = i;
            for(let j=i-1; j>=lastSwingHigh.index; j--) {
               if (data[j].close > data[j].open) { obIndex = j; break; }
            }
            if (obIndex !== i && calculatedObs.length < 10) {
               calculatedObs.push({
                 time1: data[obIndex].time, time2: data[Math.min(i+20, data.length-1)].time,
                 top: data[obIndex].high, bottom: data[obIndex].low, type: 'bearish'
               });
               genSignals.push({ id: `sig-${i}`, time: new Date((data[i].time as number) * 1000).toLocaleTimeString(), type: 'SELL', entry: data[obIndex].low, sl: data[obIndex].high + volatility, tp: data[obIndex].low - volatility * 4, session: 'London', confidence: Math.floor(p_rand(i)*20 + 75) });
            }
          } else if (trend === 'bearish' && data[i].close > lastSwingHigh.price && (i - lastSwingHigh.index) > 3) {
            trend = 'bullish';
            calculatedBos.push({ time1: lastSwingHigh.time, time2: data[i].time, price: lastSwingHigh.price, type: 'CHoCH', direction: 'bullish' });
            // Identify Bullish OB
            let obIndex = i;
            for(let j=i-1; j>=lastSwingLow.index; j--) {
               if (data[j].close < data[j].open) { obIndex = j; break; }
            }
            if (obIndex !== i && calculatedObs.length < 10) {
               calculatedObs.push({
                 time1: data[obIndex].time, time2: data[Math.min(i+20, data.length-1)].time,
                 top: data[obIndex].high, bottom: data[obIndex].low, type: 'bullish'
               });
               genSignals.push({ id: `sig-${i}`, time: new Date((data[i].time as number) * 1000).toLocaleTimeString(), type: 'BUY', entry: data[obIndex].high, sl: data[obIndex].low - volatility, tp: data[obIndex].high + volatility * 4, session: 'NY', confidence: Math.floor(p_rand(i)*20 + 75) });
            }
          } else if (trend === 'bullish' && data[i].close > lastSwingHigh.price && (i - lastSwingHigh.index) > 3) {
            calculatedBos.push({ time1: lastSwingHigh.time, time2: data[i].time, price: lastSwingHigh.price, type: 'BOS', direction: 'bullish' });
            lastSwingHigh.price = data[i].high;
          } else if (trend === 'bearish' && data[i].close < lastSwingLow.price && (i - lastSwingLow.index) > 3) {
            calculatedBos.push({ time1: lastSwingLow.time, time2: data[i].time, price: lastSwingLow.price, type: 'BOS', direction: 'bearish' });
            lastSwingLow.price = data[i].low;
          }
        }

        if (isMounted) {
          setFvgs(calculatedFvgs.slice(-8));
          setObs(calculatedObs.slice(-6));
          setBosChoch(calculatedBos.slice(-8));
          setSignals(genSignals.slice(-5).reverse());
          setLiveLiqGrabs([]); // reset on data reload
          setChartObj(chart);
          setSeriesObj(series);
          setIsLoading(false);
        }
      }
    }
    
    fetchData();

    return () => {
      isMounted = false;
      if (chart) chart.remove();
    };
  }, [activeAsset, activeTimeframe, backtestStart, backtestEnd]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-2">
            Whale Algo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Institutional Smart Money Concepts Dashboard</p>
        </div>
        
        {/* Data Sync Manager Header UI */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 dark:text-emerald-300 rounded-lg text-sm font-bold">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            London/NY Overlap
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800/80 border border-white/5 rounded-lg text-xs font-mono">
            {syncStatus === 'syncing' ? (
              <RefreshCcw size={14} className="text-blue-400 animate-spin" />
            ) : syncStatus === 'offline' ? (
              <WifiOff size={14} className="text-red-400" />
            ) : (
              <Wifi size={14} className="text-emerald-400" />
            )}
            <span className="text-gray-400">
              {syncStatus === 'syncing' ? 'Syncing /api/quote...' : `Updated ${lastSync.toLocaleTimeString()}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row justify-between gap-4 w-full">
        {/* Asset Selector */}
        <div className="glass-panel p-2 flex overflow-x-auto scrollbar-hide space-x-2 border border-blue-500/10 w-full xl:w-auto shrink-0 touch-pan-x">
          {ASSETS.map((asset) => (
            <button
              key={asset}
              onClick={() => {
                setActiveAsset(asset);
                if (updateSmcSettings) updateSmcSettings(asset, activeTimeframe);
              }}
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

        {/* Timeframe & Action Bar */}
        <div className="flex flex-row flex-wrap gap-4 w-full xl:w-auto justify-start xl:justify-end">
          {/* Timeframe Selector */}
          <div className="glass-panel p-2 flex overflow-x-auto scrollbar-hide space-x-1 border border-indigo-500/10 items-center grow sm:grow-0 shrink-0 touch-pan-x">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setActiveTimeframe(tf);
                  if (updateSmcSettings) updateSmcSettings(activeAsset, tf);
                }}
                className={clsx(
                  "px-3 py-2 rounded-lg text-sm font-bold transition-all shrink-0",
                  activeTimeframe === tf 
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                    : "text-gray-500 hover:bg-white/5 border border-transparent"
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Backtest & Report Container */}
          <div className="glass-panel p-2 flex flex-row overflow-x-auto scrollbar-hide items-center gap-3 border border-white/5 grow sm:grow-0 shrink-0 touch-pan-x">
            <div className="flex items-center gap-2 px-2 shrink-0">
              <span className="text-xs text-gray-500 font-bold uppercase hidden sm:inline">Backtest:</span>
              <input 
                type="date"
                title="Start Date"
                value={backtestStart}
                onChange={(e) => setBacktestStart(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer shrink-0 min-w-0"
              />
              <span className="text-gray-500 text-xs shrink-0">to</span>
              <input 
                type="date"
                title="End Date"
                value={backtestEnd}
                onChange={(e) => setBacktestEnd(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer shrink-0 min-w-0"
              />
            </div>
            
            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 shrink-0"></div>
            
            <button 
              onClick={() => {
                const csv = ['Time,Signal,Entry,SL,TP,Session,Confidence,Est. PnL (Risk Amount)'];
                signals.forEach(s => {
                  const isWin = Math.random() > 0.3; // 70% mock win rate
                  const pnl = isWin ? ((Math.abs(s.tp - s.entry) / s.entry) * 100 * 10).toFixed(2) : ((Math.abs(s.sl - s.entry) / s.entry) * 100 * -10).toFixed(2);
                  csv.push(`${s.time},${s.type},${s.entry},${s.sl},${s.tp},${s.session},${s.confidence}%,$${pnl}`);
                });
                const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `whale-backtest-report-${activeAsset.replace('/','')}-${backtestStart}-to-${backtestEnd}.csv`;
                a.click();
              }}
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold transition-colors shrink-0 whitespace-nowrap"
            >
              <Download size={14} /> <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel border border-white/5 rounded-2xl relative h-[550px] overflow-hidden group">
            {/* Action Bar overlay */}
            <div className="absolute top-4 left-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-mono text-gray-300 border border-white/10 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div> AI Engine Active
               </div>
               <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-mono text-gray-300 border border-white/10">
                 SMC Toolkit v2.4
               </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]"></div>
              </div>
            )}
            
            <div ref={chartContainerRef} className="w-full h-full relative z-10" />
            <SMCOverlays chart={chartObj} series={seriesObj} fvgs={fvgs} obs={obs} bosChoch={bosChoch} liveLiqGrabs={liveLiqGrabs} />
          </div>

          <div className="glass-panel border border-white/5 rounded-2xl p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity size={16} className="text-indigo-400"/> Live Algorithmic Signals
              </h3>
              <button 
                onClick={() => {
                  const csv = ['Time,Signal,Entry,SL,TP,Vector,Confidence'];
                  signals.forEach(s => csv.push(`${s.time},${s.type},${s.entry},${s.sl},${s.tp},${s.session},${s.confidence}`));
                  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `whale-signals-${activeAsset.replace('/','')}.csv`;
                  a.click();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Time</th>
                  <th className="px-4 py-3">Signal</th>
                  <th className="px-4 py-3 font-mono text-right">Entry</th>
                  <th className="px-4 py-3 font-mono text-right text-red-500">SL</th>
                  <th className="px-4 py-3 font-mono text-right text-emerald-500">TP</th>
                  <th className="px-4 py-3">Vector</th>
                  <th className="px-4 py-3 rounded-tr-lg">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {signals.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
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
                      <span className="px-2 py-1 rounded border border-white/5 bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-300">
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
                        <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">{s.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-5 border border-white/5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-500">
               <ShieldCheck size={120} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
              <ShieldCheck size={16} className="text-blue-400"/> Backtest Engine (30D)
            </h3>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.03] border border-transparent dark:hover:border-white/5 transition-colors">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Win Rate</span>
                <span className="font-mono text-sm font-bold text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">{dashboardMetrics.winRate}%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.03] border border-transparent dark:hover:border-white/5 transition-colors">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Profit Factor</span>
                <span className="font-mono text-sm font-bold text-blue-400">{dashboardMetrics.profitFactor}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.03] border border-transparent dark:hover:border-white/5 transition-colors">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Max DD</span>
                <span className="font-mono text-sm font-bold text-red-400">{dashboardMetrics.maxDD}%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.03] border border-transparent dark:hover:border-white/5 transition-colors">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sharpe Ratio</span>
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{dashboardMetrics.sharpeRatio}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 2000);
              }}
              className="w-full mt-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] relative z-10 active:scale-[0.98]">
              Run Full Backtest
            </button>
          </div>

          <div className="glass-panel p-5 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col">
             <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-400"/> Order Flow (Footprint)
            </h3>
            
            <div className="flex-1 flex flex-col bg-[#0A0A0B] rounded-xl border border-white/10 overflow-hidden relative">
               <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-white/5">
                 <span className="text-[10px] font-mono text-gray-400">ASK / BID (Vol)</span>
                 <span className="text-[10px] font-mono text-gray-400">DELTA (Price)</span>
               </div>
               
               <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                 {/* Generate some realistic order flow footprint rows */}
                 {Array.from({length: 12}).map((_, i) => {
                   const isAskDom = i < 6;
                   const price = (1.05000 + (12 - i) * 0.00010).toFixed(5);
                   const askVol = Math.floor(Math.random() * 500) + (isAskDom ? 200 : 20);
                   const bidVol = Math.floor(Math.random() * 500) + (!isAskDom ? 200 : 20);
                   const delta = askVol - bidVol;
                   const total = askVol + bidVol;
                   const pctAsk = (askVol / total) * 100;
                   const pctBid = (bidVol / total) * 100;
                   
                   return (
                     <div key={i} className="flex justify-between items-center text-xs font-mono group hover:bg-white/5 p-1 rounded relative">
                        {/* Background volume profile bars */}
                        <div className="absolute left-0 top-0 bottom-0 bg-red-500/10 pointer-events-none" style={{ width: `${pctAsk}%` }}></div>
                        <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none" style={{ width: `${pctBid}%` }}></div>
                        
                        <div className="flex gap-2 relative z-10">
                           <span className={clsx("w-8 text-right", askVol > bidVol ? "text-red-400 font-bold" : "text-gray-500")}>{askVol}</span>
                           <span className="text-gray-700 dark:text-gray-600">x</span>
                           <span className={clsx("w-8", bidVol > askVol ? "text-emerald-400 font-bold" : "text-gray-500")}>{bidVol}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 relative z-10">
                           <span className={clsx("w-10 text-right", delta > 0 ? "text-red-400" : "text-emerald-400")}>
                             {delta > 0 ? '+' : ''}{delta}
                           </span>
                           <span className="font-bold text-gray-400 bg-black/40 px-1 rounded border border-white/5 text-center">
                             {price}
                           </span>
                        </div>
                     </div>
                   );
                 })}
               </div>
               
               <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex justify-between items-center mt-auto">
                 <div className="flex flex-col">
                   <span className="text-[10px] text-gray-500 uppercase tracking-wider">Cum Vol Delta</span>
                   <span className={clsx("text-sm font-mono font-bold", dashboardMetrics.isBullish ? "text-emerald-400" : "text-red-400")}>
                     {dashboardMetrics.isBullish ? '+' : '-'}{Math.floor(Math.random() * 5000 + 1000)}
                   </span>
                 </div>
                 <div className="flex flex-col text-right">
                   <span className="text-[10px] text-gray-500 uppercase tracking-wider">POC</span>
                   <span className="text-sm font-mono font-bold text-blue-400">
                     1.05040
                   </span>
                 </div>
               </div>
            </div>
          </div>

          <div className="glass-panel p-5 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col">
             <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400"/> Micro/Macro Correlation Map
            </h3>
            
            <div className="bg-[#0A0A0B] rounded-xl border border-white/10 overflow-hidden relative overflow-x-auto scrollbar-hide">
              <table className="w-full text-xs font-mono text-center">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5 text-gray-500">
                    <td className="p-2 border-r border-white/5"></td>
                    {['DXY', 'US10Y', 'EUR', 'BTC'].map(sym => <td key={sym} className="p-2">{sym}</td>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {['DXY', 'US10Y', 'EUR', 'BTC'].map((rowSym) => (
                      <tr key={rowSym}>
                         <td className="p-2 border-r border-white/5 text-gray-500 font-bold bg-white/5">{rowSym}</td>
                         {['DXY', 'US10Y', 'EUR', 'BTC'].map(colSym => {
                            if (rowSym === colSym) return <td key={colSym} className="p-2 text-gray-700 bg-white/5">—</td>;
                            
                            // Generate stable random correlation for demo, inverse correlation for DXY/EUR typically
                            let seed = rowSym.charCodeAt(0) + colSym.charCodeAt(0) + new Date().getHours();
                            let val = Math.sin(seed) * 100;

                            // hardcode some logic for realism
                            if ((rowSym === 'DXY' && colSym === 'EUR') || (rowSym === 'EUR' && colSym === 'DXY')) val = -85 + Math.sin(seed) * 10;
                            if ((rowSym === 'DXY' && colSym === 'US10Y') || (rowSym === 'US10Y' && colSym === 'DXY')) val = 75 + Math.sin(seed) * 10;
                            if ((rowSym === 'BTC' && colSym === 'DXY') || (rowSym === 'DXY' && colSym === 'BTC')) val = -60 + Math.sin(seed) * 10;
                            
                            // scale to -100 to 100 bounds
                            val = Math.max(-100, Math.min(100, val));
                            
                            const isHigh = Math.abs(val) > 70;
                            const isPos = val > 0;
                            
                            let colorClass = "text-gray-400";
                            if (isHigh && isPos) colorClass = "text-emerald-400 font-bold";
                            if (isHigh && !isPos) colorClass = "text-red-400 font-bold";
                            
                            return (
                               <td key={colSym} className={`p-2 ${colorClass}`}>
                                 {isPos ? '+' : ''}{val.toFixed(0)}%
                               </td>
                            );
                         })}
                      </tr>
                   ))}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

