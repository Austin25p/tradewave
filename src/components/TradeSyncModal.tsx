import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Link, Activity, Play, Plus, Server } from 'lucide-react';
import { clsx } from 'clsx';

interface TradeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { useConnections } from '../lib/useConnections';

export function TradeSyncModal({ isOpen, onClose }: TradeSyncModalProps) {
  const [masterAccount, setMasterAccount] = useState('');
  const [slaves, setSlaves] = useState([{ id: 1, name: '', allocation: '1' }]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { addSyncEngine } = useConnections();

  const handleStartSync = () => {
    if (!isSyncing) {
      setIsSyncing(true);
      setTimeout(() => {
        addSyncEngine({
          id: Math.random().toString(36).substring(7),
          masterAccountId: masterAccount || 'Master_Default',
          slaves: slaves.map((s, i) => ({ id: s.id.toString(), name: s.name || `Node ${i+1}`, allocation: s.allocation })),
          status: 'active'
        });
        window.dispatchEvent(new CustomEvent('tradesync_connected'));
        setTimeout(onClose, 800);
      }, 500);
    } else {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white dark:bg-[#151516] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500 flex items-center gap-2">
                 Trade Sync Engine
              </h2>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">Easily manage multiple accounts from one master—everything stays synced in real time:</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-[#f5f7f9] dark:bg-black/20">
            {/* How It Works - Cards matching the image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden group">
                <div className="w-10 h-10 rounded-full bg-[#1e88e5] text-white flex items-center justify-center font-bold text-lg mb-4">1</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Connect Master Account</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Link your source trading account</p>
              </div>
              
              <div className="bg-white dark:bg-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden group">
                <div className="w-10 h-10 rounded-full bg-[#1e88e5] text-white flex items-center justify-center font-bold text-lg mb-4">2</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Choose Slave Accounts & Allocation</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Select accounts to copy to and set risk ratios</p>
              </div>
              
              <div className="bg-white dark:bg-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden group">
                <div className="w-10 h-10 rounded-full bg-[#1e88e5] text-white flex items-center justify-center font-bold text-lg mb-4">3</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Start Copying—Automated & Real-Time</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Trades execute automatically across all accounts</p>
              </div>
              
              <div className="bg-white dark:bg-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden group">
                <div className="w-10 h-10 rounded-full bg-[#1e88e5] text-white flex items-center justify-center font-bold text-lg mb-4">4</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Monitor & Adjust as You Go</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Track performance and modify settings anytime</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Setup Area */}
               <div className="space-y-6">
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Server size={18} className="text-[#1e88e5]" /> Master Account</h3>
                   <select 
                     value={masterAccount}
                     onChange={e => setMasterAccount(e.target.value)}
                     className="w-full bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1e88e5] shadow-sm"
                   >
                     <option value="">Select Master Account...</option>
                     <option value="acc_1">VT Markets - Live (#109438)</option>
                     <option value="acc_2">FTMO Challenge - Phase 1 (#492301)</option>
                     <option value="acc_3">FundingPips - Master (#89231)</option>
                   </select>
                 </div>
                 
                 <div>
                   <div className="flex justify-between items-center mb-3">
                     <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Link size={18} className="text-[#1e88e5]" /> Slave Accounts</h3>
                     <button 
                       onClick={() => setSlaves([...slaves, { id: Date.now(), name: '', allocation: '1' }])}
                       className="text-xs font-bold text-[#1e88e5] hover:text-[#1565c0] flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg"
                     >
                       <Plus size={14} /> Add Slave
                     </button>
                   </div>
                   
                   <div className="space-y-3">
                     {slaves.map((slave, i) => (
                       <div key={slave.id} className="flex gap-2">
                         <select 
                           className="flex-1 bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1e88e5] shadow-sm"
                         >
                           <option value="">Select Account...</option>
                           <option value="s1">MyForexFunds Phase 2</option>
                           <option value="s2">FTMO Verification</option>
                           <option value="s3">Personal Personal Oanda</option>
                         </select>
                         <div className="w-28 relative flex items-center">
                           <span className="absolute right-3 text-gray-500 text-xs pointer-events-none">x</span>
                           <input 
                             type="number" 
                             defaultValue={slave.allocation}
                             step="0.1"
                             min="0.1"
                             className="w-full bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/10 rounded-xl pl-3 pr-6 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-[#1e88e5] shadow-sm text-right"
                           />
                         </div>
                         {slaves.length > 1 && (
                           <button onClick={() => setSlaves(slaves.filter(s => s.id !== slave.id))} className="px-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-xl transition-colors shrink-0">
                             <X size={16} />
                           </button>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               {/* Live Monitor Placeholder */}
               <div className="bg-gray-900 rounded-xl p-5 border border-white/10 text-gray-300 font-mono text-sm relative overflow-hidden flex flex-col shadow-inner">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-[#1e88e5] to-emerald-500"></div>
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                    <span className="flex items-center gap-2"><Activity size={16} className={isSyncing ? "text-emerald-400" : "text-gray-500"} /> System Log</span>
                    {isSyncing && <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md font-sans font-bold tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ACTIVE</span>}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar text-xs">
                    <div className="opacity-50">[{new Date().toLocaleTimeString()}] Engine standby... ready for master connection.</div>
                    {isSyncing && (
                      <>
                        <div className="text-emerald-400">[{new Date().toLocaleTimeString()}] Connect OK: {masterAccount || 'Master Account'}</div>
                        {slaves.map((s, i) => (
                          <div key={i} className="text-blue-400 mt-1">[{new Date().toLocaleTimeString()}] Target Node {i+1} Connected [Alloc: {s.allocation}x]</div>
                        ))}
                        <div className="text-purple-400 mt-2">[{new Date().toLocaleTimeString()}] Listening for incoming trade execution events...</div>
                      </>
                    )}
                  </div>
               </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#151516] flex justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleStartSync} 
              className={clsx(
                "px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2",
                isSyncing 
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white" 
                  : "bg-[#1e88e5] hover:bg-[#1565c0] shadow-blue-500/20 text-white"
              )}
            >
              {isSyncing ? <><X size={18} /> Stop Sync</> : <><Play size={18} /> Start Syncing</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
