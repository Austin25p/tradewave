import React, { useState } from 'react';
import { Sidebar, View } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PerformanceCalendar } from './components/Calendar';
import { Simulator } from './components/Simulator';
import { Calculator } from './components/Calculator';
import { AICoach } from './components/AICoach';
import { TradeReview } from './components/TradeReview';
import { Markets } from './components/Markets';
import { MarketSessions } from './components/MarketSessions';
import { MarketNews } from './components/MarketNews';
import { PropFirmTracker } from './components/PropFirmTracker';
import { StrategyAnalytics } from './components/StrategyAnalytics';
import { AdBanner } from './components/AdBanner';
import { HilltopAdsBanner } from './components/HilltopAdsBanner';
import { Settings } from './components/Settings';
import { ActivityLog } from './components/ActivityLog';
import { TasksManager } from './components/TasksManager';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Login } from './components/Login';
import { BacktestReplay } from './components/BacktestReplay';
import { useAuth } from './components/AuthProvider';
import { logoutUser } from './lib/firebase';
import { useFirestore } from './lib/useFirestore';
import { Trade } from './lib/types';
import { Menu, X, Sun, Moon, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './components/ThemeProvider';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  const { trades, sentiments, tasks, loading, addTrade, updateTrade, deleteTrade, addTask, updateTask, deleteTask } = useFirestore();

  if (!user) {
    return <Login />;
  }

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  const handleImport = (newTrades: Trade[]) => {
    newTrades.forEach(t => addTrade(t));
  };

  const handleAddTrade = (trade: Trade) => {
    addTrade(trade);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    updateTrade(updatedTrade);
  };

  const handleDeleteTrade = (id: string) => {
    deleteTrade(id);
  };

  return (
    <div className="min-h-screen mesh-bg flex overflow-hidden font-sans text-gray-100 selection:bg-blue-500/30">
      <AnimatedBackground />
      <Sidebar currentView={currentView} onSetView={setCurrentView} />

      {/* Mobile nav header */}
      <div className="md:hidden fixed top-0 w-full bg-gray-950/80 backdrop-blur-md z-50 border-b border-white/5 p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
            <rect x="4" y="16" width="4" height="12" rx="1" fill="#3B82F6" />
            <rect x="12" y="8" width="4" height="20" rx="1" fill="#6366F1" />
            <rect x="20" y="12" width="4" height="16" rx="1" fill="#8B5CF6" />
            <path d="M4 16L12 8L20 12L28 4" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="28" cy="4" r="3" fill="#60A5FA" />
          </svg>
          <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Tradewave
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className="text-gray-300 hover:text-white transition-colors">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={logoutUser} className="text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={20} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white transition-colors">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-gray-950/95 backdrop-blur-xl pt-20 px-4 overflow-y-auto pb-6"
          >
             <div className="flex flex-col space-y-2">
               {['dashboard', 'tasks', 'strategy-analytics', 'markets', 'market-news', 'sessions', 'prop-firm', 'calendar', 'trade-review', 'activity-log', 'replay', 'simulator', 'calculator', 'ai-coach', 'settings'].map((view) => (
                 <button 
                  key={view}
                  onClick={() => {
                    setCurrentView(view as View);
                    setIsMobileMenuOpen(false);
                  }}
                  className={"p-4 text-left rounded-xl transition-all duration-300 " + (currentView === view ? 'bg-blue-600/20 text-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-blue-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200')}
                 >
                   <span className="font-medium text-lg tracking-tight">
                     {view.charAt(0).toUpperCase() + view.slice(1).replace('-', ' ')}
                   </span>
                 </button>
               ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 h-screen overflow-y-auto p-4 pt-20 md:pt-8 md:p-8 relative scroll-smooth focus:outline-none">
        <div className="max-w-[1400px] mx-auto w-full h-full pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {currentView === 'dashboard' && <Dashboard trades={trades} onImport={handleImport} />}
              {currentView === 'markets' && <Markets />}
              {currentView === 'market-news' && <MarketNews />}
              {currentView === 'sessions' && <MarketSessions />}
              {currentView === 'prop-firm' && <PropFirmTracker trades={trades} onAddTrade={handleAddTrade} onUpdateTrade={handleUpdateTrade} onDeleteTrade={handleDeleteTrade} />}
              {currentView === 'strategy-analytics' && <StrategyAnalytics trades={trades} onUpdateTrade={handleUpdateTrade} />}
              {currentView === 'calendar' && <PerformanceCalendar trades={trades} sentiments={sentiments} />}
              {currentView === 'trade-review' && <TradeReview trades={trades} onUpdateTrade={handleUpdateTrade} />}
              {currentView === 'activity-log' && <ActivityLog trades={trades} />}
              {currentView === 'tasks' && <TasksManager tasks={tasks} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />}
              {currentView === 'replay' && <BacktestReplay />}
              {currentView === 'simulator' && <Simulator trades={trades} />}
              {currentView === 'calculator' && <Calculator />}
              {currentView === 'ai-coach' && <AICoach trades={trades} />}
              {currentView === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
          
          <div className="mt-8 space-y-4">
            <AdBanner />
            <HilltopAdsBanner />
          </div>
        </div>
      </main>
    </div>
  );
}
