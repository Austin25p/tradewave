import React, { useState, useMemo } from 'react';
import { Trade } from '../lib/types';
import { getSession } from '../lib/metrics';
import { clsx } from 'clsx';
import { Settings, BarChart2, Target, TrendingUp, BookOpen, Key, Crosshair, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export function PropFirmTracker({ 
  trades,
  onAddTrade,
  onUpdateTrade,
  onDeleteTrade
}: { 
  trades: Trade[],
  onAddTrade?: (trade: Trade) => void,
  onUpdateTrade?: (trade: Trade) => void,
  onDeleteTrade?: (id: string) => void
}) {
  // Settings State
  const [startingBalance, setStartingBalance] = useState<string>('100000');
  const [challengePhase, setChallengePhase] = useState<string>('Phase 1');
  const [profitTargetPct, setProfitTargetPct] = useState<string>('8');
  const [maxDrawdownPct, setMaxDrawdownPct] = useState<string>('10');
  const [maxDailyLossPct, setMaxDailyLossPct] = useState<string>('5');
  const [tradesToPass, setTradesToPass] = useState<string>('1');
  
  const [riskPct, setRiskPct] = useState<string>('2.00');

  // Table Edit/Add State
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ date: '', pair: '', pnl: '', notes: '' });

  const [newTradeData, setNewTradeData] = useState({
    date: new Date().toISOString().split('T')[0],
    pair: 'XAUUSD',
    pnl: '',
    notes: ''
  });

  const handleEditClick = (trade: Trade) => {
    setEditingTradeId(trade.id);
    setEditFormData({
      date: trade.entryDate.split('T')[0],
      pair: trade.symbol,
      pnl: trade.netPnL.toString(),
      notes: trade.notes || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingTradeId || !onUpdateTrade) return;
    const trade = trades.find(t => t.id === editingTradeId);
    if (!trade) return;
    
    onUpdateTrade({
      ...trade,
      entryDate: editFormData.date + 'T12:00:00Z',
      symbol: editFormData.pair,
      netPnL: parseFloat(editFormData.pnl) || 0,
      notes: editFormData.notes
    });
    setEditingTradeId(null);
  };

  const handleAddSubmit = () => {
    if (!onAddTrade) return;
    onAddTrade({
      id: Date.now().toString(),
      entryDate: newTradeData.date + 'T12:00:00Z',
      exitDate: newTradeData.date + 'T13:00:00Z',
      symbol: newTradeData.pair || 'UNKNOWN',
      direction: parseFloat(newTradeData.pnl) >= 0 ? 'Long' : 'Short',
      entryPrice: 0,
      exitPrice: 0,
      quantity: 1,
      netPnL: parseFloat(newTradeData.pnl) || 0,
      notes: newTradeData.notes,
      assetClass: 'Forex',
      fees: 0,
      rMultiple: parseFloat(newTradeData.pnl) >= 0 ? 1 : -1,
      setup: 'Prop Firm Test',
      executionErrors: []
    });
    setNewTradeData({ ...newTradeData, pnl: '', notes: '' });
  };

  const handleDeleteTradeAction = (id: string) => {
    if (window.confirm("Are you sure you want to delete this trade? This action cannot be undone.")) {
      if (onDeleteTrade) onDeleteTrade(id);
      setEditingTradeId(null);
    }
  };

  const balance = parseFloat(startingBalance) || 100000;
  const targetPct = parseFloat(profitTargetPct) || 8;
  const targetAbs = balance * (targetPct / 100);
  
  const sortedTrades = useMemo(() => [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()), [trades]);

  let currentBalance = balance;
  let totalPnL = 0;
  let wins = 0;
  let losses = 0;
  let breakEvens = 0;
  
  const logData = sortedTrades.map((t, i) => {
    const isWin = t.netPnL > 0;
    const isLoss = t.netPnL < 0;
    const isBE = t.netPnL === 0;
    
    if (isWin) wins++;
    if (isLoss) losses++;
    if (isBE) breakEvens++;
    
    currentBalance += t.netPnL;
    totalPnL += t.netPnL;
    
    const ddAbs = balance - currentBalance;
    const ddPct = ddAbs > 0 ? (ddAbs / balance) * 100 : 0;
    const toTarget = Math.max(0, targetAbs - totalPnL);
    
    return {
      trade: t,
      index: i + 1,
      date: new Date(t.entryDate).toLocaleDateString(),
      pair: t.symbol,
      session: getSession(t.entryDate), 
      outcome: isWin ? 'Win' : isLoss ? 'Loss' : 'BE',
      riskPct: riskPct + '%',
      riskAbs: (currentBalance * (parseFloat(riskPct) / 100)),
      pnl: t.netPnL,
      balance: currentBalance,
      ddPct: ddPct,
      toTarget: toTarget,
      status: currentBalance < balance * (1 - (parseFloat(maxDrawdownPct)/100)) ? 'FAIL' : 'Active',
      notes: t.notes || ''
    };
  });

  const winRate = logData.length > 0 ? (wins / logData.length) * 100 : 0;
  const drawdownPct = currentBalance < balance ? ((balance - currentBalance) / balance) * 100 : 0;
  const currentToTarget = Math.max(0, targetAbs - totalPnL);

  const formatMoney = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

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
      className="min-h-full font-sans text-sm text-gray-200 pb-12"
    >
      <motion.div variants={itemVars} className="mb-8">
        <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-2 relative inline-block">
          Prop Firm Challenge Tracker
          <div className="absolute -bottom-2 right-0 w-1/2 h-1 bg-gradient-to-l from-purple-500 to-transparent rounded-full" />
        </h1>
        <p className="text-gray-400 text-lg mt-3">Monitor metrics, risk targets, and equity limits in real-time.</p>
      </motion.div>
      
      {/* Top Section Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        
        {/* Left Column: MASTER KEY */}
        <motion.div variants={itemVars} className="space-y-6">
          <motion.div 
            whileHover={{ scale: 1.02, y: -5, rotateX: 2 }}
            className="premium-card overflow-hidden !rounded-2xl border border-white/10 bg-black/40"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-display uppercase tracking-widest font-bold py-3 flex items-center justify-center space-x-3 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
              <Key size={18} className="relative z-10" />
              <span className="relative z-10 text-shadow-sm">Master Configuration</span>
            </div>
            
            <div className="text-amber-400 font-bold tracking-widest text-center py-2 border-b border-white/5 text-xs bg-white/5 uppercase">
              Account Requirements
            </div>
            
            {/* Setting Rows */}
            <div className="grid grid-cols-3 border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
              <div className="font-semibold text-right p-3 pr-4 flex items-center justify-end text-gray-400">Starting Balance</div>
              <div className="border-l border-r border-white/5 p-2 bg-black/30">
                <input type="number" 
                       className="w-full bg-transparent text-center text-blue-400 font-mono font-bold outline-none ring-1 ring-blue-500/0 focus:ring-blue-500/50 rounded-md py-1 transition-all" 
                       value={startingBalance} onChange={e => setStartingBalance(e.target.value)} />
              </div>
              <div className="p-3 pl-4 text-gray-500 italic flex items-center text-xs">← Challenge starting balance</div>
            </div>
            <div className="grid grid-cols-3 border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
              <div className="font-semibold text-right p-3 pr-4 flex items-center justify-end text-gray-400">Challenge Phase</div>
              <div className="border-l border-r border-white/5 p-2 bg-black/30">
                <input type="text" 
                       className="w-full bg-transparent text-center text-white font-bold outline-none ring-1 ring-white/0 focus:ring-white/20 rounded-md py-1 transition-all" 
                       value={challengePhase} onChange={e => setChallengePhase(e.target.value)} />
              </div>
              <div className="p-3 pl-4 text-gray-500 italic flex items-center text-xs">← Phase 1 or 2</div>
            </div>
            <div className="grid grid-cols-3 border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
              <div className="font-semibold text-right p-3 pr-4 flex items-center justify-end text-gray-400">Profit Target %</div>
              <div className="border-l border-r border-white/5 p-2 bg-black/30">
                <input type="number" 
                       className="w-full bg-transparent text-center text-emerald-400 font-mono font-bold outline-none ring-1 ring-emerald-500/0 focus:ring-emerald-500/50 rounded-md py-1 transition-all" 
                       value={profitTargetPct} onChange={e => setProfitTargetPct(e.target.value)} />
              </div>
              <div className="p-3 pl-4 text-gray-500 italic flex items-center text-xs">← Target to pass</div>
            </div>
            <div className="grid grid-cols-3 border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
              <div className="font-semibold text-right p-3 pr-4 flex items-center justify-end text-gray-400">Max Drawdown %</div>
              <div className="border-l border-r border-white/5 p-2 bg-black/30">
                <input type="number" 
                       className="w-full bg-transparent text-center text-red-400 font-mono font-bold outline-none ring-1 ring-red-500/0 focus:ring-red-500/50 rounded-md py-1 transition-all" 
                       value={maxDrawdownPct} onChange={e => setMaxDrawdownPct(e.target.value)} />
              </div>
              <div className="p-3 pl-4 text-gray-500 italic flex items-center text-xs">← Max total DD</div>
            </div>
            <div className="grid grid-cols-3 border-b border-white/5 text-sm hover:bg-red-500/5 transition-colors">
              <div className="font-semibold text-right p-3 pr-4 flex items-center justify-end text-red-400/80">Max Daily Loss %</div>
              <div className="border-l border-r border-white/5 p-2 bg-red-950/20">
                <input type="number" 
                       className="w-full bg-transparent text-center text-red-500 font-mono font-bold outline-none ring-1 ring-red-500/0 focus:ring-red-500/50 rounded-md py-1 transition-all" 
                       value={maxDailyLossPct} onChange={e => setMaxDailyLossPct(e.target.value)} />
              </div>
              <div className="p-3 pl-4 text-red-500/80 italic flex items-center font-bold text-xs uppercase tracking-wider">← Hard Cap LIMIT</div>
            </div>
             <div className="grid grid-cols-3 text-sm hover:bg-white/5 transition-colors">
              <div className="font-semibold text-right p-3 pr-4 flex items-center justify-end text-gray-400">Trades to Pass</div>
              <div className="border-l border-r border-white/5 p-2 bg-black/30">
                <input type="number" 
                       className="w-full bg-transparent text-center text-blue-400 font-mono font-bold outline-none ring-1 ring-blue-500/0 focus:ring-blue-500/50 rounded-md py-1 transition-all" 
                       value={tradesToPass} onChange={e => setTradesToPass(e.target.value)} />
              </div>
              <div className="p-3 pl-4 text-gray-500 italic flex items-center text-xs">← Expected volume</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: DASHBOARD & STATS */}
        <motion.div variants={itemVars} className="space-y-6">
          
          {/* LIVE DASHBOARD */}
          <motion.div 
            whileHover={{ scale: 1.02, y: -5, rotateX: 2 }}
            className="premium-card overflow-hidden !rounded-2xl border border-white/10 bg-black/40"
            style={{ transformStyle: 'preserve-3d' }}
          >
             <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-display uppercase tracking-widest font-bold py-3 flex items-center justify-center space-x-3 shadow-lg relative overflow-hidden">
              <BarChart2 size={18} className="relative z-10" />
              <span className="relative z-10 text-shadow-sm">Live Performance Dashboard</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 border-b border-white/5">
               <div className="col-span-1 border-r border-white/5 p-4 flex items-center justify-center text-gray-400 text-sm font-bold tracking-widest bg-white/[0.02]">
                 BALANCE
               </div>
               <div className="col-span-1 lg:col-span-2 p-4 flex items-center justify-center bg-black/40 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-blue-500/5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                 <span className="text-4xl font-mono font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{formatMoney(currentBalance)}</span>
               </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 border-b border-white/5">
               <div className="col-span-1 border-r border-white/5 p-4 flex items-center justify-center text-gray-400 text-sm font-bold tracking-widest bg-white/[0.02]">
                 TO TARGET
               </div>
               <div className="col-span-1 lg:col-span-2 p-4 flex items-center justify-center bg-black/40 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-amber-500/5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                 <span className="text-3xl font-mono font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">{formatMoney(currentToTarget)}</span>
               </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3">
               <div className="col-span-1 border-r border-white/5 p-4 flex items-center justify-center text-gray-400 text-sm font-bold tracking-widest bg-white/[0.02]">
                 DRAWDOWN
               </div>
               <div className="col-span-1 lg:col-span-2 p-4 flex items-center justify-center bg-black/40 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-red-500/5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                 <span className="text-3xl font-mono font-bold text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">{drawdownPct.toFixed(2)}%</span>
               </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NEXT TRADE RISK */}
            <motion.div 
              whileHover={{ scale: 1.05, y: -5 }}
              className="premium-card overflow-hidden !rounded-2xl border border-white/10 bg-black/40"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white font-display uppercase tracking-widest font-bold py-2 flex items-center justify-center space-x-2 shadow-lg">
                <Target size={16} />
                <span className="text-sm border-amber-800">Next Trade Risk</span>
              </div>
              <div className="p-4 flex flex-col items-center justify-center bg-black/40 h-full min-h-[120px]">
                <div className="text-gray-400 text-xs font-bold tracking-wider mb-2">RISK ALLOCATION %</div>
                <input type="number" 
                       step="0.1"
                       className="w-full max-w-[120px] bg-black/50 rounded-xl text-center text-amber-400 font-mono font-bold text-3xl outline-none ring-1 ring-amber-500/30 focus:ring-amber-500 py-2 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" 
                       value={riskPct} onChange={e => setRiskPct(e.target.value)} />
              </div>
            </motion.div>

            {/* STATS */}
            <motion.div 
              whileHover={{ scale: 1.05, y: -5 }}
              className="premium-card overflow-hidden !rounded-2xl border border-white/10 bg-black/40 flex flex-col"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-display uppercase tracking-widest font-bold py-2 flex items-center justify-center space-x-2 shadow-lg">
                <TrendingUp size={16} />
                <span className="text-sm">Quick Stats</span>
              </div>
              <div className="grid grid-cols-2 p-4 gap-4 flex-1 items-center bg-black/40 text-sm">
                 <div className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2"><span className="text-gray-400 font-mono text-xs">W:</span> <span className="text-emerald-400 font-bold">{wins}</span></div>
                 <div className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2"><span className="text-gray-400 font-mono text-xs">L:</span> <span className="text-red-400 font-bold">{losses}</span></div>
                 <div className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2"><span className="text-gray-400 font-mono text-xs">WR:</span> <span className="text-blue-400 font-bold">{winRate.toFixed(0)}%</span></div>
                 <div className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2"><span className="text-gray-400 font-mono text-xs">P/L:</span> <span className="text-white font-mono font-bold">{formatMoney(totalPnL)}</span></div>
              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>

      {/* TRADE LOG TABLE */}
      <motion.div variants={itemVars} className="premium-card overflow-hidden !rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <div className="bg-white/5 border-b border-white/10 text-white font-display tracking-widest font-bold py-4 px-6 flex items-center justify-between">
           <div className="flex items-center space-x-3">
             <Calendar className="text-purple-400" size={20} />
             <span className="uppercase tracking-[0.2em] text-lg">Transaction Log</span>
           </div>
           <div className="text-xs text-gray-500 font-mono bg-black/40 px-3 py-1 rounded border border-white/5">Click any row to edit</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-sm whitespace-nowrap font-mono">
            <thead>
              <tr className="bg-black/60 text-gray-400 border-b border-white/10 text-xs tracking-wider">
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase">#</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase">Date</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase">Pair</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase">Session</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase">Outcome</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase text-purple-400/80">Risk %</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase text-amber-400/80">Risk $</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase font-bold text-white">Net P/L</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase">Balance</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase">DD%</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase">To Target</th>
                <th className="border-r border-white/5 px-4 py-3 font-semibold uppercase">Status</th>
                <th className="px-4 py-3 font-semibold uppercase">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logData.length === 0 ? (
                <tr>
                   <td colSpan={13} className="px-4 py-12 text-gray-500 bg-black/20 text-center font-sans italic">No entries logged yet. Add your first trade below.</td>
                </tr>
              ) : (
                logData.map((row) => (
                  editingTradeId === row.trade.id ? (
                    <tr key={row.index} className="border-b border-white/5 bg-blue-900/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]">
                      <td className="border-r border-white/5 px-4 py-2 text-blue-400">{row.index}</td>
                      <td className="border-r border-white/5 p-1"><input type="date" value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} className="w-full bg-black/50 rounded ring-1 ring-blue-500/50 outline-none text-center px-2 py-1 text-white" /></td>
                      <td className="border-r border-white/5 p-1"><input type="text" value={editFormData.pair} onChange={e => setEditFormData({...editFormData, pair: e.target.value})} className="w-full bg-black/50 rounded ring-1 ring-blue-500/50 outline-none text-center min-w-[80px] px-2 py-1 text-white" /></td>
                      <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                      <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                      <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                      <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                      <td className="border-r border-white/5 p-1"><input type="number" value={editFormData.pnl} onChange={e => setEditFormData({...editFormData, pnl: e.target.value})} className="w-full bg-black/50 rounded ring-1 ring-emerald-500/50 outline-none text-center min-w-[80px] px-2 py-1 text-emerald-400 font-bold" /></td>
                      <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                      <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                      <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                      <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                      <td className="p-1 px-2 flex items-center justify-between">
                         <input type="text" value={editFormData.notes} onChange={e => setEditFormData({...editFormData, notes: e.target.value})} className="w-full bg-black/50 rounded ring-1 ring-blue-500/50 outline-none px-2 py-1 mr-3 min-w-[120px] text-white" placeholder="Analysis notes" />
                         <div className="flex space-x-1.5 shrink-0">
                           <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded shadow-lg text-xs font-bold font-sans tracking-wide transition-all">Save</button>
                           <button onClick={() => handleDeleteTradeAction(editingTradeId)} className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded shadow-lg text-xs font-bold font-sans tracking-wide transition-all">Del</button>
                           <button onClick={(e) => { e.stopPropagation(); setEditingTradeId(null); }} className="px-3 py-1.5 bg-gray-600/80 hover:bg-gray-500 text-white rounded shadow-lg text-xs font-bold font-sans tracking-wide transition-all">Cancel</button>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.index} className="border-b border-white/5 hover:bg-white/[0.05] cursor-pointer transition-colors" onClick={() => handleEditClick(row.trade)}>
                      <td className="border-r border-white/5 px-4 py-3 text-gray-500">{row.index}</td>
                      <td className="border-r border-white/5 px-4 py-3 text-gray-300">{row.date}</td>
                      <td className="border-r border-white/5 px-4 py-3 text-white font-bold">{row.pair}</td>
                      <td className="border-r border-white/5 px-4 py-3 text-gray-400 text-xs uppercase bg-black/10">{row.session}</td>
                      <td className="border-r border-white/5 px-4 py-3">
                        <span className={clsx("px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider", row.outcome === 'Win' ? "bg-emerald-500/20 text-emerald-400" : row.outcome === 'Loss' ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400")}>
                          {row.outcome}
                        </span>
                      </td>
                      <td className="border-r border-white/5 px-4 py-3 bg-purple-950/20 text-purple-300/80">{row.riskPct}</td>
                      <td className="border-r border-white/5 px-4 py-3 bg-black/20 text-amber-300/80 font-mono">{formatMoney(row.riskAbs)}</td>
                      <td className={clsx("border-r border-white/5 px-4 py-3 text-base shadow-[inset_1px_0_0_rgba(255,255,255,0.05),inset_-1px_0_0_rgba(255,255,255,0.05)] font-bold", 
                          row.pnl > 0 ? "bg-emerald-500/10 text-emerald-400" : row.pnl < 0 ? "bg-red-500/10 text-red-400" : "text-gray-400 bg-white/5"
                        )}>
                        {row.pnl > 0 ? '+' : ''}{formatMoney(row.pnl)}
                      </td>
                      <td className="border-r border-white/5 px-4 py-3 text-gray-200">{formatMoney(row.balance)}</td>
                      <td className={clsx("border-r border-white/5 px-4 py-3", row.ddPct > parseFloat(maxDrawdownPct) ? "bg-red-900/50 text-red-200 font-bold" : row.ddPct > 0 ? "text-amber-400/80" : "text-gray-500")}>
                        {row.ddPct.toFixed(2)}%
                      </td>
                      <td className="border-r border-white/5 px-4 py-3 text-gray-400 font-bold">{formatMoney(row.toTarget)}</td>
                      <td className={clsx("border-r border-white/5 px-4 py-3 text-xs uppercase font-bold tracking-wider", row.status === 'FAIL' ? "bg-red-500/20 text-red-400" : "text-blue-500/50")}>
                        {row.status === 'FAIL' ? '⚠️ FAILED' : 'Active'}
                      </td>
                      <td className="px-4 py-3 text-left text-gray-400 truncate max-w-[200px] font-sans text-xs">{row.notes}</td>
                    </tr>
                  )
                ))
              )}
              
              {/* Add New Trade Row */}
              <tr className="border-t-2 border-purple-500/30 bg-purple-900/10 shadow-[inset_0_4px_10px_rgba(147,51,234,0.1)]">
                <td className="border-r border-white/5 px-4 py-3 text-purple-400 font-bold bg-purple-500/10">+ Edit</td>
                <td className="border-r border-white/5 p-1"><input type="date" value={newTradeData.date} onChange={e => setNewTradeData({...newTradeData, date: e.target.value})} className="w-full bg-black/40 outline-none text-center text-purple-300 px-2 py-1.5 rounded ring-1 ring-purple-500/30 focus:ring-purple-500/80 transition-all font-mono text-sm" /></td>
                <td className="border-r border-white/5 p-1"><input type="text" value={newTradeData.pair} onChange={e => setNewTradeData({...newTradeData, pair: e.target.value})} placeholder="Symbol" className="w-full min-w-[80px] bg-black/40 outline-none text-center text-white px-2 py-1.5 rounded ring-1 ring-purple-500/30 focus:ring-purple-500/80 transition-all font-bold placeholder:font-sans placeholder:font-normal" /></td>
                <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                <td className="border-r border-white/5 p-1"><input type="number" value={newTradeData.pnl} onChange={e => setNewTradeData({...newTradeData, pnl: e.target.value})} placeholder="Net P/L ($)" className="w-full min-w-[90px] bg-black/40 outline-none text-center text-purple-300 font-bold px-2 py-1.5 rounded ring-1 ring-purple-500/30 focus:ring-purple-500/80 transition-all font-mono placeholder:font-sans placeholder:font-normal" /></td>
                <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                <td className="border-r border-white/5 p-2 text-gray-600">-</td>
                <td className="p-1 px-4 flex items-center justify-between">
                  <input type="text" value={newTradeData.notes} onChange={e => setNewTradeData({...newTradeData, notes: e.target.value})} placeholder="Add notes about setup & execution" className="w-full bg-black/40 outline-none text-gray-300 font-sans mr-3 min-w-[150px] px-3 py-1.5 rounded ring-1 ring-purple-500/30 focus:ring-purple-500/80 transition-all text-sm" />
                  <button onClick={handleAddSubmit} className="glass-button !py-1.5 !px-5 text-sm font-bold uppercase tracking-wider shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none shadow-[0_4px_15px_rgba(147,51,234,0.3)]">Add Row</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  );
}
