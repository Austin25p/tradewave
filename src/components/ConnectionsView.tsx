import React, { useState } from 'react';
import { Server, Activity, X, Play, Pause, Plus, Link as LinkIcon, ExternalLink, Zap } from 'lucide-react';
import { useConnections, BrokerConnection, SyncEngine } from '../lib/useConnections';
import { useHaptic } from '../lib/haptic';
import { clsx } from 'clsx';
import { AccountConnectionModal } from './AccountConnectionModal';
import { TradeSyncModal } from './TradeSyncModal';

export function ConnectionsView() {
  const { brokers, removeBroker, syncEngines, removeSyncEngine, toggleSyncEngine } = useConnections();
  const haptic = useHaptic();
  
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="text-blue-500" />
            Integrations & Connections
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your active broker connections and TradeSync engine.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
           >
            <Plus size={16} /> Connect Account
           </button>
           <button 
            onClick={() => setShowSyncModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
           >
            <Zap size={16} /> New TradeSync
           </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Brokers & Exchanges <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">{brokers.length} Active</span>
        </h2>
        {brokers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#151516] border border-gray-100 dark:border-white/5 rounded-2xl text-center">
            <div className="w-16 h-16 bg-blue-50 inset-0 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4">
               <Server size={28} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">No Active Connections</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">Connect a broker or exchange to start syncing trades, monitoring equity, and analyzing your performance in real-time.</p>
            <button onClick={() => setShowConnectModal(true)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Connect Now</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brokers.map((broker) => (
              <div key={broker.id} className="bg-white dark:bg-[#151516] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm relative group overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                          {broker.platformId.substring(0, 2).toUpperCase()}
                       </div>
                       <div>
                         <h3 className="font-bold text-gray-900 dark:text-white capitalize">{broker.platformId}</h3>
                         <div className="flex items-center gap-1.5 text-xs text-gray-500">
                           <span className={clsx("w-2 h-2 rounded-full", broker.status === 'connected' ? "bg-emerald-500" : "bg-red-500 animate-pulse")}></span>
                           {broker.serverName}
                         </div>
                       </div>
                    </div>
                    <button onClick={() => removeBroker(broker.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account ID</div>
                      <div className="font-mono font-bold text-sm text-gray-900 dark:text-white">{broker.accountId}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
                      <div className="font-bold text-sm capitalize text-emerald-600 dark:text-emerald-400">{broker.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balance</div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">${broker.balance.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Equity</div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">${broker.equity.toLocaleString()}</div>
                    </div>
                 </div>

                 <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-white/5">
                    <span className="text-xs text-gray-400">Connected: {new Date(broker.connectedAt).toLocaleDateString()}</span>
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 flex items-center gap-1">Details <ExternalLink size={12} /></button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          TradeSync Engines <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">{syncEngines.length} Active</span>
        </h2>
        {syncEngines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#151516] border border-gray-100 dark:border-white/5 rounded-2xl text-center">
            <div className="w-16 h-16 bg-emerald-50 inset-0 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4">
               <Zap size={28} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">No Active TradeSync</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">Deploy a TradeSync engine to automatically mirror trades from a master account to multiple slave accounts with lightning speed.</p>
            <button onClick={() => setShowSyncModal(true)} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">Setup TradeSync</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {syncEngines.map((engine) => (
              <div key={engine.id} className="bg-white dark:bg-[#151516] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm relative group overflow-hidden">
                 <div className={clsx("absolute top-0 left-0 w-full h-1 bg-gradient-to-r", engine.status === 'active' ? "from-emerald-500 to-teal-500" : "from-gray-400 to-gray-500")}></div>
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                          {engine.status === 'active' ? <Activity size={20} className="text-emerald-500" /> : <Pause size={20} className="text-gray-400" />}
                       </div>
                       <div>
                         <h3 className="font-bold text-gray-900 dark:text-white">Sync #{engine.id.substring(0, 6)}</h3>
                         <div className="flex items-center gap-1.5 text-xs text-gray-500 capitalize">
                           <span className={clsx("w-2 h-2 rounded-full", engine.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-gray-400")}></span>
                           {engine.status} Engine
                         </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => { haptic('medium'); toggleSyncEngine(engine.id); }} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg transition-colors">
                         {engine.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                       </button>
                       <button onClick={() => removeSyncEngine(engine.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                         <X size={16} />
                       </button>
                    </div>
                 </div>
                 
                 <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-gray-500">Master</span>
                       <span className="text-sm font-bold font-mono text-gray-900 dark:text-white truncate max-w-[120px]">{engine.masterAccountId}</span>
                    </div>
                    <div className="flex justify-center text-gray-400">
                       <LinkIcon size={14} className="rotate-90" />
                    </div>
                    <div className="space-y-2">
                       {engine.slaves.map((slave, i) => (
                         <div key={i} className="flex items-center justify-between">
                           <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded truncate max-w-[100px]">{slave.name || `Node ${i+1}`}</span>
                           <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{slave.allocation}x</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Nodes: {engine.slaves.length}</span>
                    <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1">Manage <ExternalLink size={12} /></button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AccountConnectionModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
      <TradeSyncModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </div>
  );
}
