import React, { useState } from 'react';
import { Menu, X, Sun, Moon, Bell, Maximize, User, LogOut, Settings, Hexagon, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { isToday, isBefore, startOfToday, parseISO } from 'date-fns';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';
import { useFirestore } from '../lib/useFirestore';
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
  const { tasks } = useFirestore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const dueTasks = tasks.filter(t => !t.completed && t.dueDate && (isToday(parseISO(t.dueDate)) || isBefore(parseISO(t.dueDate), startOfToday())));

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

        <div className="relative">
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors p-1"
          >
            <CalendarCheck size={20} className="stroke-[1.5]" />
            {dueTasks.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {dueTasks.length}
              </span>
            )}
          </button>
          <AnimatePresence>
            {isTaskModalOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsTaskModalOpen(false)}
                  className="fixed inset-0 z-40 bg-transparent"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#151516] rounded-xl shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden z-50 flex flex-col max-h-[70vh]"
                >
                  <div className="p-3 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-[#f7f9ff] dark:bg-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                      <CalendarCheck size={16} className="text-blue-500" />
                      Due Today
                    </h3>
                    <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {dueTasks.length === 0 ? (
                      <div className="text-center text-gray-500 py-6 flex flex-col items-center">
                         <CheckCircle2 size={24} className="text-emerald-400 mb-2 opacity-50" />
                         <p className="text-xs font-medium">All caught up!</p>
                      </div>
                    ) : (
                      dueTasks.map(task => (
                        <div key={task.id} className="p-2.5 bg-white dark:bg-[#1A1A1B] border border-gray-100 dark:border-white/5 rounded-lg flex flex-col gap-1 shadow-sm">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{task.title}</span>
                            <span className={clsx("text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ml-2", 
                              task.priority === 'High' ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400" :
                              task.priority === 'Medium' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                              "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            )}>{task.priority}</span>
                          </div>
                          <span className="text-xs text-gray-500 truncate">{task.project || 'No project'}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-center">
                     <button onClick={() => { setIsTaskModalOpen(false); onSetView('tasks'); }} className="text-xs text-blue-500 hover:text-blue-600 font-bold w-full p-1">View All Tasks</button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

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
