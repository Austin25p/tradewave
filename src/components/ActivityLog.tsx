import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ArrowRight, Target, DollarSign, Calendar as CalIcon, Settings as SettingsIcon, Shield, CheckCircle, PlaySquare } from 'lucide-react';
import { Trade } from '../lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { useAuth } from './AuthProvider';

interface ActivityLogProps {
  trades: Trade[];
}

interface ActivityEvent {
  id: string;
  type: 'trade_added' | 'trade_updated' | 'login' | 'settings_changed';
  timestamp: string;
  description: string;
  details?: string;
  icon: React.ElementType;
  color: string;
}

export function ActivityLog({ trades }: ActivityLogProps) {
  const { user } = useAuth();
  const [filter, setFilter] = React.useState<'all' | 'winning' | 'losing'>('all');
  
  // Synthesize activity history based on trades (since we don't have a real activity feed backend yet)
  const activities = useMemo(() => {
    let events: ActivityEvent[] = [];
    
    // Add artificial login event
    if (filter === 'all') {
      events.push({
        id: 'login-latest',
        type: 'login',
        timestamp: new Date().toISOString(),
        description: 'Logged in successfully',
        details: user?.email || 'User',
        icon: Shield,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
      });
    }

    // Add trades as events
    trades.forEach(trade => {
      if (filter === 'winning' && trade.netPnL < 0) return;
      if (filter === 'losing' && trade.netPnL >= 0) return;

      events.push({
        id: `trade-${trade.id}`,
        type: 'trade_added',
        timestamp: trade.exitDate, // Using exitDate as the event time for simplicity
        description: `Closed ${trade.type} trade on ${trade.symbol}`,
        details: `PnL: $${trade.netPnL.toFixed(2)} | Target: ${trade.targetHit ? 'Hit' : 'Missed'}`,
        icon: trade.netPnL >= 0 ? CheckCircle : Target,
        color: trade.netPnL >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
      });
    });

    // Sort by timestamp descending
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [trades, user, filter]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center space-x-3 mb-8">
        <Activity className="text-purple-400" size={32} />
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Activity Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor recent actions, trades, and account events in real-time</p>
        </div>
      </div>

      <div className="premium-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-white/5 pb-4">
          <h2 className="text-lg font-display font-medium text-white mb-4 sm:mb-0">Recent Activity</h2>
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 w-fit">
            <button
              onClick={() => setFilter('all')}
              className={clsx("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'all' ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-300")}
            >
              All
            </button>
            <button
              onClick={() => setFilter('winning')}
              className={clsx("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'winning' ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-emerald-400/70")}
            >
              Winning
            </button>
            <button
              onClick={() => setFilter('losing')}
              className={clsx("px-3 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'losing' ? "bg-red-500/20 text-red-400" : "text-gray-400 hover:text-red-400/70")}
            >
              Losing
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
           {activities.length === 0 ? (
             <div className="text-center py-10 text-gray-500">
               <Activity size={48} className="mx-auto mb-4 opacity-20" />
               <p>No activity recorded yet.</p>
             </div>
           ) : (
             <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
               {activities.map((event, index) => (
                 <motion.div 
                   key={event.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: index * 0.05 }}
                   className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8"
                 >
                   {/* Icon */}
                   <div className={clsx("flex items-center justify-center w-10 h-10 rounded-full border bg-gray-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10", event.color)}>
                     <event.icon size={16} />
                   </div>
                   
                   {/* Card */}
                   <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-[1.25rem] bg-gray-900/50 border border-white/5 backdrop-blur-md shadow-lg group-hover:bg-white/[0.02] transition-colors">
                     <div className="flex items-center justify-between mb-1">
                       <h3 className="font-medium text-white text-sm">{event.description}</h3>
                       <time className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</time>
                     </div>
                     <p className="text-gray-400 text-xs mt-2">{event.details}</p>
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}
