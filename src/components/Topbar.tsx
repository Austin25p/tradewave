import React, { useState } from 'react';
import { Menu, X, Sun, Moon, Bell, Maximize, User, LogOut, Settings, Hexagon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';
import { logoutUser } from '../lib/firebase';
import { Logo } from './Logo';
import { View } from './Sidebar';

interface TopBarProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  onSetView: (view: View) => void;
}

export function TopBar({ onMenuToggle, isMobileMenuOpen, onSetView }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="fixed top-0 w-full bg-[#f7f9ff] dark:bg-[#0A0A0B] border-b border-[#dcdfe3] dark:border-white/5 h-[60px] flex justify-between items-center px-4 md:px-6 z-50">
      <div className="flex items-center space-x-4">
        <button onClick={onMenuToggle} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors outline-none cursor-pointer p-1">
          <Menu size={22} className="stroke-[1.5]" />
        </button>
        <div className="hidden sm:flex items-center">
          <Logo size={24} withText={true} />
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        <button className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-blue-200 dark:border-blue-500/30 shadow-sm">
          <Hexagon size={14} className="fill-blue-100 dark:fill-blue-500/20" />
          <span>Go Pro</span>
        </button>
        
        <button className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors hidden sm:block p-1">
          <span className="text-[15px]">🇬🇧</span>
        </button>

        <button className="relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors p-1">
          <Bell size={20} className="stroke-[1.5]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button onClick={toggleFullscreen} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors p-1 hidden sm:block">
          <Maximize size={20} className="stroke-[1.5]" />
        </button>

        <button onClick={toggleTheme} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors p-1 hidden sm:block">
          {theme === 'dark' ? <Sun size={20} className="stroke-[1.5]" /> : <Moon size={20} className="stroke-[1.5]" />}
        </button>

        <div className="relative border-l border-gray-200 dark:border-white/10 pl-4 ml-1">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-sm opacity-90 hover:opacity-100 transition-opacity">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#151516] rounded-xl shadow-xl border border-gray-100 dark:border-white/5 py-1 z-50 text-[13px] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-1">
                  <p className="text-gray-900 dark:text-white font-semibold truncate">{user?.displayName || 'Trader Account'}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs truncate mt-0.5">{user?.email}</p>
                </div>
                <button 
                  onClick={() => { onSetView('settings'); setIsProfileOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center font-medium"
                >
                  <Settings size={16} className="mr-3 text-gray-400" />
                  Settings
                </button>
                <button 
                  onClick={() => { toggleTheme(); setIsProfileOpen(false); }}
                  className="sm:hidden w-full text-left px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center font-medium"
                >
                  {theme === 'dark' ? <Sun size={16} className="mr-3 text-gray-400" /> : <Moon size={16} className="mr-3 text-gray-400" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button 
                  onClick={logoutUser}
                  className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center font-medium mt-1 border-t border-gray-100 dark:border-white/5"
                >
                  <LogOut size={16} className="mr-3" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
