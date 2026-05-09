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
import { PropFirmTracker } from './components/PropFirmTracker';
import { GoldenBulletAnalytics } from './components/GoldenBulletAnalytics';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Login } from './components/Login';
import { useAuth } from './components/AuthProvider';
import { logoutUser } from './lib/firebase';
import { INITIAL_TRADES, INITIAL_SENTIMENTS } from './lib/store';
import { Trade } from './lib/types';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './components/ThemeProvider';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trades, setTrades] = useState<Trade[]>(INITIAL_TRADES);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const sentiments = INITIAL_SENTIMENTS;

  if (!user) {
    return <Login />;
  }

  const handleImport = (newTrades: Trade[]) => {
    setTrades(prev => [...prev, ...newTrades]);
  };

  const handleAddTrade = (trade: Trade) => {
    setTrades(prev => [...prev, trade]);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen mesh-bg flex overflow-hidden font-sans text-gray-100 selection:bg-blue-500/30">
      <AnimatedBackground />
      <Sidebar currentView={currentView} onSetView={setCurrentView} />

      {/* Mobile nav header */}
      <div className="md:hidden fixed top-0 w-full bg-gray-950/80 backdrop-blur-md z-50 border-b border-white/5 p-4 flex justify-between items-center shadow-lg">
        <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
          Nexus
        </span>
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
            className="md:hidden fixed inset-0 z-40 bg-gray-950/95 backdrop-blur-xl pt-20 px-4"
          >
             <div className="flex flex-col space-y-2">
               {['dashboard', 'golden-bullet', 'markets', 'sessions', 'prop-firm', 'calendar', 'trade-review', 'simulator', 'calculator', 'ai-coach'].map((view) => (
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
              {currentView === 'sessions' && <MarketSessions />}
              {currentView === 'prop-firm' && <PropFirmTracker trades={trades} onAddTrade={handleAddTrade} onUpdateTrade={handleUpdateTrade} onDeleteTrade={handleDeleteTrade} />}
              {currentView === 'golden-bullet' && <GoldenBulletAnalytics trades={trades} onUpdateTrade={handleUpdateTrade} />}
              {currentView === 'calendar' && <PerformanceCalendar trades={trades} sentiments={sentiments} />}
              {currentView === 'trade-review' && <TradeReview trades={trades} onUpdateTrade={handleUpdateTrade} />}
              {currentView === 'simulator' && <Simulator trades={trades} />}
              {currentView === 'calculator' && <Calculator />}
              {currentView === 'ai-coach' && <AICoach trades={trades} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
