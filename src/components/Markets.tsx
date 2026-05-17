import React, { useState } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { LineChart, Save, Plus, X as XIcon, Layers, LayoutTemplate } from 'lucide-react';
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
  const [activeStudies, setActiveStudies] = useState<string[]>(["MACD@tv-basicstudies", "RSI@tv-basicstudies"]);
  const [savedTemplates, setSavedTemplates] = useState<{name: string; studies: string[]}[]>([
    { name: 'Default Trend', studies: ["MACD@tv-basicstudies", "RSI@tv-basicstudies"] },
    { name: 'Clean', studies: [] },
  ]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1 sm:mb-2 flex items-center space-x-3">
            <LineChart className="text-emerald-400" />
            <span>Live Markets</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Real-time charting and analysis powered by TradingView.</p>
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
                    onClick={() => setSelectedSymbol(sym)}
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
          <div className="flex-1 relative w-full h-full p-1 bg-[#131722]">
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

          <div className="bg-black/60 border-t border-white/10 p-4 shrink-0 overflow-x-auto">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-400 hidden sm:flex shrink-0">
                  <LayoutTemplate size={16} />
                  <span className="text-sm font-bold uppercase tracking-wider">Templates</span>
                </div>
                <div className="flex flex-wrap bg-white/5 p-1 rounded-lg gap-1 min-w-max">
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
              
              <div className="flex items-center space-x-2 min-w-max">
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
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 min-w-max md:min-w-0">
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
