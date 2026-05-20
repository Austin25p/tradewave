import React, { useState } from 'react';
import { Trade } from '../lib/types';
import { generateWeeklySummary } from '../lib/gemini';
import { Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface AICoachProps {
  trades: Trade[];
}

export function AICoach({ trades }: AICoachProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const result = await generateWeeklySummary(trades);
    setSummary(result);
    setLoading(false);
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
      className="space-y-8 max-w-5xl mx-auto min-h-[600px] flex flex-col"
    >
      <motion.header variants={itemVars} className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-gray-100 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-4xl font-display font-bold flex items-center space-x-3 mb-2">
            <BrainCircuit className="text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.6)]" size={36} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight">
              AI Trading Coach
            </span>
          </h1>
          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-lg">Deep-learning structural analysis of your execution patterns.</p>
        </div>
        <button 
          onClick={generate}
          disabled={loading}
          className="glass-button relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-center space-x-2 text-gray-900 dark:text-white font-bold tracking-wide">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            <span>{loading ? 'Synthesizing Neural Insight...' : 'Initialize Analysis'}</span>
          </div>
        </button>
      </motion.header>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex-1 premium-card flex flex-col items-center justify-center p-12 border-gray-100 dark:border-white/5 bg-white/60 dark:bg-black/40 backdrop-blur-md min-h-[400px]"
        >
           <div className="relative mb-8">
             <div className="w-24 h-24 rounded-full border-t-4 border-indigo-500 border-opacity-50 animate-spin absolute inset-0 mix-blend-screen" />
             <div className="w-24 h-24 rounded-full border-r-4 border-purple-500 border-opacity-50 animate-[spin_1.5s_linear_infinite_reverse] absolute inset-0 mix-blend-screen" />
             <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
               <BrainCircuit className="w-10 h-10 text-indigo-400 animate-pulse" />
             </div>
           </div>
           <h3 className="text-xl font-display text-indigo-300 font-bold tracking-widest uppercase mb-2 animate-pulse">Running Neural Models</h3>
           <p className="text-gray-400 dark:text-gray-500 font-mono text-sm max-w-sm text-center">Cross-referencing {trades.length} structural executions against historical probability matrix...</p>
        </motion.div>
      ) : summary ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 premium-card p-8 md:p-12 relative overflow-hidden border-gray-200 dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-white/60 dark:bg-black/40 backdrop-blur-md"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(139,92,246,0.8)]"></div>
          
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="prose prose-invert prose-lg max-w-none relative z-10 
            prose-p:text-gray-600 dark:text-gray-300 prose-p:leading-relaxed 
            prose-headings:text-gray-900 dark:text-white prose-headings:font-display prose-headings:tracking-tight 
            prose-strong:text-indigo-300 prose-strong:font-bold
            prose-li:text-gray-600 dark:text-gray-300 prose-li:marker:text-purple-500
            prose-hr:border-gray-200 dark:border-white/10 prose-hr:my-8
            prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:text-indigo-200">
            <Markdown>{summary}</Markdown>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          variants={itemVars} 
          className="flex-1 premium-card p-12 text-center flex flex-col items-center justify-center border-gray-100 dark:border-white/5 bg-black/20 min-h-[400px]"
        >
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl rotate-12 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(99,102,241,0.15)] border border-indigo-500/20">
            <BrainCircuit className="text-indigo-400 -rotate-12" size={40} />
          </div>
          <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3 tracking-wide">Ready for Neural Insight?</h3>
          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed mb-8">
            Initialize the AI to run structural pattern recognition on your {trades.length} recorded trades. Discover hidden edge erosion and optimize your psychological bandwidth.
          </p>
          <button 
            onClick={generate}
            className="glass-button !px-8 !py-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none border-gray-200 dark:border-white/10 flex items-center space-x-3 group text-indigo-300 hover:text-indigo-200"
          >
             <Sparkles size={18} className="group-hover:animate-pulse" />
             <span className="font-bold tracking-widest uppercase text-sm">Initialize Analysis</span>
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
