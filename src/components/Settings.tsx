import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { clsx } from "clsx";
import { useAuth } from "./AuthProvider";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Key,
  Database,
  Download,
  Trash2,
  Mail,
  Network,
  Volume2,
} from "lucide-react";
import { useFirestore } from "../lib/useFirestore";
import { audioSystem } from "../lib/audio";
import { useHaptic, hapticSystem } from "../lib/haptic";

export function Settings() {
  const { user } = useAuth();
  const { trades } = useFirestore();
  const haptic = useHaptic();

  const [activeTab, setActiveTab] = useState<
    "profile" | "data" | "notifications" | "preferences"
  >("profile");

  const [soundEnabled, setSoundEnabled] = useState(audioSystem.getEnabled());

  const handleToggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    audioSystem.setEnabled(newVal);
    if (newVal) haptic('medium');
  };

  const [hapticEnabled, setHapticEnabled] = useState(hapticSystem.getEnabled());

  const handleToggleHaptic = () => {
    const newVal = !hapticEnabled;
    setHapticEnabled(newVal);
    hapticSystem.setEnabled(newVal);
    if (newVal) hapticSystem.trigger('medium');
  };

  const [notificationPrefs, setNotificationPrefs] = useState({
    browserNotifications: false,
    taskReminders: true,
    marketSessions: true,
    aiCoach: true,
    propFirm: true,
    dailyDigest: false,
  });

  useEffect(() => {
    const savedPrefs = localStorage.getItem("notificationPrefs");
    if (savedPrefs) {
      try {
        setNotificationPrefs(JSON.parse(savedPrefs));
      } catch (e) {}
    }
  }, []);

  const handleNotificationChange = (key: string) => {
    setNotificationPrefs((prev) => {
      const newPrefsStr = { ...prev, [key]: !(prev as any)[key] };
      const newVal = newPrefsStr[key as keyof typeof newPrefsStr];
      if (key === 'browserNotifications' && newVal && "Notification" in window) {
        Notification.requestPermission();
      }
      localStorage.setItem("notificationPrefs", JSON.stringify(newPrefsStr));
      return newPrefsStr;
    });
  };

  const handleExport = () => {
    if (!trades || trades.length === 0) return;

    // Create CSV header
    const headers = [
      "id",
      "entryDate",
      "exitDate",
      "symbol",
      "type",
      "netPnL",
      "status",
      "setup",
    ];
    const csvContent = [
      headers.join(","),
      ...trades.map((t) =>
        [
          t.id,
          t.entryDate,
          t.exitDate,
          t.symbol,
          t.direction,
          t.netPnL,
          "Closed",
          `"${t.setup || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `trades_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center space-x-3 mb-8">
        <SettingsIcon className="text-blue-400" size={32} />
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
          Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Nav */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={clsx(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 outline-none",
              activeTab === "profile"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                : "text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-200 hover:bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-transparent",
            )}
          >
            <User size={18} />
            <span>Account Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={clsx(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 outline-none",
              activeTab === "data"
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                : "text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-200 hover:bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-transparent",
            )}
          >
            <Database size={18} />
            <span>Data Management</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={clsx(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 outline-none",
              activeTab === "notifications"
                ? "bg-amber-600/20 text-amber-400 border border-amber-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                : "text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-200 hover:bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-transparent",
            )}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={clsx(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 outline-none",
              activeTab === "preferences"
                ? "bg-green-600/20 text-green-400 border border-green-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                : "text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-200 hover:bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-transparent",
            )}
          >
            <Volume2 size={18} />
            <span>App Preferences</span>
          </button>
        </div>

        {/* Right Column - Content */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === "profile" && (
            <div className="premium-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <User size={20} className="text-blue-400" />
                <span>Profile Information</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-3 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3">
                    <Mail size={16} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-200">
                      {user?.email || "N/A"}
                    </span>
                    {user?.emailVerified && (
                      <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.displayName || "Trader"}
                    className="w-full bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-400 dark:text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Display name updates currently disabled in preview mode.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="premium-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <Database size={20} className="text-purple-400" />
                <span>Data & Storage</span>
              </h2>

              <div className="space-y-6">
                {/* Storage Stats Section */}
                <div className="p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Workspace Usage</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Trading History</span>
                            <span className="text-gray-200 font-medium">{trades?.length || 0} Records</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Local Cache Size</span>
                            <span className="text-gray-200 font-medium">~1.2 MB</span>
                        </div>
                        <div className="w-full bg-black/50 rounded-full h-2 mt-2 border border-gray-100 dark:border-white/5">
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 text-right mt-1">15% of 10MB Local Allowance</div>
                    </div>
                </div>

                {/* Export Section */}
                <div className="space-y-4">
                  <h3 className="text-sm uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-2">Export Data</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl hover:border-gray-300 dark:border-white/20 transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Export Trading History</h4>
                      <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400">
                        Download all your trades as a CSV spreadsheet
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleExport}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none rounded-lg text-gray-600 dark:text-gray-300 transition-colors border border-gray-100 dark:border-white/5"
                    >
                      <Download size={16} />
                      <span>CSV Export</span>
                    </motion.button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl hover:border-gray-300 dark:border-white/20 transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Full Account Backup</h4>
                      <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400">
                        Download a complete JSON backup of your settings, tasks, and data
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ trades, notificationPrefs }, null, 2));
                        const downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", `tradewhale_backup_${new Date().toISOString().split('T')[0]}.json`);
                        document.body.appendChild(downloadAnchorNode);
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors border border-purple-500/20"
                    >
                      <Download size={16} />
                      <span>JSON Backup</span>
                    </motion.button>
                  </div>
                </div>

                {/* Storage Management Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <h3 className="text-sm uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-2">Storage Management</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl hover:border-gray-300 dark:border-white/20 transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Clear Local Cache</h4>
                      <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400">
                        Free up space by removing locally cached assets and temporary data
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        localStorage.removeItem('notificationPrefs');
                        alert("Local cache cleared successfully.");
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none rounded-lg text-gray-600 dark:text-gray-300 transition-colors border border-gray-100 dark:border-white/5"
                    >
                      <Trash2 size={16} />
                      <span>Clear Cache</span>
                    </motion.button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-500/20 rounded-xl">
                    <div>
                      <h4 className="font-medium text-red-400 mb-1">
                        Delete Account & All Data
                      </h4>
                      <p className="text-sm text-red-400/60">
                        Permanently erase all your storage, histories, and cloud data
                      </p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/30"
                    >
                      <Trash2 size={16} />
                      <span>Delete Account</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="premium-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <Bell size={20} className="text-amber-400" />
                <span>Notification Preferences</span>
              </h2>
              <div className="space-y-4">
                {[
                  { id: 'browserNotifications', title: 'Browser Notifications', desc: 'Receive alerts even when the app is in background' },
                  { id: 'taskReminders', title: 'Task Reminders', desc: 'Get notified 15 minutes before tasks are due' },
                  { id: 'marketSessions', title: 'Market Session Alerts', desc: 'Get notified when major markets open or close' },
                  { id: 'propFirm', title: 'Prop Firm Rules', desc: 'Alerts for drawdown warnings and rule violations' },
                  { id: 'aiCoach', title: 'AI Coach Insights', desc: 'Receive periodic analytics and tips from your AI coach' },
                  { id: 'dailyDigest', title: 'Daily Email Digest', desc: 'A daily summary of your performance and tasks' }
                ].map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between p-4 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white dark:bg-white/5 shadow-sm dark:shadow-none transition-colors group">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-blue-400 transition-colors">{pref.title}</h3>
                      <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 max-w-sm">
                        {pref.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(pref.id)}
                      className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                        (notificationPrefs as any)[pref.id] ? "bg-emerald-500" : "bg-gray-600"
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          (notificationPrefs as any)[pref.id] ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="premium-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <Volume2 size={20} className="text-green-400" />
                <span>Audio & App Preferences</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white dark:bg-white/5 shadow-sm dark:shadow-none transition-colors group">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-green-400 transition-colors">Interface Sounds</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 max-w-sm">
                      Play premium synthesized sounds on clicks and interactions
                    </p>
                  </div>
                  <button
                    onClick={handleToggleSound}
                    className={clsx(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                      soundEnabled ? "bg-emerald-500" : "bg-gray-600"
                    )}
                  >
                    <span
                      className={clsx(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        soundEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white dark:bg-white/5 shadow-sm dark:shadow-none transition-colors group">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-amber-400 transition-colors">Haptic Feedback</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 max-w-sm">
                      Enable device vibrations on key interactions (mobile devices)
                    </p>
                  </div>
                  <button
                    onClick={handleToggleHaptic}
                    className={clsx(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                      hapticEnabled ? "bg-emerald-500" : "bg-gray-600"
                    )}
                  >
                    <span
                      className={clsx(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        hapticEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
