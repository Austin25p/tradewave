import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Trade } from '../lib/types';
import { calculateMetrics } from '../lib/metrics';
import { format } from 'date-fns';
import { CsvImportButton } from './CsvImport';
import { motion } from 'motion/react';

interface DashboardProps {
  trades: Trade[];
  onImport: (trades: Trade[]) => void;
}

const containerVars: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVars: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function Dashboard({ trades, onImport }: DashboardProps) {
  const metrics = calculateMetrics(trades);

  // Generate equity curve dataseries
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

  const StatBox = ({ title, value, prefix = '', suffix = '', isPositive }: any) => (
    <motion.div 
      variants={itemVars} 
      whileHover={{ y: -5, scale: 1.02 }}
      className="premium-card p-6 relative group overflow-hidden"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <motion.div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
        <div className="text-gray-400 text-sm font-medium mb-2 font-sans tracking-wide uppercase">{title}</div>
        <div className={"text-4xl font-display font-bold " + (isPositive === true ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' : isPositive === false ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]' : 'text-gray-100')}>
          {prefix}{value}{suffix}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVars}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVars} className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-2 relative inline-block">
            Performance Dashboard
            <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
          </h1>
          <p className="text-gray-400 text-lg mt-3">Overview of your trading system metrics and equity curve.</p>
        </div>
        <CsvImportButton onImport={onImport} />
      </motion.header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox title="Net PnL" value={metrics.netPnL.toFixed(2)} prefix="$" isPositive={metrics.netPnL >= 0} />
        <StatBox title="Win Rate" value={(metrics.winRate * 100).toFixed(1)} suffix="%" />
        <StatBox title="Profit Factor" value={metrics.profitFactor.toFixed(2)} isPositive={metrics.profitFactor > 1.5} />
        <StatBox title="Total Trades" value={metrics.totalTrades} />
      </div>

      {/* Equity Curve Chart */}
      <motion.div variants={itemVars} className="premium-card p-6 border-b-0">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-semibold tracking-tight">Equity Curve</h2>
          <div className="flex space-x-2">
            <span className="flex items-center text-xs font-mono text-gray-400"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_#3b82f6]"></span>Cumulative PnL</span>
          </div>
        </div>
        <div className="h-96 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} tickMargin={12} />
              <YAxis stroke="#6b7280" tick={{fill: '#6b7280', fontSize: 12, fontFamily: 'JetBrains Mono'}} axisLine={false} tickLine={false} tickMargin={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="equity" 
                stroke="url(#strokeGradient)" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorEquity)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Trades Table */}
      <motion.div variants={itemVars} className="premium-card overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-display font-semibold">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-gray-400 text-xs font-sans tracking-widest uppercase">
                <th className="px-6 py-4 font-semibold">Pair</th>
                <th className="px-6 py-4 font-semibold">Pos</th>
                <th className="px-6 py-4 font-semibold">Strategy</th>
                <th className="px-6 py-4 font-semibold">Exit Time</th>
                <th className="px-6 py-4 font-semibold">Multiple</th>
                <th className="px-6 py-4 font-semibold text-right">Net PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...trades].sort((a,b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()).slice(0, 10).map((t, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + 0.3 }}
                  key={t.id} 
                  className="hover:bg-white/[0.03] transition-colors group cursor-default"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-white group-hover:text-blue-400 transition-colors">{t.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={"px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border " + (t.direction === 'Long' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]')}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{t.setup || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono tracking-tight">{format(new Date(t.exitDate), 'MMM dd, HH:mm')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{t.rMultiple.toFixed(2)}R</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-lg font-mono">
                    <div className={"inline-flex items-center drop-shadow-md " + (t.netPnL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {t.netPnL >= 0 ? '+' : ''}${t.netPnL.toFixed(2)}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {trades.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p>No transactions found. Import data to populate.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
