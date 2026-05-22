import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Server, Key, User, Eye, EyeOff, Loader2, CheckCircle2, ChevronLeft, LogIn, AlertCircle } from 'lucide-react';
import { useHaptic } from '../lib/haptic';

interface AccountConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS = [
  { id: 'mt4', name: 'MetaTrader 4', hasOauth: false },
  { id: 'mt5', name: 'MetaTrader 5', hasOauth: false },
  { id: 'ctrader', name: 'cTrader', hasOauth: false },
  { id: 'binance', name: 'Binance', hasOauth: true },
  { id: 'bybit', name: 'Bybit', hasOauth: true },
  { id: 'matchtrader', name: 'Match-Trader', hasOauth: false },
];

export function AccountConnectionModal({ isOpen, onClose }: AccountConnectionModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'form' | 'connecting' | 'success'>('select');
  const [showPassword, setShowPassword] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const haptic = useHaptic();

  // Form states
  const [serverName, setServerName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [apiPassword, setApiPassword] = useState('');

  // Handle closing and reset state
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSelectedPlatform(null);
      setStep('select');
      setShowPassword(false);
      setErrorDetails(null);
      setServerName('');
      setAccountId('');
      setApiPassword('');
    }, 300);
  };

  const handleOAuthLogin = async (platformId: string) => {
    haptic('medium');
    try {
      const res = await fetch(`/api/oauth/connect/${platformId}`);
      if (!res.ok) throw new Error('OAuth initiation failed');
      const data = await res.json();
      if (data.redirectUrl) {
        // In a real app we'd redirect to the OAuth URL: window.location.href = data.redirectUrl;
        // For preview, we'll simulate a successful OAuth connection flow
        setStep('connecting');
        setTimeout(() => {
          haptic('medium');
          setStep('success');
          setTimeout(() => handleClose(), 2500);
        }, 1500);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic('medium');
    setStep('connecting');
    setErrorDetails(null);
    
    try {
        const res = await fetch('/api/validate-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                platform: selectedPlatform,
                server: serverName,
                login: accountId,
                password: apiPassword,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            haptic('heavy');
            setErrorDetails(data.error || "Connection failed to broker");
            setStep('form');
            return;
        }

        haptic('medium');
        setStep('success');
        setTimeout(() => {
            handleClose();
            // Optional: You could trigger an app-level state change or emit a websocket connection start event here.
            window.dispatchEvent(new CustomEvent('broker_connected', { detail: { platform: selectedPlatform }}));
        }, 2500);

    } catch (err) {
        haptic('heavy');
        setErrorDetails("Network error occurred while validating API payload.");
        setStep('form');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-[480px] bg-white dark:bg-[#111112] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
               <div className="flex items-center">
                 {step === 'form' && (
                   <button 
                     onClick={() => { haptic('light'); setStep('select'); }}
                     className="mr-3 p-1.5 -ml-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                   >
                     <ChevronLeft size={18} />
                   </button>
                 )}
                 <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                   {step === 'select' ? 'Connect Trading Account' : 
                    step === 'form' ? `Connect to ${PLATFORMS.find(p => p.id === selectedPlatform)?.name}` : 
                    step === 'connecting' ? 'Connecting to Broker...' : 'Connection Successful'}
                 </h2>
               </div>
               <button 
                 onClick={handleClose}
                 className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
               >
                 <X size={18} />
               </button>
            </div>

            <div className="p-6">
               {step === 'select' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                     Select your trading platform below. Our secure API integration allows for real-time synchronization of your trades, metrics, and balance.
                   </p>
                   <div className="grid grid-cols-2 gap-3">
                     {PLATFORMS.map((platform) => (
                       <div key={platform.id} className="relative group">
                         <button
                           onClick={() => {
                             haptic('light');
                             setSelectedPlatform(platform.id);
                             setStep('form');
                           }}
                           className="w-full relative overflow-hidden p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 text-left bg-white dark:bg-[#1A1A1C]"
                         >
                           <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           <div className="relative font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex flex-col justify-between h-full">
                             <span>{platform.name}</span>
                           </div>
                         </button>
                         {platform.hasOauth && (
                            <button 
                               onClick={() => handleOAuthLogin(platform.id)}
                               className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 px-2 py-1 rounded border gap-1 flex items-center border-[transparent] shadow-sm z-10 transition-colors"
                               title={`Login directly with ${platform.name} OAuth`}
                            >
                               <LogIn size={10} /> Fast Login
                            </button>
                         )}
                       </div>
                     ))}
                   </div>
                 </motion.div>
               )}

               {step === 'form' && (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                   <form onSubmit={handleConnect} className="space-y-4">
                      {errorDetails && (
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-start">
                          <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
                          <span>{errorDetails}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-transparent">Server Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Server size={16} />
                          </div>
                          <input 
                            type="text" 
                            required
                            value={serverName}
                            onChange={(e) => setServerName(e.target.value)}
                            placeholder="e.g. FTMO-Server"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-transparent">Account ID / Login</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <User size={16} />
                          </div>
                          <input 
                            type="text" 
                            required
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            placeholder="Enter your account ID"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-transparent">API Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Key size={16} />
                          </div>
                          <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={apiPassword}
                            onChange={(e) => setApiPassword(e.target.value)}
                            placeholder="Read-only or API password"
                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center">
                          Establish Connection
                        </button>
                      </div>
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center pt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                        End-to-end encrypted connection
                      </p>
                   </form>
                 </motion.div>
               )}

               {step === 'connecting' && (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                      <Loader2 className="w-16 h-16 animate-spin text-blue-500 relative z-10" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">Authenticating with API...</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Establishing secure handshake with {PLATFORMS.find(p => p.id === selectedPlatform)?.name} server</p>
                    </div>
                 </motion.div>
               )}

               {step === 'success' && (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white text-xl">Successfully Connected!</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your account is now linked. Trades and metrics will automatically sync in the background.</p>
                    </div>
                 </motion.div>
               )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
