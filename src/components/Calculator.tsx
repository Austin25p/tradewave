import React, { useState, useMemo } from 'react';
import { Calculator as CalcIcon, DollarSign, Percent, Target, ShieldAlert, Hash, ChevronDown, ChevronUp, SlidersHorizontal, Info, Bookmark, Trash2, Clock, Search, ArrowLeft, BarChart2, TrendingUp, HelpCircle, RefreshCw, Skull, Layers, Plus, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useHaptic } from '../lib/haptic';
import { ConsistencyCalculator, CompoundingCalculator, RebateCalculator, SwapRolloverCalculator, LeverageCalculator, CurrencyConverter, ProfitCalculator, MarginCalculator, RiskOfRuinCalculator } from './ExtraCalculators';

type AssetClass = 'Forex' | 'Crypto' | 'Stocks' | 'Synthetics';

const CALCULATOR_TABS = [
  { id: 'PositionSize', label: 'Position Size', icon: CalcIcon, color: 'text-blue-500' },
  { id: 'RiskReward', label: 'Risk/Reward', icon: Target, color: 'text-indigo-500' },
  { id: 'Profit', label: 'Profit Solver', icon: TrendingUp, color: 'text-emerald-500' },
  { id: 'Margin', label: 'Margin Req', icon: ShieldAlert, color: 'text-orange-500' },
  { id: 'Leverage', label: 'Leverage', icon: TrendingUp, color: 'text-cyan-500' },
  { id: 'PipValue', label: 'Pip Value', icon: Hash, color: 'text-purple-500' },
  { id: 'SwapRollover', label: 'Swap/Rollover', icon: Clock, color: 'text-lime-500' },
  { id: 'Rebate', label: 'Rebate', icon: DollarSign, color: 'text-green-500' },
  { id: 'CurrencyConverter', label: 'Currency', icon: RefreshCw, color: 'text-blue-400' },
  { id: 'Compounding', label: 'Compounding', icon: TrendingUp, color: 'text-purple-400' },
  { id: 'Consistency', label: 'Consistency', icon: Target, color: 'text-rose-400' },
  { id: 'AtrSize', label: 'ATR Position', icon: SlidersHorizontal, color: 'text-cyan-500' },
  { id: 'Drawdown', label: 'Recovery %', icon: RefreshCw, color: 'text-rose-500' },
  { id: 'RiskOfRuin', label: 'Risk Of Ruin', icon: Skull, color: 'text-red-500' },
  { id: 'PortfolioRisk', label: 'Portfolio Risk', icon: Layers, color: 'text-yellow-500' },
  { id: 'MonteCarlo', label: 'Monte Carlo', icon: BarChart2, color: 'text-amber-500' },
  { id: 'Expectancy', label: 'Expectancy', icon: Target, color: 'text-sky-500' },
  { id: 'WinRate', label: 'Win Rate Req', icon: Percent, color: 'text-teal-500' },
  { id: 'Kelly', label: 'Kelly Criterion', icon: Bookmark, color: 'text-fuchsia-500' },
] as const;

interface SavedTrade {
  id: string;
  timestamp: number;
  assetClass: AssetClass;
  assetSymbol: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit?: string;
  riskAmount: number;
  lotSize: number;
  rrRatio?: number;
  potentialProfit?: number;
}

const InfoTooltip = ({ content }: { content: React.ReactNode }) => (
  <div className="group relative inline-block ml-1 align-middle">
    <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 p-3 bg-gray-800 text-xs text-gray-200 rounded-lg shadow-xl z-50 border border-gray-700 font-normal leading-relaxed text-left pointer-events-none">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700"></div>
    </div>
  </div>
);

const COMMON_SYMBOLS: Record<AssetClass, string[]> = {
  Forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP', 'AUDNZD', 'AUDCAD', 'AUDCHF', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURNZD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD', 'NZDCAD', 'NZDCHF', 'NZDJPY'],
  Crypto: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'DOGEUSD', 'AVAXUSD', 'LINKUSD', 'MATICUSD', 'DOTUSD', 'UNIUSD', 'LTCUSD', 'BCHUSD', 'ATOMUSD', 'XLMUSD', 'ALGOUSD', 'VETUSD', 'FILUSD', 'TRXUSD'],
  Stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'SPY', 'QQQ', 'MCD', 'JPM', 'V', 'WMT', 'DIS', 'BA', 'INTC', 'CSCO', 'PFE', 'KO', 'PEP', 'NKE', 'XOM', 'CVX'],
  Synthetics: ['Vol 75', 'Vol 100', 'Vol 10', 'Vol 25', 'Vol 50', 'Step Index', 'Boom 1000', 'Crash 1000', 'Boom 500', 'Crash 500', 'Boom 300', 'Crash 300', 'Jump 10', 'Jump 25', 'Jump 50', 'Jump 75', 'Jump 100']
};

const fetchMockSymbols = async (assetClass: AssetClass, query: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseSymbols = COMMON_SYMBOLS[assetClass];
      if (!query) {
        resolve(baseSymbols);
      } else {
        resolve(baseSymbols.filter(s => s.toLowerCase().includes(query.toLowerCase())));
      }
    }, 400); // Simulate network delay
  });
};

export function Calculator() {
  const haptic = useHaptic();
  const [activeCalculator, setActiveCalculator] = useState<string>('Hub');
  const [assetClass, setAssetClass] = useState<AssetClass>('Forex');
  const [assetSymbol, setAssetSymbol] = useState<string>('');
  const [showSymbolSuggestions, setShowSymbolSuggestions] = useState(false);
  const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
  const [isFetchingSymbols, setIsFetchingSymbols] = useState(false);
  const [accountBalance, setAccountBalance] = useState<string>('10000');
  const [riskPercent, setRiskPercent] = useState<string>('1');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [contractSize, setContractSize] = useState<string>('100000');
  const [slippage, setSlippage] = useState<string>('');
  const [commissions, setCommissions] = useState<string>('');
  const [spread, setSpread] = useState<string>('');
  const [conversionRate, setConversionRate] = useState<string>('1');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Pip Value Calculator State
  const [pipContractSize, setPipContractSize] = useState<string>('100000');
  const [pipCurrentPrice, setPipCurrentPrice] = useState<string>('');
  const [pipQuoteCurrency, setPipQuoteCurrency] = useState<string>('USD');
  const [pipAccountCurrency, setPipAccountCurrency] = useState<string>('USD');
  const [savedTrades, setSavedTrades] = useState<SavedTrade[]>([]);

  // Trade Planner Filters
  const [plannerSearchQuery, setPlannerSearchQuery] = useState('');
  const [plannerFilterAssetClass, setPlannerFilterAssetClass] = useState<AssetClass | 'All'>('All');
  const [plannerFilterDirection, setPlannerFilterDirection] = useState<'All' | 'Long' | 'Short'>('All');
  const [plannerFilterDateRange, setPlannerFilterDateRange] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');

  const filteredSavedTrades = useMemo(() => {
    return savedTrades.filter(trade => {
      // Search by Symbol
      if (plannerSearchQuery && !trade.assetSymbol.toLowerCase().includes(plannerSearchQuery.toLowerCase())) {
        return false;
      }
      // Filter by Asset Class
      if (plannerFilterAssetClass !== 'All' && trade.assetClass !== plannerFilterAssetClass) {
        return false;
      }
      // Filter by Direction
      const entry = parseFloat(trade.entryPrice);
      const stop = parseFloat(trade.stopLoss);
      if (plannerFilterDirection === 'Long' && entry <= stop) return false;
      if (plannerFilterDirection === 'Short' && entry >= stop) return false;
      
      // Filter by Date Range
      if (plannerFilterDateRange !== 'All') {
        const tradeDate = new Date(trade.timestamp);
        const now = new Date();
        if (plannerFilterDateRange === 'Today') {
          if (tradeDate.toDateString() !== now.toDateString()) return false;
        } else if (plannerFilterDateRange === 'Week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (tradeDate < oneWeekAgo) return false;
        } else if (plannerFilterDateRange === 'Month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (tradeDate < oneMonthAgo) return false;
        }
      }

      return true;
    });
  }, [savedTrades, plannerSearchQuery, plannerFilterAssetClass, plannerFilterDirection, plannerFilterDateRange]);

  React.useEffect(() => {
    let active = true;
    const fetchSymbols = async () => {
      setIsFetchingSymbols(true);
      const results = await fetchMockSymbols(assetClass, assetSymbol);
      if (active) {
        setFilteredSymbols(results);
        setIsFetchingSymbols(false);
      }
    };
    
    // Simple debounce
    const timeoutId = setTimeout(() => {
      fetchSymbols();
    }, 300);
    
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [assetClass, assetSymbol]);

  const handleAssetChange = (c: AssetClass) => {
    setAssetClass(c);
    if (c === 'Forex') setContractSize('100000');
    else if (c === 'Crypto') setContractSize('1');
    else if (c === 'Stocks') setContractSize('1');
    else if (c === 'Synthetics') setContractSize('1');
  };

  const results = useMemo(() => {
    const bal = parseFloat(accountBalance) || 0;
    const rPct = parseFloat(riskPercent) || 0;
    const ent = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tp = parseFloat(takeProfit) || 0;
    const cs = parseFloat(contractSize) || 1;
    const slip = parseFloat(slippage) || 0;
    const spr = parseFloat(spread) || 0;
    const comm = parseFloat(commissions) || 0;
    const rate = parseFloat(conversionRate) || 1;

    const riskAmount = bal * (rPct / 100);
    const slDistance = Math.abs(ent - sl);
    const tpDistance = Math.abs(tp - ent);
    const rrRatio = slDistance > 0 && tp > 0 ? tpDistance / slDistance : 0;
    
    // Add slippage and spread to the initial SL distance making the trade riskier per unit
    const adjustedSlDistance = slDistance + slip + spr;
    
    // Subtract fixed commissions from the allowed risk limit
    const effectiveRiskAmount = Math.max(0, riskAmount - comm);
    const effectiveRiskQuote = effectiveRiskAmount * rate;

    let positionSizeUnits = 0;
    let lotSize = 0;
    let potentialProfitAmount = 0;

    if (adjustedSlDistance > 0 && cs > 0) {
      positionSizeUnits = effectiveRiskQuote / adjustedSlDistance;
      lotSize = positionSizeUnits / cs;
    }

    if (tpDistance > 0 && positionSizeUnits > 0) {
      potentialProfitAmount = (positionSizeUnits * tpDistance) / rate;
    }

    return {
      riskAmount, // Max allowed total risk 
      effectiveRiskAmount, // Risk left for the SL distance
      slDistance, // Original SL Distance
      adjustedSlDistance,
      positionSizeUnits,
      lotSize,
      rrRatio,
      potentialProfitAmount
    };
  }, [accountBalance, riskPercent, entryPrice, stopLoss, takeProfit, contractSize, slippage, spread, commissions, conversionRate]);

  const handleSaveTrade = () => {
    if (results.lotSize <= 0) return;
    const newTrade: SavedTrade = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      assetClass,
      assetSymbol: assetSymbol || 'Unknown',
      entryPrice,
      stopLoss,
      takeProfit: takeProfit || undefined,
      riskAmount: results.riskAmount,
      lotSize: results.lotSize,
      rrRatio: results.rrRatio || undefined,
      potentialProfit: results.potentialProfitAmount || undefined
    };
    setSavedTrades([newTrade, ...savedTrades]);
  };

  const handleRemoveTrade = (id: string) => {
    setSavedTrades(savedTrades.filter(t => t.id !== id));
  };

  // Derived Risk Amount Input (change updates Risk %)
  const handleRiskAmountChange = (val: string) => {
    const rAmt = parseFloat(val);
    const bal = parseFloat(accountBalance);
    if (!isNaN(rAmt) && bal > 0) {
      setRiskPercent(((rAmt / bal) * 100).toFixed(2));
    } else {
      setRiskPercent('');
    }
  };

  const [drawdownPercent, setDrawdownPercent] = useState<string>('10');

  // Risk/Reward Evaluator State
  const [rrEntryPrice, setRrEntryPrice] = useState<string>('');
  const [rrStopLoss, setRrStopLoss] = useState<string>('');
  const [rrTakeProfit, setRrTakeProfit] = useState<string>('');

  const rrCalc = useMemo(() => {
    const entry = parseFloat(rrEntryPrice);
    const sl = parseFloat(rrStopLoss);
    const tp = parseFloat(rrTakeProfit);
    if (!entry || !sl || !tp) return null;

    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    const ratio = risk > 0 ? reward / risk : 0;
    
    let direction = 'Unknown';
    if (tp > entry && sl < entry) direction = 'Long';
    if (tp < entry && sl > entry) direction = 'Short';

    return { risk, reward, ratio, direction };
  }, [rrEntryPrice, rrStopLoss, rrTakeProfit]);

  const recoveryPercentRequired = useMemo(() => {
    const dd = parseFloat(drawdownPercent);
    if (!dd || dd <= 0 || dd >= 100) return 0;
    return ((1 / (1 - (dd / 100))) - 1) * 100;
  }, [drawdownPercent]);

  const pipValueResult = useMemo(() => {
    const cs = parseFloat(pipContractSize) || 0;
    const cp = parseFloat(pipCurrentPrice) || 0;
    const isJpy = pipQuoteCurrency.toUpperCase() === 'JPY';
    const pipDecimal = isJpy ? 0.01 : 0.0001;
    
    const pipValueInQuote = cs * pipDecimal;
    
    if (pipQuoteCurrency.toUpperCase() === pipAccountCurrency.toUpperCase()) {
      return pipValueInQuote;
    } else {
      return cp > 0 ? pipValueInQuote / cp : 0;
    }
  }, [pipContractSize, pipCurrentPrice, pipQuoteCurrency, pipAccountCurrency]);

  const renderSubHeader = (title: string, icon: React.ReactNode, subtitle: string) => (
    <div className="space-y-4 mb-6 select-none leading-none">
      <header className="flex items-center space-x-4">
        <button 
          onClick={() => { haptic('light'); setActiveCalculator('Hub'); }}
          className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-0.5 flex items-center space-x-2.5">
            {icon}
            <span>{title}</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </header>

      {/* Quick select scroll bar with elegant custom buttons */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 select-none">
        {CALCULATOR_TABS.map(tab => {
          const IconComponent = tab.icon;
          const isSelected = activeCalculator === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { haptic('light'); setActiveCalculator(tab.id); }}
              className={clsx(
                "flex items-center space-x-1.5 py-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                isSelected 
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/10" 
                  : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <IconComponent size={13} className={isSelected ? 'text-white' : tab.color} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (activeCalculator === 'Hub') {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20 md:pb-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Calculators</h1>
          <p className="text-gray-500 dark:text-gray-400">Practical trading calculators for sizing, risk, and system checks.</p>
        </header>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Trade Setup</h2>
              <p className="text-sm text-gray-500">Position size, pricing, margin, and trade outcome checks.</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              <button 
                onClick={() => { haptic('light'); setActiveCalculator('PositionSize'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <CalcIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">Position Size & Pip Value</h3>
                    <p className="text-sm text-gray-500">Calculate sizing based on risk, stop distance, and account size.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>
              
              <button 
                onClick={() => { haptic('light'); setActiveCalculator('RiskReward'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">Risk/Reward Evaluator</h3>
                    <p className="text-sm text-gray-500">Measure risk, reward, and R:R from entry, stop, and target.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>

              <button 
                onClick={() => { haptic('light'); setActiveCalculator('Leverage'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-cyan-500 transition-colors">Leverage & Margin</h3>
                    <p className="text-sm text-gray-500">Calculate buying power based on leverage.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>

              <button 
                onClick={() => { haptic('light'); setActiveCalculator('Profit'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">Profit Solver</h3>
                    <p className="text-sm text-gray-500">Calculate expected profit from targets and sizes.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>

              <button 
                onClick={() => { haptic('light'); setActiveCalculator('Margin'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">Margin Requirement</h3>
                    <p className="text-sm text-gray-500">Calculate required margin to open a position.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Risk Planning</h2>
              <p className="text-sm text-gray-500">Account-level drawdown, ruin probability, and portfolio exposure.</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              <button 
                onClick={() => { haptic('light'); setActiveCalculator('Drawdown'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <TrendingUp size={20} className="scale-y-[-1]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors">Drawdown Recovery</h3>
                    <p className="text-sm text-gray-500">See the recovery % needed after a drawdown.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>

              <button 
                onClick={() => { haptic('light'); setActiveCalculator('RiskOfRuin'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center">
                    <Skull size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">Risk of Ruin</h3>
                    <p className="text-sm text-gray-500">Calculate the probability of blowing your account.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>

              <button 
                onClick={() => { haptic('light'); setActiveCalculator('Consistency'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">Consistency Calculator</h3>
                    <p className="text-sm text-gray-500">Measure trading consistency based on trades and win rate.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Financial & Growth</h2>
              <p className="text-sm text-gray-500">Compounding growth, external costs, rebates, and conversions.</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              <button 
                onClick={() => { haptic('light'); setActiveCalculator('Compounding'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">Compounding Calculator</h3>
                    <p className="text-sm text-gray-500">Calculate the power of compound interest.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>
              
              <button 
                onClick={() => { haptic('light'); setActiveCalculator('SwapRollover'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-lime-50 dark:bg-lime-500/10 text-lime-500 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-lime-500 transition-colors">Swap/Rollover</h3>
                    <p className="text-sm text-gray-500">Calculate overnight holding costs or credits.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>

              <button 
                onClick={() => { haptic('light'); setActiveCalculator('Rebate'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 text-green-500 flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-green-500 transition-colors">Rebate Calculator</h3>
                    <p className="text-sm text-gray-500">Calculate expected cashback from trading volume.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>

              <button 
                onClick={() => { haptic('light'); setActiveCalculator('CurrencyConverter'); }}
                className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-sky-500 transition-colors">Currency Converter</h3>
                    <p className="text-sm text-gray-500">Convert values between currencies.</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 rotate-[-90deg] group-hover:text-gray-900 dark:group-hover:text-white transition-colors" size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeCalculator === 'Drawdown') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300">
        <header className="flex items-center space-x-4">
          <button 
            onClick={() => { haptic('light'); setActiveCalculator('Hub'); }}
            className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1 flex items-center space-x-3">
              <TrendingUp className="text-rose-400 scale-y-[-1]" size={28} />
              <span>Drawdown Recovery</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Calculate the exact percentage recovery required to return to breakeven after a drawdown.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Current Drawdown (%)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Percent size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={drawdownPercent}
                    onChange={(e) => setDrawdownPercent(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl px-12 py-3 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/30 transition-all font-mono text-lg"
                    placeholder="10"
                    step="0.5"
                    max="99.9"
                  />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/5 space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Required Recovery:</span>
                  <span className="text-3xl font-bold font-display text-emerald-500">
                    +{recoveryPercentRequired.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20 p-6 flex flex-col justify-center items-center text-center">
              <HelpCircle size={32} className="text-rose-500 mb-3" />
              <h3 className="font-bold text-rose-900 dark:text-rose-100 mb-2">The math behind drawdown</h3>
              <p className="text-rose-800 dark:text-rose-200/80 text-sm leading-relaxed max-w-sm">
                Recovering from a drawdown is asymmetric. A 10% loss requires an 11.11% gain to recover. But a 50% loss requires a 100% gain (doubling your remaining account) just to get back to breakeven.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeCalculator === 'RiskReward') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300">
        <header className="flex items-center space-x-4">
          <button 
            onClick={() => { haptic('light'); setActiveCalculator('Hub'); }}
            className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1 flex items-center space-x-3">
              <Target className="text-indigo-400" size={28} />
              <span>Risk/Reward Evaluator</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Measure risk, reward, and R:R from entry, stop, and target.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trade Levels</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-400 font-medium block">Entry Price</label>
                <input
                  type="number"
                  value={rrEntryPrice}
                  onChange={(e) => setRrEntryPrice(e.target.value)}
                  className="glass-input font-mono text-lg"
                  placeholder="e.g. 150.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-400 font-medium block">Stop Loss</label>
                <input
                  type="number"
                  value={rrStopLoss}
                  onChange={(e) => setRrStopLoss(e.target.value)}
                  className="glass-input font-mono text-lg"
                  placeholder="e.g. 145.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-400 font-medium block">Take Profit</label>
                <input
                  type="number"
                  value={rrTakeProfit}
                  onChange={(e) => setRrTakeProfit(e.target.value)}
                  className="glass-input font-mono text-lg"
                  placeholder="e.g. 165.00"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4 flex flex-col">
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-8 flex-1 flex flex-col justify-center items-center text-center shadow-sm">
              <h3 className="text-indigo-400/80 font-medium tracking-widest text-xs uppercase mb-1">Risk / Reward Ratio</h3>
              <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
                {rrCalc && rrCalc.ratio > 0 ? `1 : ${rrCalc.ratio.toFixed(2)}` : '0 : 0'}
              </div>

              {rrCalc && rrCalc.ratio > 0 && (
                 <div className="flex w-full items-center justify-center gap-6 divide-x divide-white/10">
                    <div className="px-4">
                       <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Direction</p>
                       <p className={clsx("text-lg font-bold", rrCalc.direction === 'Long' ? "text-emerald-400" : rrCalc.direction === 'Short' ? "text-rose-400" : "text-gray-400")}>
                          {rrCalc.direction}
                       </p>
                    </div>
                    <div className="px-4">
                       <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Risk (Units)</p>
                       <p className="text-lg text-rose-400 font-mono font-bold">{rrCalc.risk.toFixed(4)}</p>
                    </div>
                    <div className="px-4">
                       <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Reward (Units)</p>
                       <p className="text-lg text-emerald-400 font-mono font-bold">{rrCalc.reward.toFixed(4)}</p>
                    </div>
                 </div>
              )}
            </div>

            {rrCalc && rrCalc.ratio > 0 && (
              <div className={clsx("border rounded-xl p-4 text-center", rrCalc.ratio >= 2 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : rrCalc.ratio >= 1 ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400")}>
                <p className="font-bold text-sm">
                  {rrCalc.ratio >= 2 ? "Excellent R:R! This aligns with institutional risk management standards." 
                  : rrCalc.ratio >= 1 ? "Acceptable R:R, but leaves little margin for a low win rate." 
                  : "Poor R:R. You are risking more than you stand to gain."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeCalculator === 'Consistency') {
    return <ConsistencyCalculator renderSubHeader={renderSubHeader} />;
  }

  if (activeCalculator === 'Compounding') {
    return <CompoundingCalculator renderSubHeader={renderSubHeader} />;
  }

  if (activeCalculator === 'Rebate') {
    return <RebateCalculator renderSubHeader={renderSubHeader} />;
  }

  if (activeCalculator === 'SwapRollover') {
    return <SwapRolloverCalculator renderSubHeader={renderSubHeader} />;
  }

  if (activeCalculator === 'Leverage') {
    return <LeverageCalculator renderSubHeader={renderSubHeader} />;
  }

  if (activeCalculator === 'CurrencyConverter') {
    return <CurrencyConverter renderSubHeader={renderSubHeader} />;
  }

  if (activeCalculator === 'Profit') {
    return <ProfitCalculator renderSubHeader={renderSubHeader} />;
  }

  if (activeCalculator === 'Margin') {
    return <MarginCalculator renderSubHeader={renderSubHeader} />;
  }

  if (activeCalculator === 'RiskOfRuin') {
    return <RiskOfRuinCalculator renderSubHeader={renderSubHeader} />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      <header className="flex items-center space-x-4">
        <button 
          onClick={() => { haptic('light'); setActiveCalculator('Hub'); }}
          className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center space-x-3 mb-1">
            <CalcIcon className="text-blue-400" size={28} />
            <span>Position Size & Lot Calculator</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Calculate exact position sizes to manage your risk perfectly across all asset classes.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">1. Asset Class</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Forex', 'Crypto', 'Stocks', 'Synthetics'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => handleAssetChange(c)}
                  className={clsx(
                    'py-2 px-3 rounded-lg text-sm font-medium transition-all border',
                    assetClass === c 
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-inner' 
                      : 'bg-white dark:bg-white/5 shadow-sm dark:shadow-none border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none hover:text-gray-200'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Account & Risk</h2>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block">Account Balance ($)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={16} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  className="glass-input pl-10"
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block">Risk Percentage (%)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Percent size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="number"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    className="glass-input pl-10"
                    placeholder="1"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block">Risk Amount ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="number"
                    value={results.riskAmount ? results.riskAmount.toFixed(2) : ''}
                    onChange={(e) => handleRiskAmountChange(e.target.value)}
                    className="glass-input pl-10 bg-white dark:bg-white/5 shadow-sm dark:shadow-none"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Trade Parameters</h2>
            
            <div className="space-y-2 relative">
              <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 flex items-center">
                Asset Symbol
                {assetClass === 'Forex' && (
                  <InfoTooltip content={
                    <div className="space-y-1 block">
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Common Forex Pairs</div>
                      <div><span className="text-blue-400 font-medium">EUR/USD, GBP/USD, AUD/USD:</span> 1 pip = 0.0001. (~$10/std lot)</div>
                      <div><span className="text-blue-400 font-medium">USD/JPY, EUR/JPY, GBP/JPY:</span> 1 pip = 0.01. (~$6-7/std lot)</div>
                      <div><span className="text-blue-400 font-medium">USD/CAD, USD/CHF:</span> 1 pip = 0.0001. (~$7-8/std lot)</div>
                    </div>
                  } />
                )}
              </label>
              <input
                type="text"
                value={assetSymbol}
                onFocus={() => setShowSymbolSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSymbolSuggestions(false), 200)}
                onChange={(e) => setAssetSymbol(e.target.value.toUpperCase())}
                className="glass-input uppercase"
                placeholder="e.g. EURUSD, BTC, AAPL"
              />
              {showSymbolSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {isFetchingSymbols ? (
                    <div className="px-4 py-3 sm:py-2 text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm italic">
                      Fetching symbols...
                    </div>
                  ) : filteredSymbols.length > 0 ? (
                    filteredSymbols.map(sym => (
                      <div 
                        key={sym} 
                        className="px-4 py-3 sm:py-2 hover:bg-blue-600/20 cursor-pointer text-gray-200 transition-colors"
                        onClick={() => {
                          setAssetSymbol(sym);
                          setShowSymbolSuggestions(false);
                        }}
                      >
                        {sym}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 sm:py-2 text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm">
                      No matching symbols found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block">Entry Price</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Target size={16} className="text-blue-400" />
                  </div>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="glass-input pl-10"
                    placeholder="e.g. 1.1050"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block">Stop Loss Price</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldAlert size={16} className="text-orange-400" />
                  </div>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="glass-input pl-10"
                    placeholder="e.g. 1.1000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block">Take Profit (Opt.)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Target size={16} className="text-emerald-400" />
                  </div>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="glass-input pl-10 border-emerald-500/30 focus:border-emerald-400 focus:ring-emerald-400/20"
                    placeholder="e.g. 1.1200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 flex items-center justify-between">
                <span className="flex items-center">
                  Contract Size (Units per Lot)
                  <InfoTooltip content={
                    <div className="space-y-1 block">
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Contract Size & Pip Value</div>
                      <div><span className="text-blue-400 font-medium">Forex:</span> 100,000 (Standard, ~$10/pip), 10,000 (Mini, ~$1/pip), 1,000 (Micro, ~$0.10/pip).</div>
                      <div><span className="text-blue-400 font-medium">Crypto:</span> Typically 1 unit = 1 coin per lot.</div>
                      <div><span className="text-blue-400 font-medium">Stocks:</span> Typically 1 unit = 1 share per lot.</div>
                      <div><span className="text-blue-400 font-medium">Synthetics (Deriv):</span> Varies by index (e.g., Volatility 75 index contract size is 1).</div>
                    </div>
                  } />
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash size={16} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  value={contractSize}
                  onChange={(e) => setContractSize(e.target.value)}
                  className="glass-input pl-10 text-gray-600 dark:text-gray-300"
                  placeholder="100000"
                />
              </div>
            </div>

            {/* Advanced Section */}
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
              <button 
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors py-2"
              >
                <SlidersHorizontal size={16} />
                <span className="font-semibold">Advanced Options</span>
                {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isAdvancedOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 flex items-center" title="Slippage in price units">
                      Slippage
                      <InfoTooltip content={
                        <div className="space-y-1 block">
                          <div className="font-semibold text-gray-900 dark:text-white mb-1">Slippage (in price units)</div>
                          <div><span className="text-blue-400 font-medium">Forex:</span> e.g. 0.0001 for 1 pip slippage.</div>
                          <div><span className="text-blue-400 font-medium">Others:</span> Exact expected price deviation (e.g. 1.50).</div>
                          <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400 dark:text-gray-500 dark:text-gray-400">Safeguards estimates by anticipating negative slippage.</div>
                        </div>
                      } />
                    </label>
                    <input
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      className="glass-input"
                      placeholder="e.g. 0.0001"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 flex items-center" title="Spread in price units">
                      Spread
                      <InfoTooltip content={
                        <div className="space-y-1 block">
                          <div className="font-semibold text-gray-900 dark:text-white mb-1">Spread (in price units)</div>
                          <div><span className="text-blue-400 font-medium">Forex:</span> e.g. 0.0002 for 2 pips on EUR/USD.</div>
                          <div><span className="text-blue-400 font-medium">Others:</span> Exact price difference (e.g. 1.50 for $1.50 spread).</div>
                          <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400 dark:text-gray-500 dark:text-gray-400">Increases your total stop loss distance to account for broker spread.</div>
                        </div>
                      } />
                    </label>
                    <input
                      type="number"
                      value={spread}
                      onChange={(e) => setSpread(e.target.value)}
                      className="glass-input"
                      placeholder="e.g. 0.0002"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block" title="Total commissions in $">Commissions ($)</label>
                    <input
                      type="number"
                      value={commissions}
                      onChange={(e) => setCommissions(e.target.value)}
                      className="glass-input"
                      placeholder="e.g. 5"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block" title="Multiplier to convert Account Currency to Quote Currency">Conv. Rate</label>
                    <input
                      type="number"
                      value={conversionRate}
                      onChange={(e) => setConversionRate(e.target.value)}
                      className="glass-input"
                      placeholder="e.g. 1.0"
                      step="any"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pip Value Section (Forex Only) */}
            {assetClass === 'Forex' && (
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. Pip Value Calculator</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block">Contract Size</label>
                    <input
                      type="number"
                      value={pipContractSize}
                      onChange={(e) => setPipContractSize(e.target.value)}
                      className="glass-input"
                      placeholder="100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block" title="Current pair price or Quote/Account exchange rate">Current Price</label>
                    <input
                      type="number"
                      value={pipCurrentPrice}
                      onChange={(e) => setPipCurrentPrice(e.target.value)}
                      className="glass-input"
                      placeholder="e.g. 1.1050"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block">Quote Currency</label>
                    <input
                      type="text"
                      value={pipQuoteCurrency}
                      onChange={(e) => setPipQuoteCurrency(e.target.value.toUpperCase())}
                      className="glass-input"
                      placeholder="USD"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 block">Account Currency</label>
                    <input
                      type="text"
                      value={pipAccountCurrency}
                      onChange={(e) => setPipAccountCurrency(e.target.value.toUpperCase())}
                      className="glass-input"
                      placeholder="USD"
                      maxLength={3}
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-lg border border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">Pip Value (in Account Currency):</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {pipValueResult > 0 ? pipValueResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6 flex flex-col">
          <div className="glass-panel p-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20 flex-1 flex flex-col justify-center items-center text-center">
            <h3 className="text-gray-400 dark:text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wide text-sm">Recommended Lot Size</h3>
            <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
              {results.lotSize > 0 ? (
                results.lotSize < 0.01 && assetClass === 'Forex' ? '< 0.01' : results.lotSize.toLocaleString(undefined, { maximumFractionDigits: (assetClass === 'Crypto' || assetClass === 'Synthetics') ? 4 : 2 })
              ) : '0.00'}
            </div>
            <p className="text-sm text-blue-200 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20 inline-block">
              Total Units/Shares: <span className="font-bold text-gray-900 dark:text-white">{results.positionSizeUnits > 0 ? results.positionSizeUnits.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4">
              <div className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Value at Risk</div>
              <div className="text-2xl font-bold text-red-400">
                ${results.riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="glass-panel p-4">
              <div className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Potential Profit</div>
              <div className="text-2xl font-bold text-emerald-400">
                ${results.potentialProfitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="glass-panel p-4">
              <div className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Risk/Reward</div>
              <div className="text-2xl font-bold text-blue-400">
                {results.rrRatio > 0 ? `1 : ${results.rrRatio.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '-'}
              </div>
            </div>
            <div className="glass-panel p-4">
              <div className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
                {results.adjustedSlDistance > results.slDistance ? 'Adj. SL Dist' : 'SL Distance'}
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {results.adjustedSlDistance.toLocaleString(undefined, { maximumFractionDigits: 5 })}
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 border-l-4 border-l-blue-500 bg-blue-500/5">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">How this is calculated</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 leading-relaxed">
              Formulas assume account currency matches the quote currency of the asset (e.g., trading EUR/USD with a USD account). If trading cross pairs (like GBP/JPY on a USD account), the actual risk amount may slightly vary due to real-time exchange rates. Always double-check your platform's pip value.
            </p>
          </div>
          
          <button
            onClick={handleSaveTrade}
            disabled={results.lotSize <= 0}
            className="w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 text-gray-900 dark:text-white shadow-lg"
          >
            <Bookmark size={20} />
            <span>Save to Trade Planner</span>
          </button>
        </div>
      </div>

      {/* Trade Planner & Memory Section */}
      <div className="glass-panel p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Clock className="text-emerald-400" />
            <span>Trade Planner & Memory</span>
          </h2>
          <span className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 bg-gray-800 px-3 py-1 rounded-full">{savedTrades.length} Saved</span>
        </div>

        {savedTrades.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-700/50 rounded-xl">
            <Bookmark size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Your saved trades will appear here.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Configure a trade and click 'Save to Trade Planner' to remember it.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative col-span-1 border border-gray-700 rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  className="w-full bg-gray-800/50 text-gray-200 outline-none px-10 py-2 rounded-lg text-sm"
                  placeholder="Search symbol..."
                  value={plannerSearchQuery}
                  onChange={(e) => setPlannerSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="col-span-1 border border-gray-700 rounded-lg overflow-hidden relative">
                <select
                  className="w-full bg-gray-800/50 text-gray-200 outline-none px-3 py-2 text-sm appearance-none"
                  value={plannerFilterAssetClass}
                  onChange={(e) => setPlannerFilterAssetClass(e.target.value as any)}
                >
                  <option value="All">All Assets</option>
                  <option value="Forex">Forex</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Synthetics">Synthetics</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 dark:text-gray-400 pointer-events-none" />
              </div>

              <div className="col-span-1 border border-gray-700 rounded-lg overflow-hidden relative">
                <select
                  className="w-full bg-gray-800/50 text-gray-200 outline-none px-3 py-2 text-sm appearance-none"
                  value={plannerFilterDirection}
                  onChange={(e) => setPlannerFilterDirection(e.target.value as any)}
                >
                  <option value="All">All Directions</option>
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 dark:text-gray-400 pointer-events-none" />
              </div>

              <div className="col-span-1 border border-gray-700 rounded-lg overflow-hidden relative">
                <select
                  className="w-full bg-gray-800/50 text-gray-200 outline-none px-3 py-2 text-sm appearance-none"
                  value={plannerFilterDateRange}
                  onChange={(e) => setPlannerFilterDateRange(e.target.value as any)}
                >
                  <option value="All">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Week">Last 7 Days</option>
                  <option value="Month">Last 30 Days</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 dark:text-gray-400 pointer-events-none" />
              </div>
            </div>

            {filteredSavedTrades.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400">No saved trades match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSavedTrades.map(trade => {
                  const entry = parseFloat(trade.entryPrice);
                  const stop = parseFloat(trade.stopLoss);
                  const isLong = entry > stop;
                  const isShort = entry < stop;
                  const directionLabel = isLong ? 'Long' : (isShort ? 'Short' : '-');
                  const directionColor = isLong 
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' 
                    : (isShort ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-gray-400 dark:text-gray-500 dark:text-gray-400 border-gray-500/30 bg-gray-500/10');

                  return (
                    <div key={trade.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 relative group">
                      <button 
                        onClick={() => handleRemoveTrade(trade.id)}
                        className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove saved trade"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {trade.assetClass}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${directionColor}`}>
                            {directionLabel}
                          </span>
                          <span className="font-bold text-gray-200">{trade.assetSymbol}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Entry:</span>
                          <span className="text-gray-200 font-medium">{trade.entryPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Stop Loss:</span>
                          <span className="text-red-400 font-medium">{trade.stopLoss}</span>
                        </div>
                        {trade.takeProfit && (
                          <div className="flex justify-between">
                            <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Take Profit:</span>
                            <span className="text-emerald-400 font-medium">{trade.takeProfit}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Risk Amount:</span>
                          <span className="text-yellow-400 font-medium">${trade.riskAmount.toFixed(2)}</span>
                        </div>
                        {trade.potentialProfit !== undefined && trade.potentialProfit > 0 && (
                          <div className="flex justify-between relative group">
                            <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400 cursor-help border-b border-dashed border-gray-500">Reward:</span>
                            <span className="text-emerald-400 font-medium">${trade.potentialProfit.toFixed(2)}</span>
                            {trade.rrRatio !== undefined && trade.rrRatio > 0 && (
                              <div className="absolute right-0 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 border border-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
                                R:R = 1 : {trade.rrRatio.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-700/50 mt-2">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">Lot Size:</span>
                          <span className="text-emerald-400 font-bold">{trade.lotSize.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end">
                        <button 
                          onClick={() => {
                            handleAssetChange(trade.assetClass);
                            setAssetSymbol(trade.assetSymbol);
                            setEntryPrice(trade.entryPrice);
                            setStopLoss(trade.stopLoss);
                            if (trade.takeProfit) setTakeProfit(trade.takeProfit);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Load into Calculator &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
