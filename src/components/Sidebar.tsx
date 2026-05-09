import { LayoutDashboard, Calendar, Search, Lightbulb, PlaySquare, Settings, LogOut, Calculator as CalcIcon, LineChart, Globe, Target, Award, Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { logoutUser } from '../lib/firebase';

export type View = 'dashboard' | 'markets' | 'sessions' | 'prop-firm' | 'golden-bullet' | 'calendar' | 'trade-review' | 'simulator' | 'calculator' | 'ai-coach';

interface SidebarProps {
  currentView: View;
  onSetView: (view: View) => void;
}

export function Sidebar({ currentView, onSetView }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'golden-bullet', label: 'Golden Bullet Tracker', icon: Award },
    { id: 'prop-firm', label: 'Prop Firm Tracker', icon: Target },
    { id: 'markets', label: 'Live Markets', icon: LineChart },
    { id: 'sessions', label: 'Market Sessions', icon: Globe },
    { id: 'calendar', label: 'Daily Calendar', icon: Calendar },
    { id: 'trade-review', label: 'Trade Review', icon: Search },
    { id: 'simulator', label: 'What-If Simulator', icon: PlaySquare },
    { id: 'calculator', label: 'Lot Calculator', icon: CalcIcon },
    { id: 'ai-coach', label: 'AI Coach', icon: Lightbulb },
  ] as const;

  return (
    <aside className="w-68 glass-panel border-y-0 border-l-0 rounded-l-none rounded-r-3xl hidden md:flex flex-col flex-shrink-0 relative z-10 sticky top-0 h-screen shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="p-8 pt-10 font-display font-bold text-3xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-float opacity-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] flex justify-between items-center">
        <span>Nexus</span>
      </div>
      
      <nav className="flex-1 px-5 space-y-1.5 mt-2 overflow-y-auto overflow-x-hidden pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <motion.button
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.95 }}
              key={item.id}
              onClick={() => onSetView(item.id)}
              className="relative w-full group outline-none"
            >
              <div 
                className={clsx(
                  'w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium text-sm z-10 relative overflow-hidden',
                  isActive 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-gray-100'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <div className={clsx("relative z-10 transition-transform duration-300", isActive ? "scale-110 text-blue-400" : "group-hover:scale-110")}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="relative z-10 tracking-wide">{item.label}</span>
              </div>
            </motion.button>
          )
        })}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-2">
        <button onClick={toggleTheme} className="group flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-gray-200 w-full text-sm font-medium rounded-2xl hover:bg-white/5 transition-all">
          {theme === 'dark' ? <Sun size={20} className="group-hover:rotate-180 transition-transform duration-500" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button className="group flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-gray-200 w-full text-sm font-medium rounded-2xl hover:bg-white/5 transition-all">
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          <span>Settings</span>
        </button>
        <button onClick={logoutUser} className="group flex items-center space-x-3 px-4 py-3 text-red-500/80 hover:text-red-400 w-full text-sm font-medium rounded-2xl hover:bg-red-500/10 transition-all">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
