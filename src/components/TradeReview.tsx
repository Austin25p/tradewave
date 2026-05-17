import React, { useState, useEffect } from 'react';
import { Trade } from '../lib/types';
import { format } from 'date-fns';
import { Image, Target, AlertTriangle, ArrowUpRight, ArrowDownRight, Tag, Play, FileText, Save, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

interface TradeReviewProps {
  trades: Trade[];
  onUpdateTrade?: (trade: Trade) => void;
}

export function TradeReview({ trades, onUpdateTrade }: TradeReviewProps) {
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(trades[0]?.id || null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [isEditingThesis, setIsEditingThesis] = useState(false);
  const [editedThesis, setEditedThesis] = useState("");
  const [isEditingData, setIsEditingData] = useState(false);
  const [editedData, setEditedData] = useState({
    entryDate: "",
    stopLossPrice: "",
    takeProfitPrice: "",
    screenshotUrl: "",
    rMultiple: ""
  });

  const selectedTrade = trades.find(t => t.id === selectedTradeId);

  useEffect(() => {
    if (selectedTrade) {
      setEditedNotes(selectedTrade.notes || "");
      setIsEditingNotes(false);
      setEditedThesis(selectedTrade.thesis || "");
      setIsEditingThesis(false);
      setEditedData({
        entryDate: selectedTrade.entryDate ? format(new Date(selectedTrade.entryDate), "yyyy-MM-dd'T'HH:mm") : "",
        stopLossPrice: selectedTrade.stopLossPrice?.toString() || "",
        takeProfitPrice: selectedTrade.takeProfitPrice?.toString() || "",
        screenshotUrl: selectedTrade.screenshotUrl || "",
        rMultiple: selectedTrade.rMultiple?.toString() || "0"
      });
      setIsEditingData(false);
    }
  }, [selectedTrade?.id, selectedTrade]);

  const handleSaveNotes = () => {
    if (selectedTrade && onUpdateTrade) {
      onUpdateTrade({ ...selectedTrade, notes: editedNotes });
      setIsEditingNotes(false);
    }
  };

  const handleSaveThesis = () => {
    if (selectedTrade && onUpdateTrade) {
      onUpdateTrade({ ...selectedTrade, thesis: editedThesis });
      setIsEditingThesis(false);
    }
  };

  const handleSaveData = () => {
    if (selectedTrade && onUpdateTrade) {
      onUpdateTrade({
        ...selectedTrade,
        entryDate: new Date(editedData.entryDate).toISOString(),
        stopLossPrice: editedData.stopLossPrice ? parseFloat(editedData.stopLossPrice) : undefined,
        takeProfitPrice: editedData.takeProfitPrice ? parseFloat(editedData.takeProfitPrice) : undefined,
        screenshotUrl: editedData.screenshotUrl,
        rMultiple: parseFloat(editedData.rMultiple) || 0
      });
      setIsEditingData(false);
    }
  };

  const containerVars: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="space-y-8 h-full flex flex-col font-sans"
    >
      <motion.header variants={itemVars} className="flex justify-between items-end border-b border-white/5 pb-4">
        <div>
          <h1 className="text-4xl font-display font-bold flex items-center space-x-3 mb-2">
            <Play className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" size={32} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight">
              Trade Replay
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Visually reconstruct execution mechanics and validate thesis models.</p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        {/* Trade Selection Sidebar */}
        <motion.div variants={itemVars} className="premium-card p-4 col-span-1 border-white/5 overflow-hidden flex flex-col max-h-[800px]">
          <h3 className="font-semibold text-gray-400 mb-4 px-2 uppercase text-xs tracking-widest flex justify-between items-center bg-black/20 p-2 rounded-lg">
            <span>Transaction Timeline</span>
            <span className="text-blue-400 font-mono">{trades.length}</span>
          </h3>
          <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-1">
          {trades.map(trade => (
            <motion.button
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              key={trade.id}
              onClick={() => setSelectedTradeId(trade.id)}
              className={clsx(
                'w-full text-left p-3.5 rounded-xl transition-all border duration-300 relative overflow-hidden group',
                selectedTradeId === trade.id 
                  ? 'bg-blue-900/20 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50' 
                  : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/10'
              )}
            >
              {selectedTradeId === trade.id && (
                 <motion.div layoutId="activeTradeBg" className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent -z-10" />
              )}
              <div className="flex justify-between items-center mb-1.5 relative z-10">
                <span className={clsx("font-display font-bold text-lg", selectedTradeId === trade.id ? "text-white" : "text-gray-300 group-hover:text-white transition-colors")}>{trade.symbol}</span>
                <span className={clsx("text-sm font-bold font-mono tracking-wider", trade.netPnL >= 0 ? 'text-emerald-400' : 'text-red-400', selectedTradeId === trade.id ? "drop-shadow-[0_0_8px_currentColor]" : "")}>
                  {trade.netPnL >= 0 ? '+' : ''}${trade.netPnL.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 font-mono relative z-10">
                <span>{format(new Date(trade.entryDate), 'MMM dd, HH:mm')}</span>
                <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider", trade.direction === 'Long' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>{trade.direction}</span>
              </div>
            </motion.button>
          ))}
          </div>
        </motion.div>

        {/* Replay Area */}
        <AnimatePresence mode="wait">
        {selectedTrade ? (
          <motion.div 
            key={selectedTrade.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Chart Area */}
            <div className="premium-card col-span-1 md:col-span-2 p-0 border-white/5 overflow-hidden flex flex-col relative group">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 to-purple-900/5 pointer-events-none" />
               <div className="p-6 border-b border-white/5 flex justify-between items-center backdrop-blur-md bg-black/20 relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 shadow-inner">
                    <span className="text-2xl font-display font-bold tracking-widest text-white drop-shadow-md">{selectedTrade.symbol}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={clsx("text-sm font-bold uppercase tracking-widest mb-1", selectedTrade.direction === 'Long' ? "text-emerald-400" : "text-red-400")}>
                      {selectedTrade.direction}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{format(new Date(selectedTrade.entryDate), 'MMMM do, yyyy • HH:mm a')}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={clsx("text-3xl font-display font-bold drop-shadow-[0_0_10px_currentColor]", selectedTrade.netPnL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {selectedTrade.netPnL >= 0 ? '+' : ''}${selectedTrade.netPnL.toFixed(2)}
                  </span>
                  <div className="text-sm font-mono tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10 text-gray-300 mt-1">{selectedTrade.rMultiple.toFixed(2)}R Multiple</div>
                </div>
              </div>
              
              <div className="flex-1 bg-black/60 relative p-1 overflow-hidden min-h-[450px]">
                <div className="absolute inset-0">
                  <AdvancedRealTimeChart
                    symbol={
                      selectedTrade.symbol === 'BTCUSD' ? 'BINANCE:BTCUSD' :
                      selectedTrade.symbol === 'ETHUSD' ? 'BINANCE:ETHUSD' :
                      selectedTrade.symbol === 'SOLUSD' ? 'BINANCE:SOLUSD' :
                      selectedTrade.symbol === 'BNBUSD' ? 'BINANCE:BNBUSD' :
                      selectedTrade.symbol === 'XRPUSD' ? 'BINANCE:XRPUSD' :
                      selectedTrade.assetClass === 'Forex' ? `FX:${selectedTrade.symbol}` :
                      selectedTrade.symbol
                    }
                    theme="dark"
                    autosize
                    allow_symbol_change={false}
                    hide_top_toolbar={false}
                    hide_legend={false}
                    save_image={false}
                  />
                </div>

                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
                  <div className="text-[10px] uppercase tracking-widest bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] backdrop-blur-md font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    Entry: ${selectedTrade.entryPrice}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Exit: ${selectedTrade.exitPrice}
                  </div>
                  <div className={clsx("text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-lg backdrop-blur-md font-bold flex items-center gap-2", 
                    selectedTrade.netPnL > 0 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30")}>
                    PnL: {selectedTrade.netPnL > 0 ? '+' : ''}${selectedTrade.netPnL.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="premium-card p-6 col-span-1 space-y-6 flex flex-col border-white/5 bg-black/40 relative overflow-y-auto max-h-[800px] custom-scrollbar">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <h3 className="flex items-center space-x-2 text-gray-400 font-bold uppercase tracking-widest text-xs">
                    <FileText size={14} /> <span>Trade Details</span>
                  </h3>
                  {!isEditingData ? (
                    <button onClick={() => setIsEditingData(true)} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider">
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                       <button onClick={() => setIsEditingData(false)} className="text-xs text-gray-500 hover:text-gray-300 font-bold uppercase tracking-wider">Cancel</button>
                       <button onClick={handleSaveData} className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider">Save</button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Entry Time</label>
                    {isEditingData ? (
                      <input type="datetime-local" value={editedData.entryDate} onChange={e => setEditedData({...editedData, entryDate: e.target.value})} className="bg-black/50 border border-white/10 rounded-md px-2 py-1 text-sm text-gray-200 outline-none" />
                    ) : (
                      <span className="text-sm font-mono text-gray-300">{format(new Date(selectedTrade.entryDate), 'MMM dd, yyyy HH:mm')}</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Stop Loss</label>
                      {isEditingData ? (
                        <input type="number" step="0.00001" value={editedData.stopLossPrice} onChange={e => setEditedData({...editedData, stopLossPrice: e.target.value})} className="bg-black/50 border border-white/10 rounded-md px-2 py-1 text-sm text-gray-200 outline-none" />
                      ) : (
                        <span className="text-sm font-mono text-gray-300">{selectedTrade.stopLossPrice ? `$${selectedTrade.stopLossPrice}` : '—'}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Take Profit</label>
                      {isEditingData ? (
                        <input type="number" step="0.00001" value={editedData.takeProfitPrice} onChange={e => setEditedData({...editedData, takeProfitPrice: e.target.value})} className="bg-black/50 border border-white/10 rounded-md px-2 py-1 text-sm text-gray-200 outline-none" />
                      ) : (
                        <span className="text-sm font-mono text-gray-300">{selectedTrade.takeProfitPrice ? `$${selectedTrade.takeProfitPrice}` : '—'}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">R Multiple</label>
                      {isEditingData ? (
                        <input type="number" step="0.1" value={editedData.rMultiple} onChange={e => setEditedData({...editedData, rMultiple: e.target.value})} className="bg-black/50 border border-white/10 rounded-md px-2 py-1 text-sm text-gray-200 outline-none" />
                      ) : (
                        <span className="text-sm font-mono text-gray-300">{selectedTrade.rMultiple.toFixed(2)}R</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Net PnL</label>
                      <span className={clsx("text-sm font-mono font-bold", selectedTrade.netPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {selectedTrade.netPnL >= 0 ? '+' : ''}${selectedTrade.netPnL.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Screenshot URL</label>
                    {isEditingData ? (
                      <input type="url" value={editedData.screenshotUrl} onChange={e => setEditedData({...editedData, screenshotUrl: e.target.value})} className="bg-black/50 border border-white/10 rounded-md px-2 py-1 text-sm text-gray-200 outline-none" />
                    ) : (
                      <span className="text-sm text-gray-400 truncate max-w-[200px]" title={selectedTrade.screenshotUrl}>{selectedTrade.screenshotUrl || '—'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="flex items-center space-x-2 text-gray-400 font-bold mb-3 uppercase tracking-widest text-xs border-b border-white/10 pb-2">
                  <Tag size={14} /> <span>Strategy Classification</span>
                </h3>
                <span className="inline-block bg-gradient-to-r from-purple-500/20 to-indigo-500/20 px-4 py-2 rounded-lg text-sm text-purple-200 border border-purple-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.1)] font-medium tracking-wide">
                  {selectedTrade.setup}
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="flex items-center space-x-2 text-gray-400 font-bold mb-3 uppercase tracking-widest text-xs border-b border-white/10 pb-2">
                  <Target size={14} /> <span>Thesis & Rationale</span>
                </h3>
                <div className="mb-2">
                  {isEditingThesis ? (
                    <textarea
                      value={editedThesis}
                      onChange={(e) => setEditedThesis(e.target.value)}
                      placeholder="Add your structural trading thesis here..."
                      className="w-full min-h-[120px] bg-black/60 border border-purple-500/30 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-y transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                    />
                  ) : (
                    <div 
                      onClick={() => setIsEditingThesis(true)}
                      className="text-gray-300 text-sm leading-relaxed bg-black/50 p-4 rounded-xl border border-white/5 shadow-inner cursor-pointer hover:bg-white/5 hover:border-white/10 transition-colors"
                    >
                      {selectedTrade.thesis ? (
                        <div className="whitespace-pre-wrap">{selectedTrade.thesis}</div>
                      ) : (
                        <span className="text-gray-600 italic">Click to document your structural thesis...</span>
                      )}
                    </div>
                  )}
                </div>
                {isEditingThesis && (
                  <div className="flex space-x-2 justify-end">
                    <button 
                      onClick={() => {
                        setEditedThesis(selectedTrade.thesis || "");
                        setIsEditingThesis(false);
                      }}
                      className="text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveThesis}
                      className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-500/20"
                    >
                      <Save size={14} /> <span>Save</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="relative z-10">
                <h3 className="flex items-center space-x-2 text-gray-400 font-bold mb-3 uppercase tracking-widest text-xs border-b border-white/10 pb-2">
                  <AlertTriangle size={14} className={selectedTrade.executionErrors.length > 0 ? "text-amber-500" : "text-gray-400"} /> 
                  <span>Friction Points</span>
                </h3>
                {selectedTrade.executionErrors.length > 0 ? (
                  <ul className="space-y-3">
                    {selectedTrade.executionErrors.map((err, idx) => (
                      <motion.li 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        key={idx} 
                        className="bg-red-500/10 border-l-2 border-red-500 text-red-300 px-4 py-2.5 text-sm rounded-r-lg shadow-sm"
                      >
                        {err}
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 text-sm rounded-xl text-center shadow-[inset_0_0_10px_rgba(16,185,129,0.1)] flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                       <Target size={16} className="text-emerald-400" />
                    </div>
                    <span className="font-bold tracking-wide">Flawless Execution</span>
                  </div>
                )}
              </div>

              <div className="relative z-10">
                <h3 className="flex items-center space-x-2 text-gray-400 font-bold mb-3 uppercase tracking-widest text-xs border-b border-white/10 pb-2">
                  <FileText size={14} /> <span>Transaction Notes</span>
                </h3>
                <div className="mb-2">
                  {isEditingNotes ? (
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Add reflections, missed opportunities, or execution notes..."
                      className="w-full min-h-[120px] bg-black/60 border border-blue-500/30 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-y transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                    />
                  ) : (
                    <div 
                      onClick={() => setIsEditingNotes(true)}
                      className="bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-gray-300 min-h-[100px] cursor-pointer hover:bg-white/5 hover:border-white/10 transition-colors group"
                    >
                      {selectedTrade.notes ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{selectedTrade.notes}</div>
                      ) : (
                        <span className="text-gray-600 italic flex items-center space-x-2">
                          <span>Click to add notes...</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isEditingNotes && (
                  <div className="flex space-x-2 justify-end">
                    <button 
                      onClick={() => {
                        setEditedNotes(selectedTrade.notes || "");
                        setIsEditingNotes(false);
                      }}
                      className="text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveNotes}
                      className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20"
                    >
                      <Save size={14} /> <span>Save</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 mt-auto relative z-10">
                {selectedTrade.screenshotUrl ? (
                   <a href={selectedTrade.screenshotUrl} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-3.5 rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 font-bold tracking-wider text-sm">
                      <Image size={18} /> <span>Open Visual Archive</span>
                    </a>
                ) : (
                  <button disabled className="w-full flex items-center justify-center space-x-3 bg-white/5 border border-white/5 text-gray-500 p-3.5 rounded-xl text-sm font-bold tracking-wider cursor-not-allowed">
                    <Image size={18} /> <span>No Graphics Attached</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={itemVars} className="col-span-1 lg:col-span-3 premium-card flex flex-col items-center justify-center text-gray-500 border-white/5 bg-black/20 min-h-[500px]">
             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Play className="w-10 h-10 opacity-30 text-white translate-x-1" />
             </div>
             <p className="text-xl font-display text-gray-400 mb-2">Awaiting Selection</p>
             <p className="text-sm text-gray-600">Select a transaction from the timeline to initialize playback.</p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
