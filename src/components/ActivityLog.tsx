import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  ArrowRight,
  Target,
  DollarSign,
  Calendar as CalIcon,
  Settings as SettingsIcon,
  Shield,
  CheckCircle,
  PlaySquare,
  Filter,
  Search,
  X,
} from "lucide-react";
import { Trade } from "../lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";
import { useAuth } from "./AuthProvider";
import { useHaptic } from "../lib/haptic";

interface ActivityLogProps {
  trades: Trade[];
}

interface ActivityEvent {
  id: string;
  type: "trade_added" | "trade_updated" | "login" | "settings_changed";
  timestamp: string;
  description: string;
  details?: string;
  icon: any;
  color: string;
  tradeNetPnL?: number;
  tradeDirection?: "Long" | "Short";
}

export function ActivityLog({ trades }: ActivityLogProps) {
  const { user } = useAuth();
  const haptic = useHaptic();
  const [filter, setFilter] = useState<"all" | "winning" | "losing">("all");

  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const clearFilters = () => {
    setFilter("all");
    setSessionFilter("all");
    setTypeFilter("all");
    setSearchTerm("");
  };

  const hasActiveFilters =
    filter !== "all" ||
    sessionFilter !== "all" ||
    typeFilter !== "all" ||
    searchTerm !== "";

  // Synthesize activity history based on trades (since we don't have a real activity feed backend yet)
  const activities = useMemo(() => {
    let events: ActivityEvent[] = [];

    // Add artificial login event
    events.push({
      id: "login-latest",
      type: "login",
      timestamp: new Date().toISOString(),
      description: "Logged in successfully",
      details: user?.email || "User",
      icon: Shield,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    });

    const getSession = (dateStr: string) => {
      const hour = new Date(dateStr).getUTCHours();
      if (hour >= 13 && hour < 21) return "new_york";
      if (hour >= 8 && hour < 16) return "london";
      if (hour >= 0 && hour < 8) return "asian";
      return "sydney";
    };

    // Add trades as events
    trades.forEach((trade) => {
      events.push({
        id: `trade-${trade.id}`,
        type: "trade_added",
        timestamp: trade.exitDate, // Using exitDate as the event time for simplicity
        description: `Closed ${trade.direction} trade on ${trade.symbol}`,
        details: `PnL: $${trade.netPnL.toFixed(2)} | Target: ${trade.takeProfitPrice && trade.exitPrice >= trade.takeProfitPrice ? "Hit" : "Missed"}`,
        icon: trade.netPnL >= 0 ? CheckCircle : Target,
        color:
          trade.netPnL >= 0
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            : "text-red-400 bg-red-500/10 border-red-500/20",
        tradeNetPnL: trade.netPnL,
        tradeDirection: trade.direction,
      });
    });

    let filteredEvents = events.filter((e) => {
      if (
        filter === "winning" &&
        (e.tradeNetPnL === undefined || e.tradeNetPnL < 0)
      )
        return false;
      if (
        filter === "losing" &&
        (e.tradeNetPnL === undefined || e.tradeNetPnL >= 0)
      )
        return false;

      if (typeFilter === "trade_long" && (e.type !== "trade_added" || e.tradeDirection !== "Long")) return false;
      if (typeFilter === "trade_short" && (e.type !== "trade_added" || e.tradeDirection !== "Short")) return false;
      if (typeFilter === "trades" && e.type !== "trade_added") return false;
      if (typeFilter === "logins" && e.type !== "login") return false;

      if (sessionFilter !== "all" && getSession(e.timestamp) !== sessionFilter)
        return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !e.description.toLowerCase().includes(searchLower) &&
          !(e.details && e.details.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort by timestamp descending
    return filteredEvents.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [trades, user, filter, sessionFilter, typeFilter, searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center space-x-3 mb-8">
        <Activity className="text-purple-400" size={32} />
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Activity Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor recent actions, trades, and account events in real-time
          </p>
        </div>
      </div>

      <div className="premium-card p-6">
        <div className="flex flex-col mb-6 border-b border-white/5 pb-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-display font-medium text-white">
                Recent Activity
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20"
                >
                  <Filter size={12} />
                  Clear Filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Search activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/40 border border-white/5 rounded-lg pl-9 pr-8 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 w-full sm:w-64 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* PnL Filter */}
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 w-fit">
              <button
                onClick={() => setFilter("all")}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  filter === "all"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-gray-300",
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter("winning")}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  filter === "winning"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-gray-400 hover:text-emerald-400/70",
                )}
              >
                Winning
              </button>
              <button
                onClick={() => setFilter("losing")}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  filter === "losing"
                    ? "bg-red-500/20 text-red-400"
                    : "text-gray-400 hover:text-red-400/70",
                )}
              >
                Losing
              </button>
            </div>

            {/* Session Filter */}
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-indigo-500/50 transition-all hover:text-white cursor-pointer"
            >
              <option value="all">All Sessions</option>
              <option value="asian">Asian Session</option>
              <option value="london">London Session</option>
              <option value="new_york">New York Session</option>
              <option value="sydney">Sydney Session</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-indigo-500/50 transition-all hover:text-white cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="trades">All Trades</option>
              <option value="trade_long">Long Trades</option>
              <option value="trade_short">Short Trades</option>
              <option value="logins">Logins</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Activity size={48} className="mx-auto mb-4 opacity-20" />
              <p>No activity recorded yet.</p>
            </div>
          ) : (
            <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {activities.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8"
                >
                  {/* Icon */}
                  <div
                    className={clsx(
                      "flex items-center justify-center w-10 h-10 rounded-full border bg-gray-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10",
                      event.color,
                    )}
                  >
                    <event.icon size={16} />
                  </div>

                  {/* Card */}
                  <div
                    className={clsx(
                      "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-[1.25rem] bg-gray-900/50 border border-white/5 backdrop-blur-md shadow-lg transition-all relative overflow-hidden group/card",
                      event.type === "trade_added"
                        ? "cursor-pointer hover:bg-white/[0.05] hover:border-white/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                        : "group-hover:bg-white/[0.02]",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-white text-sm">
                        {event.description}
                      </h3>
                      <div className="flex items-center gap-2">
                        <time className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                          {formatDistanceToNow(new Date(event.timestamp), {
                            addSuffix: true,
                          })}
                        </time>
                        {event.type === "trade_added" && (
                          <ArrowRight
                            size={14}
                            className="text-gray-500 opacity-0 group-hover/card:opacity-100 group-hover/card:text-indigo-400 group-hover/card:translate-x-1 transition-all"
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                      {event.details}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
