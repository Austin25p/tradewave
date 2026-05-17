import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Info, AlertTriangle, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { useFirestore } from './useFirestore';
import { Task } from './types';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { tasks } = useFirestore(); // Example to hook into tasks

  // Notification Preferences
  const [preferences, setPreferences] = useState({
    browserNotifications: false,
    soundAlerts: false,
    tradeReminders: true,
    taskReminders: true
  });

  useEffect(() => {
    const savedPrefs = localStorage.getItem('notificationPrefs');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {}
    }
  }, []);

  const addNotification = (title: string, message: string, type: NotificationType = 'info') => {
    const newNotif: AppNotification = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);

    // HTML5 System Notification Support
    if (preferences.browserNotifications && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
      removeNotification(newNotif.id);
    }, 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Automated Background Check for Task Reminders
  useEffect(() => {
    if (!preferences.taskReminders) return;
    
    const interval = setInterval(() => {
      if (!tasks) return;
      const now = new Date();
      tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
          const due = new Date(task.dueDate);
          const diffMinutes = (due.getTime() - now.getTime()) / (1000 * 60);
          
          // Notify 15 mins before due
          if (diffMinutes > 0 && diffMinutes <= 15) {
            // Check if we haven't already notified for this task recently
            const alreadyNotified = notifications.some(n => n.title.includes(task.title));
            if (!alreadyNotified) {
               addNotification("Upcoming Task Reminder", `${task.title} is due in ${Math.ceil(diffMinutes)} mins!`, 'warning');
            }
          }
        }
      });
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks, preferences.taskReminders, notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      markAsRead,
      clearAll,
      unreadCount: notifications.filter(n => !n.read).length
    }}>
      {children}
      <NotificationOverlay />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
}

// Global UI Rendering Overlay
function NotificationOverlay() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm">
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={clsx(
              "pointer-events-auto overflow-hidden rounded-xl shadow-lg border p-4 flex items-start gap-3 backdrop-blur-xl transition-all",
              notif.type === 'success' && "bg-emerald-950/40 border-emerald-500/30",
              notif.type === 'error' && "bg-red-950/40 border-red-500/30",
              notif.type === 'warning' && "bg-amber-950/40 border-amber-500/30",
              notif.type === 'info' && "bg-blue-950/40 border-blue-500/30",
            )}
          >
             <div className="shrink-0 mt-0.5">
               {notif.type === 'success' && <CheckCircle className="text-emerald-400" size={18} />}
               {notif.type === 'error' && <ShieldAlert className="text-red-400" size={18} />}
               {notif.type === 'warning' && <AlertTriangle className="text-amber-400" size={18} />}
               {notif.type === 'info' && <Info className="text-blue-400" size={18} />}
             </div>
             <div className="flex-1">
               <h4 className="text-sm font-bold text-gray-100">{notif.title}</h4>
               <p className="text-xs text-gray-300 mt-1">{notif.message}</p>
             </div>
             <button onClick={() => removeNotification(notif.id)} className="text-gray-500 hover:text-white transition-colors">
               <X size={14} />
             </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
