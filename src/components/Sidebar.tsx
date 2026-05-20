import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Search, Lightbulb, PlaySquare, Calculator as CalcIcon, LineChart, Globe, Target, Award, Activity, Newspaper, ListTodo, ChevronRight, ChevronDown, BookOpen, Clock, Bot, Repeat } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { useHaptic } from '../lib/haptic';

export type View = 'dashboard' | 'markets' | 'market-news' | 'sessions' | 'prop-firm' | 'strategy-analytics' | 'calendar' | 'trade-review' | 'simulator' | 'replay' | 'calculator' | 'ai-coach' | 'settings' | 'activity-log' | 'tasks';

interface SidebarProps {
  currentView: View;
  onSetView: (view: View) => void;
  isOpen: boolean;
}

export function Sidebar({ currentView, onSetView, isOpen }: SidebarProps) {
  const haptic = useHaptic();
  
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard', 'journal', 'tools', 'ai']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const menuSections = [
    {
      id: 'dashboard',
      label: 'Performance',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'strategy-analytics', label: 'Strategy Analytics', icon: Award },
        { id: 'activity-log', label: 'Activity History', icon: Activity },
      ]
    },
    {
      id: 'journal',
      label: 'Journal & Tracking',
      items: [
        { id: 'trade-review', label: 'Trade Journal', icon: BookOpen },
        { id: 'calendar', label: 'Daily Calendar', icon: Calendar },
        { id: 'prop-firm', label: 'Prop Firm Tracker', icon: Target },
        { id: 'tasks', label: 'Tasks Manager', icon: ListTodo },
      ]
    },
    {
      id: 'tools',
      label: 'Markets & Tools',
      items: [
        { id: 'sessions', label: 'Market Sessions', icon: Globe },
        { id: 'markets', label: 'Live Markets', icon: LineChart },
        { id: 'market-news', label: 'Market News', icon: Newspaper },
        { id: 'calculator', label: 'Calculators', icon: CalcIcon },
        { id: 'simulator', label: 'What-If Simulator', icon: Repeat },
        { id: 'replay', label: 'Replay Backtest', icon: PlaySquare },
      ]
    },
    {
      id: 'ai',
      label: 'AI Features',
      items: [
        { id: 'ai-coach', label: 'AI Coach', icon: Bot },
      ]
    }
  ] as const;

  const handleNavClick = (id: View) => {
    haptic('light');
    onSetView(id);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-[260px] bg-[#f7f9ff] dark:bg-[#0A0A0B] border-r border-[#dcdfe3] dark:border-white/5 hidden md:flex flex-col flex-shrink-0 relative z-40 h-screen transition-transform duration-300">
      <div className="h-16 flex-shrink-0" /> {/* Spacer for TopBar */}
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuSections.map((section) => (
          <div key={section.id} className="mb-4">
            <div 
              className="flex items-center justify-between px-3 mb-1 cursor-pointer group"
              onClick={() => toggleSection(section.id)}
            >
              <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                {section.label}
              </h4>
              <div className="text-gray-400">
                {expandedSections.includes(section.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
            
            <AnimatePresence initial={false}>
              {expandedSections.includes(section.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-0.5 overflow-hidden"
                >
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id as View)}
                        className="relative w-full group outline-none text-left"
                      >
                        <div 
                          className={clsx(
                            'w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-[13px] relative',
                            isActive 
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 shadow-sm' 
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                          )}
                        >
                          <div className={clsx("relative z-10 transition-colors duration-200", isActive ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")}>
                            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                          </div>
                          <span className="relative z-10">{item.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>
    </aside>
  );
}
