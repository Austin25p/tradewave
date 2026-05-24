import React, { useState, useEffect } from 'react';
import { Sidebar, View } from './components/Sidebar';
import { TopBar } from './components/Topbar';
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
import { Settings } from './components/Settings';
import { ActivityLog } from './components/ActivityLog';
import { TasksManager } from './components/TasksManager';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Login } from './components/Login';
import { BacktestReplay } from './components/BacktestReplay';
import { SMCDashboard } from './components/SMCDashboard';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from './components/AuthProvider';
import { useFirestore } from './lib/useFirestore';
import { Trade } from './lib/types';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './components/ThemeProvider';
import { useHaptic } from './lib/haptic';
import { audioSystem } from './lib/audio';
import { Onboarding } from './components/Onboarding';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDrawdown] = useState(5.2);
  const [drawdownThreshold] = useState(5.0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useHaptic();
  
  const { trades, sentiments, tasks, loading, addTrade, updateTrade, deleteTrade, addTask, updateTask, deleteTask } = useFirestore();

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element) {
        const interactive = target.closest('button, a, input, select, [role="button"], .interactive');
        if (interactive && !interactive.closest('[data-no-global-sound]')) {
          audioSystem.play('click_light');
        }
      }
    };
    
    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, []);

  if (!user) {
    return <Login />;
  }

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 relative z-10" />
        </div>
        <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 font-mono text-sm tracking-widest uppercase animate-pulse">Loading Workspace</p>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  const handleImport = (newTrades: Trade[]) => {
    haptic('medium');
    newTrades.forEach(t => addTrade(t));
  };

  const handleAddTrade = (trade: Trade) => {
    haptic('light');
    addTrade(trade);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    haptic('light');
    updateTrade(updatedTrade);
  };

  const handleDeleteTrade = (id: string) => {
    haptic('medium');
    deleteTrade(id);
  };

  const toggleSidebar = () => {
    // Determine screen size to adjust the right state
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };


  return (
    <div className="min-h-screen bg-[#eff4f9] dark:bg-[#030611] flex overflow-hidden font-sans text-gray-900 dark:text-gray-100 selection:bg-blue-500/30">
      <AnimatedBackground />
      
      <div className="print:hidden">
        <TopBar 
          onMenuToggle={toggleSidebar} 
          isMobileMenuOpen={isMobileMenuOpen} 
          onSetView={setCurrentView}
        />
      </div>

      <div className="print:hidden">
        <Sidebar currentView={currentView} onSetView={setCurrentView} isOpen={isSidebarOpen} />
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-y-0 left-0 z-40 bg-white/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xl pt-16 px-4 w-[260px] border-r border-[#dcdfe3] dark:border-white/5 overflow-y-auto pb-6"
          >
             <div className="flex flex-col space-y-2 mt-4">
               {/* Mock Drawdown for Mobile Sidebar */}
               {currentDrawdown > drawdownThreshold && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="mb-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl relative overflow-hidden"
                 >
                   <div className="absolute top-0 right-0 p-2 opacity-10">
                     <AlertTriangle size={32} />
                   </div>
                   <div className="flex items-center gap-2 mb-1 relative z-10">
                     <AlertTriangle size={14} className="text-red-500" />
                     <span className="text-xs font-bold text-red-600 dark:text-red-400">Drawdown Warning</span>
                   </div>
                   <p className="text-[11px] text-red-600/90 dark:text-red-400/90 font-medium relative z-10">
                     Session drawdown ({currentDrawdown}%) exceeds limit ({drawdownThreshold}%).
                   </p>
                 </motion.div>
               )}
               {['dashboard', 'tasks', 'strategy-analytics', 'markets', 'market-news', 'whale-algo', 'sessions', 'prop-firm', 'calendar', 'trade-review', 'activity-log', 'replay', 'simulator', 'calculator', 'ai-coach', 'settings'].map((view) => (
                 <button 
                  key={view}
                  onClick={() => {
                    setCurrentView(view as View);
                    setIsMobileMenuOpen(false);
                  }}
                  className={"px-4 py-3 text-left rounded-xl transition-all duration-300 " + (currentView === view ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5')}
                 >
                   <span className="text-[14px]">
                     {view.charAt(0).toUpperCase() + view.slice(1).replace('-', ' ')}
                   </span>
                 </button>
               ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-30 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden pt-16 relative scroll-smooth focus:outline-none custom-scrollbar">
        <div className="mx-auto w-full min-h-full flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 w-full"
            >
              {currentView === 'dashboard' && <Dashboard trades={trades} onImport={handleImport} onSetView={setCurrentView} />}
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
              {currentView === 'whale-algo' && <SMCDashboard />}
              {currentView === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
