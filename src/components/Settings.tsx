import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from './AuthProvider';
import { Settings as SettingsIcon, User, Shield, Bell, Key, Database, Download, Trash2, Mail } from 'lucide-react';
import { useFirestore } from '../lib/useFirestore';

export function Settings() {
  const { user } = useAuth();
  const { trades } = useFirestore();

  const handleExport = () => {
    if (!trades || trades.length === 0) return;
    
    // Create CSV header
    const headers = ['id', 'entryDate', 'exitDate', 'symbol', 'type', 'netPnL', 'status', 'setup'];
    const csvContent = [
      headers.join(','),
      ...trades.map(t => [
        t.id,
        t.entryDate,
        t.exitDate,
        t.symbol,
        t.type,
        t.netPnL,
        t.status,
        `"${t.setup || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trades_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
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
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Nav */}
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl font-medium transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <User size={18} />
            <span>Account Profile</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-xl font-medium transition-all">
            <Shield size={18} />
            <span>Security</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-xl font-medium transition-all">
            <Bell size={18} />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-xl font-medium transition-all">
            <Database size={18} />
            <span>Data Management</span>
          </button>
        </div>

        {/* Right Column - Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="premium-card p-6">
            <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center space-x-2">
              <User size={20} className="text-blue-400" />
              <span>Profile Information</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Email Address</label>
                <div className="flex items-center space-x-3 bg-black/40 border border-white/10 rounded-lg px-4 py-3">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-gray-200">{user?.email || 'N/A'}</span>
                  {user?.emailVerified && (
                    <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">Verified</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Display Name</label>
                <input 
                  type="text" 
                  disabled
                  value={user?.displayName || 'Trader'} 
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2">Display name updates currently disabled in preview mode.</p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6">
             <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center space-x-2">
              <Database size={20} className="text-purple-400" />
              <span>Data & Privacy</span>
            </h2>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl">
                 <div>
                   <h3 className="font-medium text-white mb-1">Export Data</h3>
                   <p className="text-sm text-gray-400">Download all your trading history as CSV</p>
                 </div>
                 <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors">
                   <Download size={16} />
                   <span>Export</span>
                 </button>
               </div>
               
               <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-500/20 rounded-xl">
                 <div>
                   <h3 className="font-medium text-red-400 mb-1">Delete Account</h3>
                   <p className="text-sm text-red-400/60">Permanently erase all data and trades</p>
                 </div>
                 <button className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/30">
                   <Trash2 size={16} />
                   <span>Delete</span>
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
