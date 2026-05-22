import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, DollarSign, Activity, AlertCircle } from 'lucide-react';

interface DirectTradeTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  platform?: string;
  equity?: number;
}

export function DirectTradeTerminal({ isOpen, onClose, platform = 'broker', equity = 10000 }: DirectTradeTerminalProps) {
  const [symbol, setSymbol] = useState('EURUSD');
  const [qty, setQty] = useState('1.0');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<'buy' | 'sell' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrade = async (side: 'buy' | 'sell') => {
    setIsSubmitting(side);
    setError(null);

    try {
      const res = await fetch('/api/trade/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, side, qty, sl, tp, platform })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Handle successful logic here
      alert(data.message);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to execute order");
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#111112] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
               <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <Activity size={18} className="text-blue-500" />
                 Direct Trading Terminal
               </h2>
               <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 transition-colors">
                 <X size={18} />
               </button>
            </div>

            <div className="p-5 space-y-4">
               {error && (
                 <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg border border-red-500/20 flex gap-2 items-start">
                   <AlertCircle size={16} className="mt-0.5 shrink-0" />
                   <p>{error}</p>
                 </div>
               )}

               <div className="flex justify-between items-center bg-gray-100 dark:bg-white/5 p-3 rounded-lg">
                 <span className="text-xs text-gray-500 uppercase font-semibold">Available Equity</span>
                 <span className="font-mono font-bold text-emerald-500 text-sm">${equity.toFixed(2)}</span>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-500">Asset</label>
                 <select 
                   value={symbol} onChange={e => setSymbol(e.target.value)}
                   className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white"
                 >
                   <option value="EURUSD">EUR/USD</option>
                   <option value="BTCUSD">BTC/USD</option>
                   <option value="AAPL">AAPL</option>
                 </select>
               </div>

               <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-500">Lot Size / Amount</label>
                 <input 
                   type="number" step="0.01" value={qty} onChange={e => setQty(e.target.value)}
                   className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white font-mono"
                 />
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-500">Stop Loss</label>
                   <input 
                     type="number" step="0.0001" placeholder="Price" value={sl} onChange={e => setSl(e.target.value)}
                     className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white font-mono placeholder:text-gray-400"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-500">Take Profit</label>
                   <input 
                     type="number" step="0.0001" placeholder="Price" value={tp} onChange={e => setTp(e.target.value)}
                     className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white font-mono placeholder:text-gray-400"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-2">
                 <button 
                   onClick={() => handleTrade('sell')}
                   disabled={isSubmitting === 'buy'}
                   className={`p-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center ${isSubmitting === 'sell' ? 'bg-red-400 opacity-80 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'}`}
                 >
                   {isSubmitting === 'sell' ? <TrendingUp className="animate-spin" size={18} /> : 'SELL MKT'}
                 </button>
                 <button 
                   onClick={() => handleTrade('buy')}
                   disabled={isSubmitting === 'sell'}
                   className={`p-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center ${isSubmitting === 'buy' ? 'bg-emerald-400 opacity-80 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
                 >
                   {isSubmitting === 'buy' ? <TrendingUp className="animate-spin" size={18} /> : 'BUY MKT'}
                 </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
