import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Key, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { loginWithGoogle, auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError('');
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google Auth failed');
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-8 max-w-md w-full relative overflow-hidden flex flex-col items-center border border-white/10"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 z-0 pointer-events-none" />
        
        <div className="relative z-10 w-full mb-8 text-center flex flex-col items-center">
          <div className="flex items-center space-x-3 mb-6">
            <div className="relative flex shrink-0">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                <rect x="4" y="16" width="4" height="12" rx="1" fill="#3B82F6" />
                <rect x="12" y="8" width="4" height="20" rx="1" fill="#6366F1" />
                <rect x="20" y="12" width="4" height="16" rx="1" fill="#8B5CF6" />
                <path d="M4 16L12 8L20 12L28 4" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="28" cy="4" r="3" fill="#60A5FA" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Tradewave
          </h1>
          <p className="text-gray-400 font-sans tracking-wide">
            {isLogin ? 'Sign in to access your dashboard' : 'Create an account to begin tracking'}
          </p>
        </div>

        {error && (
          <div className="relative z-10 w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="relative z-10 w-full space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                {isLogin ? <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> : <CheckCircle2 className="w-5 h-5" />}
              </>
            )}
          </button>
        </form>

        <div className="relative z-10 w-full flex items-center my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">OR</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <button 
          onClick={handleGoogleAuth}
          className="relative z-10 w-full bg-white text-gray-900 font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-xl transition-all flex items-center justify-center space-x-3 mb-6 hover:bg-gray-100"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 24c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 21.53 7.7 24 12 24z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.43 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="relative z-10 text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline decoration-blue-400/30 underline-offset-2"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>

      </motion.div>
    </div>
  );
}
