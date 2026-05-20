import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthProvider';
import { Logo } from './Logo';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const [tradingTypes, setTradingTypes] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    // Check if onboarding is already completed
    const checkOnboarding = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, `users/${user.uid}/profile`, 'settings');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists() && snapshot.data().onboardingCompleted) {
          onComplete();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking onboarding:", err);
        setLoading(false);
      }
    };
    checkOnboarding();
  }, [user, onComplete]);

  const completeOnboarding = async () => {
    if (!user) return;
    setStep(4); // Loading screen
    try {
      const docRef = doc(db, `users/${user.uid}/profile`, 'settings');
      await setDoc(docRef, {
        onboardingCompleted: true,
        tradingTypes,
        goals,
        source,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error("Error saving onboarding:", err);
      // Even if it fails, let them in
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  };

  const handleNext = () => {
    if (step === 3) {
      completeOnboarding();
    } else {
      setStep(step + 1);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#eff4f9] dark:bg-gray-950 flex flex-col items-center justify-center z-[100]">
         <div className="flex items-center mb-6">
           <Logo size={40} withText={true} />
         </div>
         <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#eff4f9] dark:bg-gray-900 flex flex-col font-sans transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 mix-blend-multiply blur-[100px] animate-blob" />
         <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 mix-blend-multiply blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <div className="w-full flex items-center justify-between p-6 relative z-10">
        <div className="flex items-center space-x-2">
           <Logo size={28} withText={true} />
        </div>
        
        {step > 0 && step < 4 && (
          <div className="flex-1 max-w-md mx-6">
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: `${((step - 1) / 3) * 100}%` }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
           <span className="text-xl">🇬🇧</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center w-full max-w-lg">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-[#0f172a] dark:text-white mb-4">Welcome, {user?.displayName ? user.displayName.split(' ')[0] : 'Trader'}</h1>
              <p className="text-[#334155] dark:text-gray-300 text-lg md:text-xl mb-8 leading-relaxed max-w-md mx-auto">
                Let's set up your trading workspace and guide you to your first performance dashboard.
              </p>
              <p className="text-sm text-gray-500 mb-10">This takes less than 60 seconds.</p>
              <button 
                onClick={handleNext}
                className="bg-[#2563eb] hover:bg-blue-600 text-white font-semibold py-4 px-12 rounded-lg text-lg transition-transform active:scale-95 shadow-lg shadow-blue-500/30"
              >
                Set Up My Workspace
              </button>
              <p className="text-xs text-gray-400 mt-4">Free to start. No credit card required.</p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0f172a] dark:text-white mb-2 text-center">What do you use to trade?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-10 text-center">Select all that apply.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {[
                  { id: 'Personal Capital', desc: 'Own live or demo accounts' },
                  { id: 'Prop Firm Account', desc: 'Challenges, evaluations, or funded accounts' },
                  { id: 'I Haven\'t Started Yet', desc: 'I\'m exploring before I begin' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTradingTypes(prev => prev.includes(item.id) ? prev.filter(t => t !== item.id) : [...prev, item.id])}
                    className={`flex flex-col items-start p-6 rounded-xl border text-left transition-all ${tradingTypes.includes(item.id) ? 'bg-[#ebf5ff] dark:bg-blue-900/20 border-blue-500 shadow-md shadow-blue-500/10' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'}`}
                  >
                    <div className="flex items-center space-x-3 mb-2 w-full">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${tradingTypes.includes(item.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                        {tradingTypes.includes(item.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.id}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">{item.desc}</p>
                  </button>
                ))}
              </div>

              <button
                disabled={tradingTypes.length === 0}
                onClick={handleNext}
                className={`mt-12 py-3 px-12 rounded-lg font-semibold text-lg transition-all ${tradingTypes.length > 0 ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex flex-col items-center max-w-5xl">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0f172a] dark:text-white mb-2 text-center">What do you want to use TraderWaves for?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-10 text-center">Choose up to 2.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {[
                  { id: 'Improve My Consistency', desc: 'Build discipline, review mistakes, and stay accountable.', icon: '🎯' },
                  { id: 'Track Prop Firm Progress', desc: 'Track challenge rules, drawdown limits, and funded progress.', icon: '🏆' },
                  { id: 'Manage Risk & Drawdown', desc: 'Monitor equity, drawdown, risk limits, and account growth.', icon: '🛡️' },
                  { id: 'Analyze My Performance', desc: 'Track stats, charts, patterns, strengths, and weaknesses.', icon: '📊' },
                  { id: 'Set Alerts & Monitor Accounts', desc: 'Stay updated on account activity, risk, and trading conditions.', icon: '🔔' },
                  { id: 'Backtest Strategies', desc: 'Test strategy ideas before risking real money.', icon: '🔬' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                       setGoals(prev => {
                          if (prev.includes(item.id)) return prev.filter(g => g !== item.id);
                          if (prev.length >= 2) return prev; // max 2
                          return [...prev, item.id];
                       });
                    }}
                    className={`flex items-start p-5 rounded-xl border text-left transition-all ${goals.includes(item.id) ? 'bg-[#dbeafe] dark:bg-blue-900/30 border-blue-400 shadow-md shadow-blue-500/10' : 'bg-white/80 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'}`}
                  >
                     <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg mr-3 shadow-sm flex-shrink-0">
                       {item.icon}
                     </div>
                     <div className="flex-1 pr-2">
                       <h3 className={`font-semibold mb-1 text-sm ${goals.includes(item.id) ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>{item.id}</h3>
                       <p className={`text-xs ${goals.includes(item.id) ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>{item.desc}</p>
                     </div>
                     <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${goals.includes(item.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                        {goals.includes(item.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                  </button>
                ))}
              </div>

              <button
                disabled={goals.length === 0}
                onClick={handleNext}
                className={`mt-12 py-3 px-12 rounded-lg font-semibold text-lg transition-all ${goals.length > 0 ? 'bg-[#3b82f6] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0f172a] dark:text-white mb-10 text-center">How did you hear about TraderWaves?</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  { id: 'X / Twitter', icon: '𝕏' },
                  { id: 'Instagram', icon: '📸' },
                  { id: 'YouTube', icon: '▶️' },
                  { id: 'Discord', icon: '💬' },
                  { id: 'TikTok', icon: '🎵' },
                  { id: 'Reddit', icon: '🤖' },
                  { id: 'Google', icon: '🔍' },
                  { id: 'Trading Community', icon: '👥' },
                  { id: 'Friend', icon: '👤' },
                  { id: 'Other', icon: '⋯' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSource(item.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${source === item.id ? 'bg-[#ebf5ff] dark:bg-blue-900/20 border-blue-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600 dark:text-gray-300 text-lg w-6 text-center">{item.icon}</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.id}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border ${source === item.id ? 'border-4 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}></div>
                  </button>
                ))}
              </div>

              <button
                disabled={!source}
                onClick={handleNext}
                className={`mt-10 py-3 px-12 rounded-lg font-semibold text-lg transition-all ${source ? 'bg-[#3b82f6] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center">
               <div className="flex items-center mb-6">
                 <Logo size={48} withText={true} />
               </div>
               <div className="w-10 h-10 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin"/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
