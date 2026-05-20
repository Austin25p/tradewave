import React, { useState, useRef, useEffect } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { LineChart, Save, Plus, X as XIcon, Layers, LayoutTemplate, Maximize2, Minimize2, Clock } from 'lucide-react';
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

function getCurrentSessionInfo() {
  const hr = new Date().getUTCHours();
  if (hr >= 0 && hr < 8) return { name: "Tokyo Session (Asian)", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  if (hr >= 8 && hr < 13) return { name: "London Session", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
  if (hr >= 13 && hr < 16) return { name: "London & NY Overlap", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" };
  if (hr >= 16 && hr < 21) return { name: "New York Session", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
  return { name: "Sydney / Low Volatility", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-500/10", border: "border-gray-200 dark:border-gray-500/20" };
}

export function Markets() {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [activeStudies, setActiveStudies] = useState<string[]>(["MACD@tv-basicstudies", "RSI@tv-basicstudies"]);
  const [savedTemplates, setSavedTemplates] = useState<{name: string; studies: string[]}[]>([
    { name: 'Default Trend', studies: ["MACD@tv-basicstudies", "RSI@tv-basicstudies"] },
    { name: 'Clean', studies: [] },
  ]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const sessionInfo = getCurrentSessionInfo();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (chartContainerRef.current?.requestFullscreen) {
        chartContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const categories = [
    { name: 'Forex', symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'USDCAD'] },
    { name: 'Crypto', symbols: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD'] },
    { name: 'Stocks', symbols: ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL'] },
    { name: 'Indices', symbols: ['SPY', 'QQQ', 'DIA'] }
  ];

  return (
    <div className="flex flex-col space-y-4 max-w-7xl mx-auto h-[calc(100vh-6rem)]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center space-x-3">
            <LineChart className="text-emerald-400" />
            <span>Live Markets</span>
          </h1>
          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm sm:text-base">Real-time charting and analysis powered by TradingView.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[400px]">
        {/* Sidebar for Selection */}
        <div className="glass-panel p-3 flex flex-row lg:flex-col w-full lg:w-48 overflow-x-auto lg:overflow-y-auto gap-4 lg:gap-0 lg:space-y-6 shrink-0 custom-scrollbar">
          {categories.map(category => (
            <div key={category.name} className="shrink-0 min-w-[140px] lg:min-w-0">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 lg:mb-3">
                {category.name}
              </h3>
              <div className="flex flex-row lg:flex-col gap-1 lg:gap-1.5 lg:space-y-1">
                {category.symbols.map(sym => (
                  <button
                    key={sym}
                    onClick={() => setSelectedSymbol(sym)}
                    className={clsx(
                      'text-left px-3 py-1.5 lg:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0',
                      selectedSymbol === sym 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:text-gray-900 dark:text-white'
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
        <div 
          ref={chartContainerRef}
          className={clsx(
            "glass-panel flex-1 rounded-2xl overflow-hidden min-h-[400px] border border-gray-200 dark:border-white/10 flex flex-col relative w-full",
            !isFullscreen && "resize-y"
          )}
        >
          <div className="flex-1 relative w-full h-full p-1 bg-[#131722] min-h-[300px]">
            <button 
              onClick={toggleFullscreen}
              className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/80 text-gray-600 dark:text-gray-300 p-2 rounded-lg backdrop-blur border border-gray-200 dark:border-white/10 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <div className={`absolute top-3 right-16 z-10 backdrop-blur-md px-3 py-1.5 rounded-lg border flex items-center space-x-2 text-xs font-bold tracking-wide shadow-lg pointer-events-none transition-colors duration-500 ${sessionInfo.bg} ${sessionInfo.border} ${sessionInfo.color}`}>
              <Clock size={14} className="animate-pulse" />
              <span>{sessionInfo.name}</span>
            </div>
            <AdvancedRealTimeChart
              symbol={
                categories.find(c => c.name === 'Crypto')?.symbols.includes(selectedSymbol) 
                  ? `BINANCE:${selectedSymbol}` 
                  : categories.find(c => c.name === 'Stocks')?.symbols.includes(selectedSymbol) || categories.find(c => c.name === 'Indices')?.symbols.includes(selectedSymbol)
                  ? `NASDAQ:${selectedSymbol}` // Approximation for stocks/etfs
                  : `FX:${selectedSymbol}`
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
          </div>

          <div className="bg-black/60 border-t border-gray-200 dark:border-white/10 p-4 shrink-0 overflow-x-auto">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500 dark:text-gray-400 hidden sm:flex shrink-0">
                  <LayoutTemplate size={16} />
                  <span className="text-sm font-bold uppercase tracking-wider">Templates</span>
                </div>
                <div className="flex flex-wrap bg-white dark:bg-white/5 shadow-sm dark:shadow-none p-1 rounded-lg gap-1 min-w-max">
                   {savedTemplates.map(template => (
                     <button
                       key={template.name}
                       onClick={() => setActiveStudies(template.studies)}
                       className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none whitespace-nowrap"
                     >
                       {template.name}
                     </button>
                   ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 min-w-max">
                {isSavingTemplate ? (
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Template Name..."
                      className="bg-black/50 border border-gray-300 dark:border-white/20 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 w-32 md:w-auto"
                    />
                    <button 
                      onClick={() => {
                        if (newTemplateName.trim()) {
                          setSavedTemplates([...savedTemplates, { name: newTemplateName, studies: activeStudies }]);
                          setNewTemplateName('');
                          setIsSavingTemplate(false);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-gray-900 dark:text-white p-1.5 rounded"
                    >
                      <Save size={16} />
                    </button>
                    <button 
                       onClick={() => setIsSavingTemplate(false)}
                       className="bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 text-gray-600 dark:text-gray-300 p-1.5 rounded"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsSavingTemplate(true)}
                    className="flex items-center space-x-2 bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                  >
                    <Plus size={14} /> <span className="hidden sm:inline">Save view</span>
                  </button>
                )}
                
                <div className="h-6 w-px bg-white/20 mx-2"></div>
                
                <button 
                  onClick={() => setShowIndicators(!showIndicators)}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                >
                  <Layers size={14} /> <span>Indicators</span>
                </button>
              </div>
            </div>
            
            {showIndicators && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 min-w-max md:min-w-0">
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
                         isActive ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "bg-white dark:bg-white/5 shadow-sm dark:shadow-none border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none"
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
