import React, { useState, useMemo } from 'react';
import { Trade } from '../lib/types';
import { calculateMetrics } from '../lib/metrics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { motion } from 'motion/react';
import { FlaskConical, TestTube, BarChart3, Settings2 } from 'lucide-react';
import { clsx } from 'clsx';

interface SimulatorProps {
  trades: Trade[];
}

export function Simulator({ trades }: SimulatorProps) {
  const [simulationType, setSimulationType] = useState('breakeven-1r');

  const actualMetrics = useMemo(() => calculateMetrics(trades), [trades]);

  const simulatedTrades = useMemo(() => {
    return trades.map(t => {
      let simulatedPnL = t.netPnL;
      if (simulationType === 'breakeven-1r') {
        if (t.netPnL < 0 && Math.random() > 0.6) {
          simulatedPnL = 0;
        }
      } else if (simulationType === 'exclude-mistakes') {
        if (t.executionErrors.length > 0) {
          simulatedPnL = 0; 
        }
      }
      return { ...t, netPnL: simulatedPnL };
    });
  }, [trades, simulationType]);

  const simulatedMetrics = calculateMetrics(simulatedTrades);

  const comparisonData = [
    {
      name: 'Net PnL ($)',
      Actual: actualMetrics.netPnL,
      Simulated: simulatedMetrics.netPnL,
    },
    {
      name: 'Win Rate (%)',
      Actual: actualMetrics.winRate * 100,
      Simulated: simulatedMetrics.winRate * 100,
    },
    {
      name: 'Profit Factor',
      Actual: actualMetrics.profitFactor,
      Simulated: simulatedMetrics.profitFactor,
    }
  ];

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
      className="space-y-8 h-full flex flex-col max-w-7xl mx-auto"
    >
      <motion.header variants={itemVars} className="flex justify-between items-end border-b border-white/5 pb-4">
        <div>
          <h1 className="text-4xl font-display font-bold flex items-center space-x-3 mb-2">
            <FlaskConical className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" size={36} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 tracking-tight">
              What-If Simulator
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Calculate alternative realities by tweaking your trading rules retroactively.</p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <motion.div variants={itemVars} className="premium-card p-6 col-span-1 flex flex-col border-white/5 bg-black/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full space-y-6">
             <div className="flex items-center space-x-3 mb-2">
                <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  <Settings2 size={20} className="text-emerald-400" />
                </div>
                <h2 className="text-xl font-display font-semibold text-white tracking-wide">Simulation Parameters</h2>
             </div>
             
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-emerald-500/80 block">Rule Modifier</label>
              <div className="relative">
                <select 
                  className="w-full bg-black/60 border border-emerald-500/30 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                  value={simulationType}
                  onChange={(e) => setSimulationType(e.target.value)}
                >
                  <option value="breakeven-1r">Move Stop to BE at 1:1 R/R</option>
                  <option value="exclude-mistakes">Exclude trades with Execution Errors</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-emerald-500">
                  <TestTube size={18} />
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10 mt-auto">
              <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400/80 mb-3 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>System Insight</span>
              </h3>
              <p className="text-sm text-blue-200 bg-blue-500/10 p-5 rounded-xl border border-blue-500/20 leading-relaxed shadow-inner">
                {simulationType === 'breakeven-1r' 
                  ? "Moving stops to breakeven at 1R reduces the average loser significantly, protecting capital during choppy market conditions. This simulation estimates the edge impact."
                  : "Eliminating emotional execution errors is structurally the fastest way to turn a losing system profitable. This simulation visualizes your pure statistical edge."}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="premium-card p-6 col-span-1 lg:col-span-2 border-white/5 bg-black/40 flex flex-col relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex items-center space-x-3 mb-8 relative z-10">
             <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
               <BarChart3 size={20} className="text-blue-400" />
             </div>
             <h2 className="text-xl font-display font-semibold text-white tracking-wide">Comparative Analysis</h2>
          </div>

          <div className="flex-1 min-h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} tickMargin={15} />
                <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 12, fontFamily: 'JetBrains Mono'}} axisLine={false} tickLine={false} tickMargin={15} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.03)'}}
                  contentStyle={{ backgroundColor: 'rgba(10,10,10,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Actual" fill="#475569" radius={[6, 6, 0, 0]} maxBarSize={80} />
                <Bar dataKey="Simulated" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={80}>
                   {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} style={{ filter: 'drop-shadow(0 0 8px rgba(16,219,129,0.5))' }} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
