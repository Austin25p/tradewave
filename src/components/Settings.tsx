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
} from "lucide-react";
import { useFirestore } from "../lib/useFirestore";

export function Settings() {
  const { user } = useAuth();
  const { trades } = useFirestore();

  const [activeTab, setActiveTab] = useState<
    "profile" | "providers" | "data" | "notifications"
  >("profile");

  const [providerSettings, setProviderSettings] = useState({
    defaultProvider: "yahoo",
    polygonApiKey: "",
    twelvedataApiKey: "",
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dataProviders");
    if (saved) {
      try {
        setProviderSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleProviderChange = (key: string, value: string) => {
    setProviderSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveProviders = () => {
    localStorage.setItem("dataProviders", JSON.stringify(providerSettings));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
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
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent",
            )}
          >
            <User size={18} />
            <span>Account Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={clsx(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 outline-none",
              activeTab === "providers"
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent",
            )}
          >
            <Network size={18} />
            <span>Data Providers</span>
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={clsx(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 outline-none",
              activeTab === "data"
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent",
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
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent",
            )}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>
        </div>

        {/* Right Column - Content */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === "profile" && (
            <div className="premium-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center space-x-2">
                <User size={20} className="text-blue-400" />
                <span>Profile Information</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-3 bg-black/40 border border-white/10 rounded-lg px-4 py-3">
                    <Mail size={16} className="text-gray-400" />
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
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.displayName || "Trader"}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Display name updates currently disabled in preview mode.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "providers" && (
            <div className="premium-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center space-x-2">
                <Network size={20} className="text-emerald-400" />
                <span>Data Providers Integration</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                    Primary Historical Data Source
                  </label>
                  <select
                    value={providerSettings.defaultProvider}
                    onChange={(e) =>
                      handleProviderChange("defaultProvider", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="yahoo">Yahoo Finance (Free/Default)</option>
                    <option value="polygon">
                      Polygon.io (Requires API Key)
                    </option>
                    <option value="twelvedata">
                      Twelve Data (Requires API Key)
                    </option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Crypto backtesting automatically uses Binance (Free)
                    for optimal accuracy regardless of the setting above.
                  </p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                    Polygon.io API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Provider API Key"
                    value={providerSettings.polygonApiKey}
                    onChange={(e) =>
                      handleProviderChange("polygonApiKey", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                    Twelve Data API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Provider API Key"
                    value={providerSettings.twelvedataApiKey}
                    onChange={(e) =>
                      handleProviderChange("twelvedataApiKey", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={saveProviders}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>Save Connections</span>
                    {saveSuccess && (
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded ml-2">
                        Saved!
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="premium-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center space-x-2">
                <Database size={20} className="text-purple-400" />
                <span>Data & Privacy</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl">
                  <div>
                    <h3 className="font-medium text-white mb-1">Export Data</h3>
                    <p className="text-sm text-gray-400">
                      Download all your trading history as CSV
                    </p>
                  </div>
                  <button
                    onClick={handleExport}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
                  >
                    <Download size={16} />
                    <span>Export</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-500/20 rounded-xl">
                  <div>
                    <h3 className="font-medium text-red-400 mb-1">
                      Delete Account
                    </h3>
                    <p className="text-sm text-red-400/60">
                      Permanently erase all data and trades
                    </p>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/30">
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="premium-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center space-x-2">
                <Bell size={20} className="text-amber-400" />
                <span>Notification Preferences</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl">
                  <div>
                    <h3 className="font-medium text-white mb-1">
                      Browser Notifications
                    </h3>
                    <p className="text-sm text-gray-400">
                      Receive alerts even when the app is in background
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const saved = localStorage.getItem("notificationPrefs");
                      const prefs = saved ? JSON.parse(saved) : {};
                      const newVal = !(prefs.browserNotifications || false);
                      if (newVal && "Notification" in window) {
                        Notification.requestPermission();
                      }
                      localStorage.setItem(
                        "notificationPrefs",
                        JSON.stringify({
                          ...prefs,
                          browserNotifications: newVal,
                        }),
                      );
                      window.location.reload();
                    }}
                    className={clsx(
                      "flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors font-bold",
                      JSON.parse(
                        localStorage.getItem("notificationPrefs") || "{}",
                      ).browserNotifications
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300",
                    )}
                  >
                    {JSON.parse(
                      localStorage.getItem("notificationPrefs") || "{}",
                    ).browserNotifications
                      ? "Enabled"
                      : "Enable"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl">
                  <div>
                    <h3 className="font-medium text-white mb-1">
                      Task Reminders
                    </h3>
                    <p className="text-sm text-gray-400">
                      Get notified 15 minutes before tasks are due
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const saved = localStorage.getItem("notificationPrefs");
                      const prefs = saved ? JSON.parse(saved) : {};
                      const newVal = !(prefs.taskReminders ?? true);
                      localStorage.setItem(
                        "notificationPrefs",
                        JSON.stringify({ ...prefs, taskReminders: newVal }),
                      );
                      window.location.reload();
                    }}
                    className={clsx(
                      "flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors font-bold",
                      (JSON.parse(
                        localStorage.getItem("notificationPrefs") || "{}",
                      ).taskReminders ?? true)
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300",
                    )}
                  >
                    {(JSON.parse(
                      localStorage.getItem("notificationPrefs") || "{}",
                    ).taskReminders ?? true)
                      ? "Enabled"
                      : "Enable"}
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
