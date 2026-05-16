import React, { useState, useEffect } from 'react';
import { LineChart, Activity, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

export function Markets() {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [derivPrice, setDerivPrice] = useState<{ symbol: string; price: number; ask?: number; bid?: number; timestamp: number } | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Note: For a real app we'd map our selected symbols to Deriv API symbols (e.g., frxEURUSD, R_100, etc.)
  // We'll use a mock connection here or connect to the real Deriv WebSocket API if needed.
  // Deriv WebSocket URL: rfc6455
  // wss://ws.binaryws.com/websockets/v3?app_id=1089

  useEffect(() => {
    let ws: WebSocket;
    let isActive = true;

    const connectDeriv = () => {
      ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
      
      ws.onopen = () => {
        if (!isActive) return;
        setIsSocketConnected(true);
        // Subscribe to a tick stream
        // E.g., frxEURUSD, frxGBPUSD, R_100
        let derivSymbol = 'frxEURUSD';
        if (selectedSymbol === 'EURUSD') derivSymbol = 'frxEURUSD';
        else if (selectedSymbol === 'GBPUSD') derivSymbol = 'frxGBPUSD';
        else if (selectedSymbol === 'USDJPY') derivSymbol = 'frxUSDJPY';
        else if (selectedSymbol === 'BTCUSD') derivSymbol = 'cryBTCUSD';
        else if (selectedSymbol === 'Vol 100') derivSymbol = 'R_100';
        else if (selectedSymbol === 'Vol 75') derivSymbol = 'R_75';
        else if (selectedSymbol === 'Boom 1000') derivSymbol = 'BOOM1000EZ';
        else if (selectedSymbol === 'Crash 1000') derivSymbol = 'CRASH1000EZ';
        else if (selectedSymbol === 'AAPL') derivSymbol = 'OTC_AAPL';
        
        ws.send(JSON.stringify({
          ticks: derivSymbol,
          subscribe: 1
        }));
      };

      ws.onmessage = (msg) => {
        if (!isActive) return;
        const data = JSON.parse(msg.data);
        if (data.msg_type === 'tick' && data.tick) {
          setDerivPrice({
            symbol: selectedSymbol,
            price: data.tick.quote,
            ask: data.tick.ask,
            bid: data.tick.bid,
            timestamp: data.tick.epoch * 1000
          });
        }
      };

      ws.onclose = () => {
        if (!isActive) return;
        setIsSocketConnected(false);
        setTimeout(connectDeriv, 3000); // Reconnect
      };
    };

    connectDeriv();

    return () => {
      isActive = false;
      if (ws) ws.close();
    };
  }, [selectedSymbol]);

  const categories = [
    { name: 'Forex', symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'USDCAD'] },
    { name: 'Crypto', symbols: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD'] },
    { name: 'Synthetics', symbols: ['Vol 100', 'Vol 75', 'Boom 1000', 'Crash 1000'] },
  ];

  return (
    <div className="flex flex-col space-y-4 max-w-7xl mx-auto h-[calc(100vh-6rem)]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1 sm:mb-2 flex items-center space-x-3">
            <LineChart className="text-emerald-400" />
            <span>Live Markets</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Real-time charting and analysis via Deriv.</p>
        </div>
        
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="glass-panel px-4 py-2 flex-1 sm:flex-none flex items-center justify-between sm:justify-start space-x-4 border border-white/10">
            <div className="flex items-center space-x-2 shrink-0">
              <Activity className={clsx("w-4 h-4", isSocketConnected ? "text-emerald-400" : "text-gray-500")} />
              <span className="text-sm text-gray-300 hidden sm:inline">Deriv API</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
            <div className="flex items-center space-x-2 min-w-[120px] justify-end sm:justify-start">
              {derivPrice && derivPrice.symbol === selectedSymbol ? (
                <div className="flex flex-col">
                  <div className="flex space-x-3 items-center">
                    <span className="text-sm font-medium text-gray-400">{selectedSymbol}:</span>
                    <span className={clsx("text-sm sm:text-base font-bold font-mono text-emerald-400")}>
                      {derivPrice.price >= 10 ? derivPrice.price.toFixed(2) : derivPrice.price.toFixed(5)}
                    </span>
                  </div>
                  {(derivPrice.bid !== undefined || derivPrice.ask !== undefined) && (
                    <div className="flex space-x-3 mt-0.5 text-[10px] sm:text-xs font-mono text-gray-400">
                      {derivPrice.bid !== undefined && <span>Bid: {derivPrice.bid >= 10 ? derivPrice.bid.toFixed(2) : derivPrice.bid.toFixed(5)}</span>}
                      {derivPrice.ask !== undefined && <span>Ask: {derivPrice.ask >= 10 ? derivPrice.ask.toFixed(2) : derivPrice.ask.toFixed(5)}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-gray-500 flex items-center space-x-2">
                  <RefreshCw size={14} className="animate-spin shrink-0" />
                  <span>Waiting...</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[400px]">
        {/* Sidebar for Selection */}
        <div className="glass-panel p-3 flex flex-row lg:flex-col w-full lg:w-48 overflow-x-auto lg:overflow-y-auto gap-4 lg:gap-0 lg:space-y-6 shrink-0 custom-scrollbar">
          {categories.map(category => (
            <div key={category.name} className="shrink-0 min-w-[140px] lg:min-w-0">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 lg:mb-3">
                {category.name}
              </h3>
              <div className="flex flex-row lg:flex-col gap-1 lg:gap-1.5 lg:space-y-1">
                {category.symbols.map(sym => (
                  <button
                    key={sym}
                    onClick={() => {
                      setSelectedSymbol(sym);
                      setDerivPrice(null);
                    }}
                    className={clsx(
                      'text-left px-3 py-1.5 lg:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0',
                      selectedSymbol === sym 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' 
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Chart View */}
        <div className="glass-panel flex-1 rounded-2xl overflow-hidden min-h-[400px] border border-white/10 flex flex-col relative w-full">
          <div className="flex-1 relative w-full h-full">
            <iframe 
               src="https://charts.deriv.com/deriv" 
               className="absolute inset-0 w-full h-full border-0"
               allowFullScreen
               title="Deriv Charts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
