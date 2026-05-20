import React, { useState, useMemo } from 'react';
import { Search, Filter, Activity, BarChart2, TrendingUp, Award, DollarSign, X, Image as ImageIcon, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Trade } from '../lib/types';
import { calculateAdvancedStats, calculateSessionPnL, isGoldenBulletCompliant, checkTradeDataIntegrity, getMarketSession } from '../lib/goldenBullet';
import { clsx } from 'clsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

export const IntegrityFixRow = ({ 
  issue, 
  trade, 
  value, 
  onChange,
  savedSetups,
  onSaveSetup,
  onRemoveSetup
}: { 
  issue: { index: number, id: string, issue: string }, 
  trade?: Trade, 
  value: any, 
  onChange: (updates: any) => void,
  savedSetups: string[],
  onSaveSetup: (e: React.MouseEvent, setup: string) => void,
  onRemoveSetup: (e: React.MouseEvent, setup: string) => void
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/30 p-4 rounded-xl text-sm shadow-[0_4px_10px_rgba(245,158,11,0.05)] transition-all space-y-4">
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-amber-400 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Row {issue.index + 1} Error</span>
        </span>
      </div>
      <div className="text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-black/40 backdrop-blur-md p-2.5 rounded-lg border border-amber-500/10 font-mono text-xs">{issue.issue}</div>
      <div className="text-gray-400 dark:text-gray-500/50 font-mono text-[10px] mt-2 text-right mb-2">ID: {issue.id}</div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Qty (Lots)</label>
          <input type="number" step="0.01" value={value.quantity} onChange={e => onChange({...value, quantity: e.target.value})} className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Entry Price</label>
          <input type="number" step="0.00001" value={value.entryPrice} onChange={e => onChange({...value, entryPrice: e.target.value})} className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Stop Loss</label>
          <input type="number" step="0.00001" value={value.stopLossPrice} onChange={e => onChange({...value, stopLossPrice: e.target.value})} className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Take Profit</label>
          <input type="number" step="0.00001" value={value.takeProfitPrice} onChange={e => onChange({...value, takeProfitPrice: e.target.value})} className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all" />
        </div>
        <div className="relative">
          <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 flex justify-between font-bold">
            <span>Setup</span>
            {value.setup && !savedSetups.includes(value.setup.trim()) && (
              <button onClick={(e) => onSaveSetup(e, value.setup)} className="text-amber-500 hover:text-amber-300">Save Setup</button>
            )}
          </label>
          <div className="flex flex-col gap-2">
            {savedSetups.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {savedSetups.map(s => (
                  <button 
                    key={s} 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({...value, setup: s}); }}
                    className={clsx("text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 group", value.setup === s ? "bg-amber-500 border-amber-500 text-black" : "bg-white/60 dark:bg-black/40 backdrop-blur-md border-amber-500/30 text-amber-500/70 hover:bg-amber-500/20 hover:text-amber-400")}
                  >
                    <span>{s}</span>
                    <span 
                      onClick={(e) => onRemoveSetup(e, s)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ml-1"
                    >
                      <X size={10} />
                    </span>
                  </button>
                ))}
              </div>
            )}
            <input type="text" placeholder="e.g. FVG, Breaker Block" value={value.setup} onChange={e => onChange({...value, setup: e.target.value})} className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all placeholder-amber-500/20" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Screenshot URL</label>
          <input type="text" placeholder="https://..." value={value.screenshotUrl} onChange={e => onChange({...value, screenshotUrl: e.target.value})} className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all placeholder-amber-500/20" />
        </div>
      </div>
    </div>
  );
};

export function StrategyAnalytics({ trades, onUpdateTrade }: { trades: Trade[], onUpdateTrade?: (trade: Trade) => void }) {
  const [filterSession, setFilterSession] = useState<'All' | 'Featured Strategy' | 'Other'>('All');
  const [filterType, setFilterType] = useState<'All' | 'Long' | 'Short'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ quantity: string; entryPrice: string; stopLossPrice: string; takeProfitPrice: string; screenshotUrl: string; setup: string; netPnL: string }>({ quantity: '', entryPrice: '', stopLossPrice: '', takeProfitPrice: '', screenshotUrl: '', setup: '', netPnL: '' });
  const [batchUpdates, setBatchUpdates] = useState<Record<string, any>>({});
  const [savedSetups, setSavedSetups] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('savedTradeSetups');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return ['VWAP Bounce', 'ORB', 'FVG', 'Breaker Block', 'Order Block', 'Liquidity Sweep'];
  });

  const handleSaveSetup = (e: React.MouseEvent, setupToSave: string) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = setupToSave.trim();
    if (!trimmed || savedSetups.includes(trimmed)) return;
    const newSetups = [...savedSetups, trimmed];
    setSavedSetups(newSetups);
    try {
      localStorage.setItem('savedTradeSetups', JSON.stringify(newSetups));
    } catch (err) {}
  };

  const handleRemoveSetup = (e: React.MouseEvent, setupToRemove: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newSetups = savedSetups.filter(s => s !== setupToRemove);
    setSavedSetups(newSetups);
    try {
      localStorage.setItem('savedTradeSetups', JSON.stringify(newSetups));
    } catch (err) {}
  };

  const handleEditClick = (tradeId: string) => {
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return;
    setEditingTradeId(trade.id);
    setEditFormData({
      quantity: trade.quantity?.toString() || '1',
      entryPrice: trade.entryPrice?.toString() || '0',
      stopLossPrice: trade.stopLossPrice?.toString() || '',
      takeProfitPrice: trade.takeProfitPrice?.toString() || '',
      screenshotUrl: trade.screenshotUrl || '',
      setup: trade.setup || '',
      netPnL: trade.netPnL?.toString() || '0'
    });
  };

  const handleSaveEdit = () => {
    if (!editingTradeId || !onUpdateTrade) return;
    const trade = trades.find(t => t.id === editingTradeId);
    if (!trade) return;
    
    onUpdateTrade({
      ...trade,
      quantity: parseFloat(editFormData.quantity) || 1,
      entryPrice: parseFloat(editFormData.entryPrice) || 0,
      stopLossPrice: editFormData.stopLossPrice !== '' ? parseFloat(editFormData.stopLossPrice) : undefined,
      takeProfitPrice: editFormData.takeProfitPrice !== '' ? parseFloat(editFormData.takeProfitPrice) : undefined,
      screenshotUrl: editFormData.screenshotUrl.trim() || undefined,
      setup: editFormData.setup.trim() || 'Uncategorized',
      netPnL: parseFloat(editFormData.netPnL) || 0
    });
    setEditingTradeId(null);
  };

  const cleanupIssues = useMemo(() => checkTradeDataIntegrity(trades), [trades]);

  const handleBatchUpdateChange = (tradeId: string, value: any) => {
    setBatchUpdates(prev => ({
      ...prev,
      [tradeId]: value
    }));
  };

  const handleApplyBatchUpdates = () => {
    if (!onUpdateTrade) return;
    Object.keys(batchUpdates).forEach(tradeId => {
      const trade = trades.find(t => t.id === tradeId);
      const updates = batchUpdates[tradeId];
      if (trade && updates) {
        onUpdateTrade({
          ...trade,
          quantity: parseFloat(updates.quantity) || 1,
          entryPrice: parseFloat(updates.entryPrice) || 0,
          stopLossPrice: updates.stopLossPrice !== '' ? parseFloat(updates.stopLossPrice) : undefined,
          takeProfitPrice: updates.takeProfitPrice !== '' ? parseFloat(updates.takeProfitPrice) : undefined,
          screenshotUrl: updates.screenshotUrl.trim() || undefined,
          setup: updates.setup.trim() || undefined
        });
      }
    });
    setBatchUpdates({});
  };

  const filteredTrades = useMemo(() => {
    let result = [...trades];

    if (filterSession === 'Featured Strategy') {
      result = result.filter(t => isGoldenBulletCompliant(t.entryDate));
    } else if (filterSession === 'Other') {
      result = result.filter(t => !isGoldenBulletCompliant(t.entryDate));
    }

    if (filterType !== 'All') {
      result = result.filter(t => t.direction === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.symbol.toLowerCase().includes(term) ||
        (t.setup || '').toLowerCase().includes(term) ||
        t.entryDate.includes(term)
      );
    }

    return result;
  }, [trades, filterSession, filterType, searchTerm]);

  const stats = useMemo(() => calculateAdvancedStats(filteredTrades), [filteredTrades]);
  
  const statsByStrategy = useMemo(() => {
    const strategies: Record<string, Trade[]> = {};
    filteredTrades.forEach(t => {
      const setup = t.setup?.trim() || 'Uncategorized';
      if (!strategies[setup]) strategies[setup] = [];
      strategies[setup].push(t);
    });

    return Object.entries(strategies).map(([setup, ts]) => {
      const s = calculateAdvancedStats(ts);
      return {
        name: setup,
        winRate: s.winRate,
        expectancy: s.expectancy,
        pnl: s.netProfit,
        profitFactor: isNaN(s.profitFactor) ? 0 : s.profitFactor,
        count: ts.length
      };
    }).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredTrades]);

  const pnlBySession = useMemo(() => [
    { name: 'Asian', pnl: calculateSessionPnL(trades, 'Asian') },
    { name: 'London', pnl: calculateSessionPnL(trades, 'London') },
    { name: 'NY Overlap', pnl: calculateSessionPnL(trades, 'NY Overlap') },
    { name: 'New York', pnl: calculateSessionPnL(trades, 'New York') },
    { name: 'Other', pnl: calculateSessionPnL(trades, 'Other') },
  ], [trades]);

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
      className="space-y-8 max-w-7xl mx-auto h-full flex flex-col"
    >
      <motion.header variants={itemVars} className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tighter mb-3 flex items-center space-x-3">
            <Award className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" size={40} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600">
              Strategy Analytics
            </span>
          </h1>
          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-lg">Advanced strategy-specific tracking and performance measurement.</p>
        </div>
      </motion.header>

      {/* Smart Filters */}
      <motion.div variants={itemVars} className="premium-card p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg border-gray-100 dark:border-white/5">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/60 dark:bg-black/40 backdrop-blur-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all sm:text-sm font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
            placeholder="Search symbols, tags, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <select
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/60 dark:bg-black/40 backdrop-blur-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent sm:text-sm appearance-none cursor-pointer transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'All' | 'Long' | 'Short')}
            >
              <option value="All">All Directions</option>
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>
          
          <div className="relative w-full md:w-48">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Activity className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <select
              className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/60 dark:bg-black/40 backdrop-blur-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent sm:text-sm appearance-none cursor-pointer transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value as 'All' | 'Featured Strategy' | 'Other')}
            >
              <option value="All">All Sessions</option>
              <option value="Featured Strategy">Optimal Window</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Advanced Stats / Analytics Panel */}
      <motion.div variants={containerVars} className="grid grid-cols-2 md:grid-cols-5 gap-5">
        <motion.div variants={itemVars} className="premium-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500"><BarChart2 size={64} /></div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-2 z-10 relative">Win Rate</div>
          <div className="text-4xl font-display font-bold text-gray-900 dark:text-white z-10 relative drop-shadow-md">{stats.winRate.toFixed(1)}%</div>
          <div className="text-xs font-mono text-blue-400/80 mt-2">Strike Rate</div>
        </motion.div>
        <motion.div variants={itemVars} className="premium-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500"><TrendingUp size={64} /></div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-2 z-10 relative">Expectancy</div>
          <div className={clsx("text-4xl font-display font-bold z-10 relative drop-shadow-md", stats.expectancy > 0 ? "text-emerald-400" : "text-gray-600 dark:text-gray-300")}>
            ${stats.expectancy.toFixed(2)}
          </div>
          <div className="text-xs font-mono text-blue-400/80 mt-2">Per Trade</div>
        </motion.div>
        <motion.div variants={itemVars} className="premium-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500"><Filter size={64} /></div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-2 z-10 relative">Reward/Risk</div>
          <div className="text-4xl font-display font-bold text-gray-900 dark:text-white z-10 relative drop-shadow-md">
            {stats.rrRatio > 0 ? `1:${stats.rrRatio.toFixed(2)}` : 'N/A'}
          </div>
          <div className="text-xs font-mono text-blue-400/80 mt-2">Average R:R</div>
        </motion.div>
        <motion.div variants={itemVars} className="premium-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500"><DollarSign size={64} /></div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-2 z-10 relative">Avg Win</div>
          <div className="text-4xl font-display font-bold text-emerald-400 z-10 relative drop-shadow-md">${stats.avgWin.toFixed(2)}</div>
          <div className="text-xs font-mono text-blue-400/80 mt-2">Winning Trades</div>
        </motion.div>
        <motion.div variants={itemVars} className="premium-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500"><Activity size={64} /></div>
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-2 z-10 relative">Avg Loss</div>
          <div className="text-4xl font-display font-bold text-red-400 z-10 relative drop-shadow-md">-${stats.avgLoss.toFixed(2)}</div>
          <div className="text-xs font-mono text-blue-400/80 mt-2">Losing Trades</div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Performance Chart */}
        <motion.div variants={itemVars} className="premium-card p-6 flex flex-col border-gray-100 dark:border-white/5">
          <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-white/10 pb-4">Win Rate by Strategy</h2>
          <div className="flex-1 min-h-[350px] -ml-6 md:-ml-0">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsByStrategy} margin={{ top: 20, right: 10, left: 10, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 13 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={120} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any, name: any) => [name === 'winRate' ? `${Number(value).toFixed(1)}%` : value, name === 'winRate' ? 'Win Rate' : name]}
                  />
                  <Bar dataKey="winRate" radius={[0, 4, 4, 0]} maxBarSize={30}>
                    {statsByStrategy.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? '#3B82F6' : '#6366F1'} className="transition-all duration-300" />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        {/* PnL By Session Chart */}
        <motion.div variants={itemVars} className="premium-card p-6 flex flex-col border-gray-100 dark:border-white/5">
          <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-white/10 pb-4">PnL By Time Window (EST)</h2>
          <div className="flex-1 min-h-[350px] -ml-6 md:-ml-0">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlBySession} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} />
                  <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 13, fontFamily: 'JetBrains Mono' }} tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} tickMargin={12} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'PnL']}
                  />
                  <Bar dataKey="pnl" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {pnlBySession.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} className="transition-all duration-300" style={{ filter: `drop-shadow(0 0 8px ${entry.pnl >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'})` }} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Data Cleanup Tool Module */}
        <motion.div variants={itemVars} className="lg:col-span-2 premium-card p-6 flex flex-col border border-gray-100 dark:border-white/5 bg-gradient-to-b from-blue-900/10 to-transparent">
           <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-3">
              <Activity className="text-blue-400" />
              <span>Data Extraction</span>
           </h2>
           <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-6 font-sans">Identifies missing stop-losses, lots, or dirty data extracted from MT4/MT5 logs.</p>
           
           <div className="flex-1 bg-black/50 border border-gray-100 dark:border-white/5 rounded-2xl p-4 overflow-y-auto shadow-inner custom-scrollbar relative">
             {cleanupIssues.length === 0 ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                 <div className="bg-emerald-500/10 border border-emerald-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                   <Award className="text-emerald-400" size={32} />
                 </div>
                 <h3 className="text-emerald-400 font-display font-bold text-lg tracking-wide">Data is Crystal Clean</h3>
                 <p className="text-emerald-400/60 text-sm mt-2">All {trades.length} trades possess exceptional integrity.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {cleanupIssues.map((issue, idx) => {
                   const trade = trades.find(t => t.id === issue.id);
                   const value = batchUpdates[issue.id] || {
                     quantity: trade?.quantity?.toString() || '1',
                     entryPrice: trade?.entryPrice?.toString() || '0',
                     stopLossPrice: trade?.stopLossPrice?.toString() || '',
                     takeProfitPrice: trade?.takeProfitPrice?.toString() || '',
                     screenshotUrl: trade?.screenshotUrl || '',
                     setup: trade?.setup || ''
                   };
                   return (
                     <IntegrityFixRow 
                       key={idx} 
                       issue={issue} 
                       trade={trade} 
                       value={value}
                       onChange={(updates) => handleBatchUpdateChange(issue.id, updates)}
                       savedSetups={savedSetups}
                       onSaveSetup={handleSaveSetup}
                       onRemoveSetup={handleRemoveSetup}
                     />
                   );
                 })}
                 
                 {Object.keys(batchUpdates).length > 0 && (
                   <motion.button 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     onClick={handleApplyBatchUpdates}
                     className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] text-sm uppercase tracking-widest mt-4 sticky bottom-0 z-10"
                   >
                     Apply {Object.keys(batchUpdates).length} Selected Fixes
                   </motion.button>
                 )}
               </div>
             )}
           </div>
        </motion.div>
      </div>
      
      {/* Slicers/Table Viewer */}
      <motion.div variants={itemVars} className="premium-card overflow-hidden shadow-2xl border-gray-100 dark:border-white/5">
         <div className="bg-white/[0.02] px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
           <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white tracking-wide">Filtered Transactions</h3>
           <span className="px-3 py-1 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-full text-sm font-mono font-bold text-blue-400">{filteredTrades.length} records</span>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse text-sm">
             <thead>
                 <tr className="border-b border-gray-100 dark:border-white/5 text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-white/60 dark:bg-black/40 backdrop-blur-md font-bold">
                 <th className="px-6 py-4">Entry Time</th>
                 <th className="px-6 py-4">Session</th>
                 <th className="px-6 py-4">Exit Time</th>
                 <th className="px-6 py-4">Symbol</th>
                 <th className="px-6 py-4">Type</th>
                 <th className="px-6 py-4">Strategy Type</th>
                 <th className="px-6 py-4">Volume</th>
                 <th className="px-6 py-4 text-center">Documentation</th>
                 <th className="px-6 py-4 text-right">Net PnL</th>
                 <th className="px-6 py-4 text-center">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/5 bg-black/20">
               {filteredTrades.map(trade => {
                 const isGB = isGoldenBulletCompliant(trade.entryDate);
                 const isEditing = editingTradeId === trade.id;

                 if (isEditing) {
                   return (
                     <tr key={trade.id} className="bg-amber-500/5">
                       <td colSpan={10} className="px-6 py-5">
                         <div className="space-y-4">
                           <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                             <span className="font-bold text-amber-500 tracking-wider text-xs uppercase">Edit Trade Data - {trade.symbol}</span>
                             <button onClick={() => setEditingTradeId(null)} className="text-amber-500/50 hover:text-amber-400 transition-colors bg-amber-500/10 hover:bg-amber-500/20 p-1.5 rounded-full">
                               <X size={14} />
                             </button>
                           </div>
                           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                             <div>
                               <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Qty (Lots)</label>
                               <input 
                                 type="number" 
                                 step="0.01"
                                 value={editFormData.quantity}
                                 onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                                 className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                               />
                             </div>
                             <div>
                               <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Entry Price</label>
                               <input 
                                 type="number" 
                                 step="0.00001"
                                 value={editFormData.entryPrice}
                                 onChange={(e) => setEditFormData({ ...editFormData, entryPrice: e.target.value })}
                                 className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                               />
                             </div>
                             <div>
                               <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Stop Loss</label>
                               <input 
                                 type="number" 
                                 step="0.00001"
                                 value={editFormData.stopLossPrice}
                                 onChange={(e) => setEditFormData({ ...editFormData, stopLossPrice: e.target.value })}
                                 className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                               />
                             </div>
                             <div>
                               <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Take Profit</label>
                               <input 
                                 type="number" 
                                 step="0.00001"
                                 value={editFormData.takeProfitPrice}
                                 onChange={(e) => setEditFormData({ ...editFormData, takeProfitPrice: e.target.value })}
                                 className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                               />
                             </div>
                           </div>
                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                             <div className="relative">
                               <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 flex justify-between font-bold">
                                 <span>Setup</span>
                                 {editFormData.setup && !savedSetups.includes(editFormData.setup.trim()) && (
                                   <button onClick={(e) => handleSaveSetup(e, editFormData.setup)} className="text-amber-500 hover:text-amber-300">Save Setup</button>
                                 )}
                               </label>
                               <div className="flex flex-col gap-2">
                                 {savedSetups.length > 0 && (
                                   <div className="flex flex-wrap gap-1 mb-1">
                                     {savedSetups.map(s => (
                                       <button 
                                         key={s} 
                                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditFormData({...editFormData, setup: s}); }}
                                         className={clsx("text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 group", editFormData.setup === s ? "bg-amber-500 border-amber-500 text-black" : "bg-white/60 dark:bg-black/40 backdrop-blur-md border-amber-500/30 text-amber-500/70 hover:bg-amber-500/20 hover:text-amber-400")}
                                       >
                                         <span>{s}</span>
                                         <span 
                                           onClick={(e) => handleRemoveSetup(e, s)}
                                           className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ml-1"
                                         >
                                           <X size={10} />
                                         </span>
                                       </button>
                                     ))}
                                   </div>
                                 )}
                                 <input 
                                   type="text"
                                   placeholder="e.g. FVG, Breaker Block"
                                   value={editFormData.setup}
                                   onChange={(e) => setEditFormData({ ...editFormData, setup: e.target.value })}
                                   className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all placeholder-amber-500/20"
                                 />
                               </div>
                             </div>
                             <div>
                               <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Screenshot URL</label>
                               <input 
                                 type="text" 
                                 placeholder="https://..."
                                 value={editFormData.screenshotUrl}
                                 onChange={(e) => setEditFormData({ ...editFormData, screenshotUrl: e.target.value })}
                                 className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all placeholder-amber-500/20"
                               />
                             </div>
                             <div>
                               <label className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-1.5 block font-bold">Net PnL ($)</label>
                               <input 
                                 type="number" 
                                 step="0.01"
                                 value={editFormData.netPnL}
                                 onChange={(e) => setEditFormData({ ...editFormData, netPnL: e.target.value })}
                                 className="w-full bg-black/60 border border-amber-500/30 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                               />
                             </div>
                           </div>
                           <div className="flex justify-end pt-2">
                             <button 
                               onClick={handleSaveEdit}
                               className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] text-xs uppercase tracking-wider"
                             >
                               Save Trade Data
                             </button>
                           </div>
                         </div>
                       </td>
                     </tr>
                   );
                 }

                 return (
                   <tr key={trade.id} className="hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={() => handleEditClick(trade.id)}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 font-mono">
                       {new Date(trade.entryDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 font-mono">
                       <span className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none px-2 py-1 rounded text-gray-600 dark:text-gray-300 whitespace-nowrap">
                         {getMarketSession(trade.entryDate)}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 font-mono">
                       {new Date(trade.exitDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors">
                       {trade.symbol}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className={clsx(
                         "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border",
                         trade.direction === 'Long' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                       )}>
                         {trade.direction}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       {isGB ? (
                         <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/10 text-yellow-500 text-xs font-bold tracking-wide rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                           ★ Featured Time
                         </span>
                       ) : (
                         <span className="text-gray-400 dark:text-gray-500 text-xs font-mono tracking-wide px-3 py-1 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-full border border-gray-100 dark:border-white/5">Standard</span>
                       )}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono text-center">
                       {trade.quantity}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                       {trade.screenshotUrl ? (
                         <a href={trade.screenshotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-gray-900 dark:text-white transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transform hover:scale-105" title="View Screenshot">
                           <ImageIcon size={18} />
                         </a>
                       ) : (
                         <span className="inline-flex items-center justify-center w-8 h-8 rounded border border-dashed border-gray-200 dark:border-white/10 text-gray-600/50">-</span>
                       )}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap font-display text-lg font-bold">
                       <div className="flex items-center justify-end gap-1.5">
                         {trade.netPnL > 0 && <ArrowUp size={16} className="text-emerald-400" />}
                         {trade.netPnL < 0 && <ArrowDown size={16} className="text-red-400" />}
                         {trade.netPnL === 0 && <Minus size={16} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" />}
                         <span className={clsx(
                            "drop-shadow-sm",
                            trade.netPnL > 0 ? "text-emerald-400" : trade.netPnL < 0 ? "text-red-400" : "text-gray-400 dark:text-gray-500 dark:text-gray-400"
                         )}>
                           {trade.netPnL > 0 ? '+' : ''}${trade.netPnL.toFixed(2)}
                         </span>
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-center">
                       <button
                         onClick={() => handleEditClick(trade.id)}
                         className="text-[10px] py-1.5 px-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white rounded border border-gray-200 dark:border-white/10 uppercase tracking-widest transition-colors font-bold"
                       >
                         Edit
                       </button>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
           {filteredTrades.length === 0 && (
             <div className="p-16 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-black/20">
               <div className="w-16 h-16 rounded-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none flex items-center justify-center mb-4">
                 <Filter className="w-8 h-8 opacity-50 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
               </div>
               <p className="font-sans">No strategy setups match the given criteria.</p>
             </div>
           )}
         </div>
      </motion.div>
    </motion.div>
  );
}
