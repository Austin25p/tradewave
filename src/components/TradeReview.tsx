import React, { useState, useMemo, useEffect } from 'react';
import { Trade } from '../lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, addMonths, subMonths, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calculator as CalcIcon, Target, CalendarDays, BarChart2, Hash, FileText, ArrowUpRight, ArrowDownRight, Save, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { useHaptic } from '../lib/haptic';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface TradeReviewProps {
  trades: Trade[];
  onUpdateTrade?: (trade: Trade) => void;
  onDeleteTrade?: (tradeId: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 text-sm justify-start items-center">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={clsx('p-1.5 rounded transition-colors', editor.isActive('bold') ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 dark:text-gray-400')}><Bold size={14} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={clsx('p-1.5 rounded transition-colors', editor.isActive('italic') ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 dark:text-gray-400')}><Italic size={14} /></button>
      <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/10 mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={clsx('p-1.5 rounded transition-colors', editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 dark:text-gray-400')}><List size={14} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={clsx('p-1.5 rounded transition-colors', editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 dark:text-gray-400')}><ListOrdered size={14} /></button>
    </div>
  )
}

const TiptapEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
    editorProps: {
      attributes: { class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4 text-gray-800 dark:text-gray-200' }
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) { editor.commands.setContent(value); }
  }, [value, editor]);

  return (
    <div className="flex flex-col border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 rounded-xl overflow-hidden shadow-sm w-full">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export function TradeReview({ trades, onUpdateTrade, onDeleteTrade }: TradeReviewProps) {
  const haptic = useHaptic();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Start with today as selected date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyNote, setDailyNote] = useState<string>('');

  const firstDay = startOfMonth(currentMonth);
  const lastDay = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startingDayIndex = getDay(firstDay);
  const paddingDays = Array.from({ length: startingDayIndex }).map((_, i) => i);

  // Group trades by date string 'yyyy-MM-dd'
  const tradesByDate = useMemo(() => {
    const map = new Map<string, Trade[]>();
    trades.forEach(t => {
      const dateStr = format(new Date(t.exitDate), 'yyyy-MM-dd');
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(t);
    });
    return map;
  }, [trades]);

  const monthTrades = useMemo(() => {
    return trades.filter(t => isSameMonth(new Date(t.exitDate), currentMonth));
  }, [trades, currentMonth]);

  const monthStats = useMemo(() => {
    const total = monthTrades.length;
    const wins = monthTrades.filter(t => t.netPnL > 0).length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const netPnL = monthTrades.reduce((sum, t) => sum + t.netPnL, 0);
    const profitFactor = (() => {
       const grossWin = monthTrades.filter(t => t.netPnL > 0).reduce((sum, t) => sum + t.netPnL, 0);
       const grossLoss = monthTrades.filter(t => t.netPnL < 0).reduce((sum, t) => sum + Math.abs(t.netPnL), 0);
       return grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
    })();
    return { total, winRate, netPnL, profitFactor };
  }, [monthTrades]);

  // Handle selected day trades & notes
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayTrades = tradesByDate.get(selectedDateStr) || [];
  const selectedDayPnL = selectedDayTrades.reduce((sum, t) => sum + t.netPnL, 0);

  // Load/Save notes to localStorage for now to provide persistence for daily notes standalone mechanism
  useEffect(() => {
    const stored = localStorage.getItem(`dailyNote_${selectedDateStr}`);
    setDailyNote(stored || '');
  }, [selectedDateStr]);

  const handleSaveNote = () => {
    haptic('light');
    localStorage.setItem(`dailyNote_${selectedDateStr}`, dailyNote);
  };

  const getDayColor = (pnl: number, tradeCount: number) => {
    if (tradeCount === 0) return 'bg-white/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5';
    if (pnl > 0) return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    if (pnl < 0) return 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
    return 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10';
  };

  return (
    <div className="h-full flex flex-col font-sans space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center space-x-2">
            <CalendarDays className="text-blue-500" size={24} />
            <span>Trade Journal</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daily overview, performance metrics, and focused journaling.</p>
        </div>

        <div className="flex items-center space-x-4 bg-white dark:bg-[#151516] p-1.5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
           <button onClick={() => { haptic('light'); setCurrentMonth(subMonths(currentMonth, 1)); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-600 dark:text-gray-400 transition-colors">
             <ChevronLeft size={18} />
           </button>
           <div className="w-[140px] text-center font-bold text-gray-900 dark:text-white text-sm tracking-wide">
             {format(currentMonth, 'MMMM yyyy')}
           </div>
           <button onClick={() => { haptic('light'); setCurrentMonth(addMonths(currentMonth, 1)); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-600 dark:text-gray-400 transition-colors">
             <ChevronRight size={18} />
           </button>
        </div>
      </header>

      {/* Overview Stats for the Month */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#151516] p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Net PnL</p>
            <p className={clsx("text-2xl font-display font-bold", monthStats.netPnL >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {monthStats.netPnL >= 0 ? '+' : ''}${monthStats.netPnL.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500"><BarChart2 size={20} /></div>
        </div>
        <div className="bg-white dark:bg-[#151516] p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Win Rate</p>
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{monthStats.winRate.toFixed(1)}%</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Target size={20} /></div>
        </div>
        <div className="bg-white dark:bg-[#151516] p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Profit Factor</p>
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{monthStats.profitFactor.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500"><CalcIcon size={20} /></div>
        </div>
        <div className="bg-white dark:bg-[#151516] p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Total Trades</p>
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">{monthStats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500"><Hash size={20} /></div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-[600px] mb-8">
        
        {/* Calendar View */}
        <div className="xl:col-span-2 bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-4 md:p-6 flex flex-col">
          <div className="grid grid-cols-7 gap-2 md:gap-3 mb-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-right text-[10px] md:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-3 flex-1">
            {Array.from({ length: startingDayIndex === 0 ? 6 : startingDayIndex - 1 }).map((_, i) => (
              <div key={"padding-" + i} className="rounded-xl border border-dashed border-gray-100 dark:border-white/5 bg-transparent opacity-50 min-h-[70px] md:min-h-[100px]" />
            ))}
            
            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTrades = tradesByDate.get(dateStr) || [];
              const dayPnL = dayTrades.reduce((sum, t) => sum + t.netPnL, 0);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              
              return (
                <div 
                  key={dateStr}
                  onClick={() => { haptic('light'); setSelectedDate(day); }}
                  className={clsx(
                    'rounded-xl border p-2 flex flex-col min-h-[70px] md:min-h-[100px] transition-all cursor-pointer group shadow-sm',
                    getDayColor(dayPnL, dayTrades.length),
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#f7f9ff] dark:ring-offset-[#151516] scale-105 z-10' : 'hover:scale-[1.02]',
                    !isSameMonth(day, currentMonth) && 'opacity-40'
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={clsx("text-[11px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full", isTodayDate ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "text-gray-600 dark:text-gray-400")}>
                      {format(day, 'd')}
                    </span>
                    {dayTrades.length > 0 && (
                      <span className="text-[9px] md:text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-black/20 px-1.5 py-0.5 rounded-full border border-gray-100 dark:border-white/5 shadow-sm">
                        {dayTrades.length} <span className="hidden md:inline">trades</span>
                      </span>
                    )}
                  </div>
                  
                  {dayTrades.length > 0 && (
                    <div className="mt-auto flex flex-col items-end">
                      <span className={clsx("text-xs md:text-sm font-bold font-mono tracking-tight", dayPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        {dayPnL >= 0 ? '+' : ''}${Math.abs(dayPnL).toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="xl:col-span-1 bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-5 flex flex-col overflow-hidden max-h-[1000px] xl:max-h-[calc(100vh-140px)]">
           <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
              <div>
                 <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                   <span>{format(selectedDate, 'EEEE, d MMMM')}</span>
                 </h2>
                 <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono tracking-widest uppercase font-bold">
                   {selectedDayTrades.length} Trades Completed
                 </p>
              </div>
              <div className="text-right">
                 <p className={clsx("text-2xl font-display font-bold drop-shadow-sm", selectedDayPnL > 0 ? "text-emerald-500" : selectedDayPnL < 0 ? "text-rose-500" : "text-gray-400")}>
                   {selectedDayPnL >= 0 && selectedDayPnL !== 0 ? '+' : ''}${selectedDayPnL.toFixed(2)}
                 </p>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1 pb-4">
              {/* Daily Journal Note */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center">
                       <FileText size={14} className="mr-1.5" /> Daily Note
                    </h3>
                    <button 
                      onClick={handleSaveNote}
                      className="text-[10px] font-bold tracking-widest text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                       SAVE NOTE
                    </button>
                 </div>
                 
                 <TiptapEditor value={dailyNote} onChange={setDailyNote} />
              </div>

              {/* Day's Trades */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                 <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                    Execution Log
                 </h3>

                 {selectedDayTrades.length === 0 ? (
                   <div className="bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-6 text-center text-gray-400">
                      <p className="text-sm font-medium">No executions recorded on this day.</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {selectedDayTrades.map(trade => (
                       <div key={trade.id} className="bg-white dark:bg-[#1A1A1B] border border-gray-200 dark:border-white/5 rounded-xl p-3 hover:border-blue-400/50 shadow-sm transition-colors group cursor-pointer">
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center space-x-2">
                                <span className={clsx("flex items-center justify-center p-1 rounded-md", trade.direction === 'Long' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" : "bg-rose-50 dark:bg-rose-500/10 text-rose-500")}>
                                  {trade.direction === 'Long' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">{trade.symbol}</span>
                             </div>
                             <span className={clsx("font-mono font-bold text-sm", trade.netPnL >= 0 ? "text-emerald-500" : "text-rose-500")}>
                               {trade.netPnL >= 0 ? '+' : ''}${trade.netPnL.toFixed(2)}
                             </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[11px] mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                             <span className="text-gray-500 dark:text-gray-400 font-mono font-medium">
                                {format(new Date(trade.entryDate), 'HH:mm')} - {format(new Date(trade.exitDate), 'HH:mm')}
                             </span>
                             <span className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-bold max-w-[120px] truncate uppercase tracking-wider text-[9px]">
                                {trade.setup || 'No Setup'}
                             </span>
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
