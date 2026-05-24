import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Trade } from '../lib/types';
import { calculateMetrics } from '../lib/metrics';
import { format } from 'date-fns';
import { CsvImportButton } from './CsvImport';
import { motion, AnimatePresence } from 'motion/react';
import { AdBanner } from './AdBanner';
import { HilltopAdsBanner } from './HilltopAdsBanner';
import { AccountConnectionModal } from './AccountConnectionModal';
import { DirectTradeTerminal } from './DirectTradeTerminal';
import { useBrokerSync } from '../lib/useBrokerSync';
import { Wallet, Activity, TrendingUp, Hash, DollarSign, ArrowUpCircle, ArrowDownCircle, RefreshCw, Share2, Plus, LayoutGrid, Calendar, Newspaper, Filter, Calendar as CalendarIcon, ChevronDown, MonitorPlay, MoreVertical, Flame } from 'lucide-react';
import { TradeSyncModal } from './TradeSyncModal';
import { View } from './Sidebar';

interface DashboardProps {
  trades: Trade[];
  onImport: (trades: Trade[]) => void;
  onSetView?: (view: View) => void;
}

const containerVars: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVars: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const StatBox = React.memo(({ title, value, prefix = '', suffix = '', isPositive, icon: Icon, extraInfo }: any) => (
  <motion.div 
    variants={itemVars} 
    whileHover={{ y: -6, scale: 1.03, boxShadow: "0 25px 40px -10px rgba(0,0,0,0.3)" }}
    transition={{ type: "spring", stiffness: 400, damping: 15 }}
    className="premium-card p-5 sm:p-6 relative group overflow-hidden flex flex-col justify-between h-full cursor-default"
    style={{ transformStyle: 'preserve-3d' }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <motion.div className="relative z-10 flex flex-col h-full" style={{ transform: 'translateZ(20px)' }}>
      <div className="flex justify-between items-start mb-4">
        <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold font-sans tracking-widest uppercase group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{title}</div>
        {Icon && <Icon size={16} className="text-gray-400 dark:text-gray-500 opacity-50 group-hover:opacity-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all" />}
      </div>
      <div className={"min-h-[40px] mt-auto text-3xl sm:text-4xl font-display font-bold whitespace-nowrap " + ((isPositive === true || isPositive === 'positive') ? 'text-emerald-600 dark:text-emerald-400 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' : isPositive === false ? 'text-red-600 dark:text-red-400 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(248,113,113,0.4)]' : 'text-gray-900 dark:text-gray-100 drop-shadow-sm dark:group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]')}>
        {prefix}{value}{suffix}
      </div>
      {extraInfo && (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 font-semibold">{extraInfo}</div>
      )}
    </motion.div>
  </motion.div>
));

export function Dashboard({ trades, onImport, onSetView }: DashboardProps) {
  const [sortConfig, setSortConfig] = React.useState<{key: keyof Trade | null, direction: 'asc' | 'desc'}>({ key: 'exitDate', direction: 'desc' });
  const [activeTemplate, setActiveTemplate] = useState<'metrics' | 'calendar' | 'news'>('metrics');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [showTradeSyncModal, setShowTradeSyncModal] = useState(false);
  const [connectedBroker, setConnectedBroker] = useState<string | null>(null);

  useEffect(() => {
    const handleConnect = (e: any) => {
      setConnectedBroker(e.detail.platform);
    };
    window.addEventListener('broker_connected', handleConnect);
    return () => window.removeEventListener('broker_connected', handleConnect);
  }, []);

  const { data: brokerData, status: brokerStatus } = useBrokerSync(!!connectedBroker);

  const displayBalance = brokerData ? brokerData.balance : 21549.63;
  const isLive = brokerStatus === 'connected';

  const handleSort = (key: keyof Trade) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const metrics = useMemo(() => calculateMetrics(trades), [trades]);

  const equityData = useMemo(() => {
    let currentEquity = 0;
    const sorted = [...trades].sort((a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime());
    
    const data: { date: string; equity: number; tradeDetails?: Trade }[] = [{ date: 'Start', equity: 0 }];
    sorted.forEach(t => {
      currentEquity += t.netPnL;
      data.push({
        date: format(new Date(t.exitDate), 'MMM dd HH:mm'),
        equity: currentEquity,
        tradeDetails: t
      });
    });
    return data;
  }, [trades]);

  const sortedTrades = useMemo(() => {
    let sortableItems = [...trades];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof Trade];
        let bValue = b[sortConfig.key as keyof Trade];
        
        if (aValue === undefined) aValue = '';
        if (bValue === undefined) bValue = '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems.slice(0, 10);
  }, [trades, sortConfig]);

  const recentTrades = sortedTrades;

  const getSession = (dateStr: string) => {
    const hour = new Date(dateStr).getUTCHours();
    if (hour >= 23 || hour < 7) return 'Asian';
    if (hour >= 7 && hour < 12) return 'London';
    if (hour >= 12 && hour < 21) return 'New York';
    return 'Asian';
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVars}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVars} className="flex flex-col gap-4">
        {/* Top Info Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-gray-200 dark:border-white/5 pb-4">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/5 flex items-center justify-center border border-blue-100 dark:border-white/5">
                <MonitorPlay className="text-blue-500" size={20} />
             </div>
             <div>
               <div className="flex items-center space-x-2">
                 <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Test</span>
                 <span className="text-xs text-gray-500">• Test-123</span>
               </div>
               <div className="flex items-center space-x-2">
                 <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight flex items-center cursor-pointer hover:text-blue-500 transition-colors">
                   Test Account <ChevronDown size={14} className="ml-1" />
                 </h1>
               </div>
               <p className="text-xs text-gray-400">VT Markets (Pty) Ltd • Synced 13 minutes ago</p>
             </div>
          </div>
          
          <div className="flex w-full md:w-auto items-center justify-between md:justify-end space-x-2">
             <button 
                onClick={() => setShowTradeSyncModal(true)}
                className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-[#1e88e5] hover:bg-[#1565c0] text-white border border-transparent rounded-lg text-sm font-medium transition-all shadow-sm"
             >
                <RefreshCw size={16} className="mr-2" />
                Trade Sync
             </button>
             <div className="flex space-x-2">
               <button 
                 onClick={() => {
                   if (navigator.clipboard) {
                     navigator.clipboard.writeText(window.location.href);
                     alert('Dashboard URL copied to clipboard!');
                   }
                 }}
                 className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 transition-all shadow-sm hover:text-blue-500"
               >
                  <Share2 size={18} />
               </button>
               <button 
                 onClick={() => onSetView?.('activity-log')}
                 className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 transition-all shadow-sm hover:text-emerald-500"
                 title="Add New Trade"
               >
                  <Plus size={18} />
               </button>
             </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-2">
          {/* Templates */}
          <div className="flex items-center overflow-x-auto custom-scrollbar pb-1 xl:pb-0">
             <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mr-3">Template</span>
             <div className="flex bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/5 rounded-lg p-1 mr-3 shadow-sm flex-shrink-0">
                <button 
                  onClick={() => setActiveTemplate('metrics')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors ${activeTemplate === 'metrics' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                   <LayoutGrid size={16} className="mr-1.5" />
                   Metrics
                </button>
                <button 
                  onClick={() => onSetView?.('calendar')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors ${activeTemplate === 'calendar' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  title="View Calendar"
                >
                   <Calendar size={16} />
                </button>
                <button 
                  onClick={() => onSetView?.('market-news')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors ${activeTemplate === 'news' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  title="View Market News"
                >
                   <Newspaper size={16} />
                </button>
             </div>
             
             <button 
               onClick={() => alert('Custom dashboard template builder is coming soon in v2.0!')}
               className="flex items-center px-4 py-2 bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/5 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap shadow-sm hover:border-gray-300 dark:hover:border-white/10 transition-colors"
             >
               Custom <ChevronDown size={14} className="ml-1 text-gray-400" />
             </button>
          </div>

          {/* Filters & Date */}
          <div className="flex items-center space-x-3">
             <button 
               onClick={() => onSetView?.('calendar')}
               className="flex items-center px-4 py-2 bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/5 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium shadow-sm hover:border-gray-300 dark:hover:border-white/10 transition-colors"
             >
                <CalendarIcon size={16} className="mr-2 text-blue-500" />
                Apr 20, 2026 - Today
                <ChevronDown size={14} className="ml-2 text-gray-400" />
             </button>
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'}`}
             >
                <Filter size={16} className="mr-1.5" />
                Filter
             </button>
             <CsvImportButton onImport={onImport} />
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/5 rounded-xl p-4 flex flex-wrap gap-4 shadow-sm">
               <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Asset Class</label>
                 <select className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500">
                    <option>All Assets</option>
                    <option>Forex</option>
                    <option>Indices</option>
                    <option>Crypto</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Trade Direction</label>
                 <select className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500">
                    <option>All Directions</option>
                    <option>Long Only</option>
                    <option>Short Only</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Outcome</label>
                 <select className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500">
                    <option>All Outcomes</option>
                    <option>Wins Only</option>
                    <option>Losses Only</option>
                 </select>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Hero row: Demo + Trade Count + Winstreak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVars} className="bg-white dark:bg-[#151516] border border-blue-200 dark:border-blue-500/20 rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_-5px_rgba(59,130,246,0.1)] lg:col-span-1">
          {connectedBroker ? (
            <>
              <div className="flex items-center space-x-4 mb-6">
                 <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 flex-shrink-0">
                   <Activity size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white capitalize truncate">{connectedBroker}</h3>
                   <div className="flex items-center gap-2 mt-1">
                     <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-yellow-500 select-none animate-pulse'}`}></span>
                     <p className="text-sm text-gray-500 dark:text-gray-400">{isLive ? 'Live Sync Active' : 'Connecting ws...'}</p>
                   </div>
                 </div>
              </div>
              <button 
                onClick={() => setShowTerminalModal(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center whitespace-nowrap w-full"
              >
                Trade Terminal <MonitorPlay size={16} className="ml-2" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-4 mb-6">
                 <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
                   <Activity size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white">Demo workspace</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400">You are currently viewing demo data</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowConnectModal(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center whitespace-nowrap w-full"
              >
                Connect Trading Account <ArrowUpCircle size={16} className="ml-2 rotate-90" />
              </button>
            </>
          )}
        </motion.div>

        <motion.div variants={itemVars} className="bg-white dark:bg-[#151516] border border-gray-100 dark:border-white/5 rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-semibold text-gray-900 dark:text-white">Trade Count</h3>
             <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><MoreVertical size={16} /></button>
           </div>
           <div className="flex-1 flex flex-col justify-end">
             <div className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">{metrics.totalTrades}</div>
             <p className="text-sm text-gray-500 dark:text-gray-400">All-time recorded trades</p>
           </div>
        </motion.div>

        <motion.div variants={itemVars} className="bg-white dark:bg-[#151516] border border-gray-100 dark:border-white/5 rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-semibold text-gray-900 dark:text-white">Winstreak</h3>
             <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><MoreVertical size={16} /></button>
           </div>
           <div className="flex-1 flex items-end justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-4xl font-display font-bold text-blue-500">1</span>
                  <Flame className="text-blue-500" size={24} fill="currentColor" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Days</p>
                <div className="flex space-x-2 mt-2">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded">BEST 6</span>
                  <span className="px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded">WORST 4</span>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-4xl font-display font-bold text-blue-500">2</span>
                  <Flame className="text-blue-500" size={24} fill="currentColor" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Trades</p>
                <div className="flex space-x-2 mt-2">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded">BEST 6</span>
                  <span className="px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded">WORST 5</span>
                </div>
              </div>
           </div>
        </motion.div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatBox title="Gain %" value="0.00" suffix="%" isPositive={'positive'} icon={TrendingUp} extraInfo="0.00% Abs" />
        <StatBox title="Win Rate" value={(metrics.winRate * 100).toFixed(1)} suffix="%" icon={Activity} />
        <StatBox title="Profit Factor" value={metrics.profitFactor.toFixed(2)} isPositive={metrics.profitFactor > 1.5 ? 'positive' : undefined} icon={TrendingUp} />
        <StatBox title="Net PnL" value={metrics.netPnL.toFixed(2)} prefix="$" isPositive={metrics.netPnL >= 0} icon={Wallet} />
      </div>

      {/* Equity Curve Chart */}
      <motion.div variants={itemVars} className="premium-card p-6 border border-gray-100 dark:border-white/5 bg-white dark:bg-[#151516] rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-1xl md:text-2xl font-display font-semibold tracking-tight">Balance</h2>
          <div className="flex space-x-2">
            <span className="flex items-center font-bold text-gray-900 dark:text-white">${displayBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>
        <div className="h-64 md:h-96 w-full -ml-4 md:-ml-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888822" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} tickMargin={12} />
              <YAxis stroke="#6b7280" tick={{fill: '#6b7280', fontSize: 12, fontFamily: 'JetBrains Mono'}} axisLine={false} tickLine={false} tickMargin={12} />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)', stroke: 'rgba(255, 255, 255, 0.1)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-3 rounded-xl shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)] min-w-[150px]">
                        <p className="text-gray-500 dark:text-gray-400 font-mono text-[11px] mb-2">{label}</p>
                        <p className="text-gray-900 dark:text-white font-display text-lg font-bold flex items-center">
                           <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                           Balance
                           <span className="text-blue-500 ml-auto whitespace-nowrap pl-4">
                             ${Number(payload[0].value).toFixed(2)}
                           </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="equity" 
                stroke="url(#strokeGradient)" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorEquity)" 
                activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Trade Analytics Widget */}
      <motion.div variants={itemVars} className="bg-white dark:bg-[#151516] border border-gray-100 dark:border-white/5 rounded-xl shadow-sm p-6 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
             <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white flex items-center gap-2">
               <Activity size={20} className="text-blue-500" />
               Trade Analytics
             </h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">High-level insights synthesized from {metrics.totalTrades} recent transactions</p>
           </div>
           
           <div className="flex gap-8 md:gap-12 w-full md:w-auto">
             <div className="flex flex-col">
               <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Profit Factor</span>
               <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{metrics.profitFactor.toFixed(2)}</span>
             </div>
             <div className="hidden sm:block w-px bg-gray-200 dark:bg-white/10 my-1"></div>
             <div className="flex flex-col">
               <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Win Rate</span>
               <span className="text-2xl font-mono font-bold text-emerald-500">{(metrics.winRate * 100).toFixed(1)}%</span>
             </div>
             <div className="hidden sm:block w-px bg-gray-200 dark:bg-white/10 my-1"></div>
             <div className="flex flex-col">
               <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Avg R-Multiple</span>
               <span className="text-2xl font-mono font-bold text-purple-500">{metrics.avgRMultiple.toFixed(2)}R</span>
             </div>
           </div>
        </div>
      </motion.div>

      {/* Recent Trades Table */}
      <motion.div variants={itemVars} className="bg-white dark:bg-[#151516] border border-gray-100 dark:border-white/5 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 text-xs font-sans tracking-widest uppercase cursor-pointer select-none">
                <th className="px-6 py-4 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => handleSort('symbol')}>Pair {sortConfig.key === 'symbol' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th className="px-6 py-4 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => handleSort('direction')}>Pos {sortConfig.key === 'direction' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th className="px-6 py-4 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => handleSort('setup')}>Strategy {sortConfig.key === 'setup' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th className="px-6 py-4 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => handleSort('entryDate')}>Entry Time {sortConfig.key === 'entryDate' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th className="px-6 py-4 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => handleSort('exitDate')}>Exit Time {sortConfig.key === 'exitDate' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th className="px-6 py-4 font-semibold hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => handleSort('rMultiple')}>Multiple {sortConfig.key === 'rMultiple' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th className="px-6 py-4 font-semibold text-right hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => handleSort('netPnL')}>Net PnL {sortConfig.key === 'netPnL' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {recentTrades.map((t, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + 0.3 }}
                  key={t.id} 
                  className="hover:bg-blue-50/50 dark:hover:bg-white/[0.03] transition-colors group cursor-default"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={"px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border " + (t.direction === 'Long' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-sm' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 shadow-sm')}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{t.setup || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono tracking-tight">{format(new Date(t.entryDate), 'HH:mm')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getSession(t.entryDate) === 'Asian' ? 'bg-yellow-100/50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500' : getSession(t.entryDate) === 'London' ? 'bg-blue-100/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-500' : 'bg-rose-100/50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-500'}`}>
                      {getSession(t.entryDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono tracking-tight">{format(new Date(t.exitDate), 'MMM dd, HH:mm')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700 dark:text-gray-300">{t.rMultiple.toFixed(2)}R</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-lg font-mono">
                    <div className={"inline-flex items-center drop-shadow-sm " + (t.netPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                      {t.netPnL >= 0 ? '+' : ''}${t.netPnL.toFixed(2)}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {trades.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 shadow-sm dark:shadow-none flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p>No transactions found. Import data to populate.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Ad Banners */}
      <div className="mt-8 space-y-4 shadow-sm border border-gray-100 dark:border-white/5 bg-white dark:bg-[#151516] rounded-xl p-2">
        <AdBanner />
        <HilltopAdsBanner />
      </div>

      <AccountConnectionModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
      <DirectTradeTerminal 
        isOpen={showTerminalModal} 
        onClose={() => setShowTerminalModal(false)} 
        platform={connectedBroker || 'broker'}
        equity={displayBalance}
      />
      <TradeSyncModal isOpen={showTradeSyncModal} onClose={() => setShowTradeSyncModal(false)} />
    </motion.div>
  );
}
