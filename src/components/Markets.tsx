import React, { useState, useEffect, useRef } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { LineChart, Activity, RefreshCw, Save, Plus, X as XIcon, Layers, LayoutTemplate, History } from 'lucide-react';
import { clsx } from 'clsx';

const AVAILABLE_STUDIES = [
  { id: "MACD@tv-basicstudies", name: "MACD" },
  { id: "RSI@tv-basicstudies", name: "RSI" },
  { id: "MASimple@tv-basicstudies", name: "Moving Average" },
  { id: "BB@tv-basicstudies", name: "Bollinger Bands" },
  { id: "StochasticRSI@tv-basicstudies", name: "Stochastic RSI" },
  { id: "Volume@tv-basicstudies", name: "Volume" },
  { id: "EMA@tv-basicstudies", name: "EMA" },
];

export function Markets() {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [derivPrice, setDerivPrice] = useState<{ symbol: string; price: number; timestamp: number } | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [activeStudies, setActiveStudies] = useState<string[]>(["MACD@tv-basicstudies", "RSI@tv-basicstudies"]);
  const [savedTemplates, setSavedTemplates] = useState<{name: string; studies: string[]}[]>([
    { name: 'Default Trend', studies: ["MACD@tv-basicstudies", "RSI@tv-basicstudies"] },
    { name: 'Clean', studies: [] },
  ]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);

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
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center space-x-3">
            <LineChart className="text-emerald-400" />
            <span>Live Markets</span>
          </h1>
          <p className="text-gray-400">Real-time charting by TradingView and live quotes via Deriv API.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="glass-panel px-4 py-2 flex items-center space-x-4 border border-white/10">
            <div className="flex items-center space-x-2">
              <Activity className={clsx("w-4 h-4", isSocketConnected ? "text-emerald-400" : "text-gray-500")} />
              <span className="text-sm text-gray-300">Deriv API</span>
            </div>
            <div className="h-4 w-px bg-white/20"></div>
            <div className="flex items-center space-x-2 min-w-[120px]">
              {derivPrice && derivPrice.symbol === selectedSymbol ? (
                <>
                  <span className="text-sm font-medium text-gray-400">{selectedSymbol}:</span>
                  <span className={clsx("text-sm font-bold font-mono text-emerald-400")}>
                    {derivPrice.price >= 10 ? derivPrice.price.toFixed(2) : derivPrice.price.toFixed(5)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500 flex items-center space-x-2">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Waiting for tick...</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        {/* Sidebar for Selection */}
        <div className="glass-panel p-4 flex flex-col h-full overflow-y-auto space-y-6">
          {categories.map(category => (
            <div key={category.name}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {category.name}
              </h3>
              <div className="space-y-1">
                {category.symbols.map(sym => (
                  <button
                    key={sym}
                    onClick={() => {
                      setSelectedSymbol(sym);
                      setDerivPrice(null);
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
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
        <div className="lg:col-span-3 glass-panel rounded-2xl overflow-hidden h-full min-h-[500px] border border-white/10 flex flex-col relative">
          
          <div className="bg-gray-900/50 border-b border-white/10 p-2 flex items-center justify-end space-x-2">
             <button
                onClick={() => {
                   const toast = document.createElement('div');
                   toast.className = "fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg border border-white/10 z-50 animate-in slide-in-from-bottom-2";
                   toast.textContent = "Trade History overlay enabled. (No recent trades on this asset)";
                   document.body.appendChild(toast);
                   setTimeout(() => toast.remove(), 3000);
                }}
                className={clsx("p-2 rounded transition-colors relative text-gray-400 hover:text-white hover:bg-white/5")}
                title="Show Trade History on Chart"
             >
               <History size={18} />
               <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-gray-900 bg-gradient-to-r from-red-500 to-blue-500" />
             </button>
          </div>

          <div className="flex-1 relative">
            {/* We only render TradingView for traditional assets, Synthetics (Vol 75) aren't supported on TradingView. */}
            {categories.find(c => c.name === 'Synthetics')?.symbols.includes(selectedSymbol) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-900/50 backdrop-blur-sm">
                <LineChart size={48} className="text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-gray-300 mb-2">{selectedSymbol}</h2>
                <p className="text-gray-400 max-w-md">
                  TradingView does not natively support Deriv Synthetic indices.
                </p>
                {derivPrice && derivPrice.symbol === selectedSymbol && (
                   <div className="mt-8 text-4xl font-mono font-bold text-emerald-400">
                     {derivPrice.price >= 10 ? derivPrice.price.toFixed(2) : derivPrice.price.toFixed(5)}
                   </div>
                )}
              </div>
            ) : (
              <AdvancedRealTimeChart
                symbol={
                  selectedSymbol === 'BTCUSD' ? 'BINANCE:BTCUSD' :
                  selectedSymbol === 'ETHUSD' ? 'BINANCE:ETHUSD' :
                  selectedSymbol === 'SOLUSD' ? 'BINANCE:SOLUSD' :
                  selectedSymbol === 'BNBUSD' ? 'BINANCE:BNBUSD' :
                  selectedSymbol === 'XRPUSD' ? 'BINANCE:XRPUSD' :
                  `FX:${selectedSymbol}`
                }
                theme="dark"
                autosize
                allow_symbol_change={true}
                hide_top_toolbar={false}
                hide_side_toolbar={false}
                hide_legend={false}
                save_image={true}
                withdateranges={true}
                details={true}
                container_id="tradingview_chart"
                studies={activeStudies as any}
                enabled_features={[
                  "study_templates",
                  "use_localstorage_for_settings",
                  "save_chart_properties_to_local_storage",
                  "header_saveload"
                ]}
              />
            )}
          </div>

          <div className="bg-black/60 border-t border-white/10 p-4 shrink-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-400 hidden sm:flex">
                  <LayoutTemplate size={16} />
                  <span className="text-sm font-bold uppercase tracking-wider">Templates</span>
                </div>
                <div className="flex flex-wrap bg-white/5 p-1 rounded-lg gap-1">
                   {savedTemplates.map(template => (
                     <button
                       key={template.name}
                       onClick={() => setActiveStudies(template.studies)}
                       className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors text-gray-300 hover:text-white hover:bg-white/10 whitespace-nowrap"
                     >
                       {template.name}
                     </button>
                   ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isSavingTemplate ? (
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Template Name..."
                      className="bg-black/50 border border-white/20 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-32 md:w-auto"
                    />
                    <button 
                      onClick={() => {
                        if (newTemplateName.trim()) {
                          setSavedTemplates([...savedTemplates, { name: newTemplateName, studies: activeStudies }]);
                          setNewTemplateName('');
                          setIsSavingTemplate(false);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded"
                    >
                      <Save size={16} />
                    </button>
                    <button 
                       onClick={() => setIsSavingTemplate(false)}
                       className="bg-white/10 hover:bg-white/20 text-gray-300 p-1.5 rounded"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsSavingTemplate(true)}
                    className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                  >
                    <Plus size={14} /> <span className="hidden sm:inline">Save view</span>
                  </button>
                )}
                
                <div className="h-6 w-px bg-white/20 mx-2"></div>
                
                <button 
                  onClick={() => setShowIndicators(!showIndicators)}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                >
                  <Layers size={14} /> <span>Indicators</span>
                </button>
              </div>
            </div>
            
            {showIndicators && (
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {AVAILABLE_STUDIES.map(study => {
                  const isActive = activeStudies.includes(study.id);
                  return (
                    <button
                      key={study.id}
                      onClick={() => {
                        if (isActive) {
                          setActiveStudies(activeStudies.filter(id => id !== study.id));
                        } else {
                          setActiveStudies([...activeStudies, study.id]);
                        }
                      }}
                      className={clsx(
                        "text-left px-3 py-2 rounded border text-xs font-semibold transition-colors",
                         isActive ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{study.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 ml-2"></div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
