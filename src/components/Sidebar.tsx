import { LayoutDashboard, Calendar, Search, Lightbulb, PlaySquare, Settings, LogOut, Calculator as CalcIcon, LineChart, Globe, Target, Award, Moon, Sun, Activity, Newspaper, ListTodo } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { logoutUser } from '../lib/firebase';

export type View = 'dashboard' | 'markets' | 'market-news' | 'sessions' | 'prop-firm' | 'strategy-analytics' | 'calendar' | 'trade-review' | 'simulator' | 'replay' | 'calculator' | 'ai-coach' | 'settings' | 'activity-log' | 'tasks';

interface SidebarProps {
  currentView: View;
  onSetView: (view: View) => void;
}

export function Sidebar({ currentView, onSetView }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'strategy-analytics', label: 'Strategy Analytics', icon: Award },
    { id: 'prop-firm', label: 'Prop Firm Tracker', icon: Target },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'markets', label: 'Live Markets', icon: LineChart },
    { id: 'market-news', label: 'Market News', icon: Newspaper },
    { id: 'sessions', label: 'Market Sessions', icon: Globe },
    { id: 'calendar', label: 'Daily Calendar', icon: Calendar },
    { id: 'trade-review', label: 'Trade Review', icon: Search },
    { id: 'activity-log', label: 'Activity History', icon: Activity },
    { id: 'replay', label: 'Replay Backtest', icon: PlaySquare },
    { id: 'simulator', label: 'What-If Simulator', icon: PlaySquare },
    { id: 'calculator', label: 'Lot Calculator', icon: CalcIcon },
    { id: 'ai-coach', label: 'AI Coach', icon: Lightbulb },
  ] as const;

  return (
    <aside className="w-[260px] bg-[#0A0A0B]/80 backdrop-blur-3xl border-r border-white-[0.04] hidden md:flex flex-col flex-shrink-0 relative z-10 sticky top-0 h-screen shadow-[1px_0_5px_rgba(0,0,0,0.2)]">
      <div className="p-6 pt-8 flex items-center space-x-3 mb-2">
        <div className="relative flex shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-[0_2px_10px_rgba(59,130,246,0.3)] ring-1 ring-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 7v6M21 7h-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-white antialiased">
          Tradewave
        </span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto overflow-x-hidden pb-4 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSetView(item.id)}
              className="relative w-full group outline-none text-left"
            >
              <div 
                className={clsx(
                  'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-[13px] tracking-wide relative',
                  isActive 
                    ? 'text-white bg-white/10 shadow-sm border border-white/5' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={clsx("relative z-10 transition-colors duration-200", isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300")}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="relative z-10">{item.label}</span>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-1">
        <button onClick={toggleTheme} className="group flex items-center space-x-3 px-3 py-2 w-full text-[13px] font-medium rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors duration-200 outline-none">
          {theme === 'dark' ? <Sun size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" /> : <Moon size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={() => onSetView('settings')} className={clsx("group flex items-center space-x-3 px-3 py-2 w-full text-[13px] font-medium rounded-lg transition-colors duration-200 outline-none", currentView === 'settings' ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5')}>
          <Settings size={18} className={clsx("transition-colors", currentView === 'settings' ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300')} />
          <span>Settings</span>
        </button>
        <button onClick={logoutUser} className="group flex items-center space-x-3 px-3 py-2 w-full text-[13px] font-medium rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 outline-none mt-1">
          <LogOut size={18} className="text-red-400/70 group-hover:text-red-400 transition-colors" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
