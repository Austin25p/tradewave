import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { DollarSign, Percent, Target, ShieldAlert, Hash, Clock, RefreshCw, BarChart2, TrendingUp, HelpCircle } from 'lucide-react';

export function ConsistencyCalculator({ renderSubHeader }: any) {
  const [trades, setTrades] = useState('100');
  const [winRate, setWinRate] = useState('50');

  const consistencyScore = useMemo(() => {
    const t = parseInt(trades) || 0;
    const wr = parseFloat(winRate) || 0;
    if (t <= 0 || wr <= 0) return 0;
    // Mock consistency score formula
    return Math.min(100, Math.max(0, wr * (1 - 1/Math.sqrt(t))));
  }, [trades, winRate]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      {renderSubHeader('Consistency Calculator', <Target className="text-rose-400" size={28} />, 'Measure your trading consistency over time based on trade count and win rate.')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Number of Trades</label>
            <input type="number" value={trades} onChange={(e) => setTrades(e.target.value)} className="glass-input font-mono text-lg" placeholder="e.g. 100" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Win Rate (%)</label>
            <input type="number" value={winRate} onChange={(e) => setWinRate(e.target.value)} className="glass-input font-mono text-lg" placeholder="e.g. 50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-900/20 to-orange-900/20 border border-rose-500/20 rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm">
          <h3 className="text-rose-400/80 font-medium tracking-widest text-xs uppercase mb-1">Consistency Score</h3>
          <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-400">
            {consistencyScore.toFixed(1)} / 100
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompoundingCalculator({ renderSubHeader }: any) {
  const [startBalance, setStartBalance] = useState('1000');
  const [periods, setPeriods] = useState('12');
  const [gainPerPeriod, setGainPerPeriod] = useState('5');

  const finalBalance = useMemo(() => {
    const bal = parseFloat(startBalance) || 0;
    const p = parseInt(periods) || 0;
    const g = parseFloat(gainPerPeriod) || 0;
    return bal * Math.pow(1 + g / 100, p);
  }, [startBalance, periods, gainPerPeriod]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      {renderSubHeader('Compounding Calculator', <TrendingUp className="text-purple-400" size={28} />, 'Calculate the power of compound interest for your trading account.')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Starting Balance</label>
            <input type="number" value={startBalance} onChange={(e) => setStartBalance(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Periods (e.g. Months)</label>
            <input type="number" value={periods} onChange={(e) => setPeriods(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Gain Per Period (%)</label>
            <input type="number" value={gainPerPeriod} onChange={(e) => setGainPerPeriod(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm">
          <h3 className="text-purple-400/80 font-medium tracking-widest text-xs uppercase mb-1">Final Balance</h3>
          <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            ${finalBalance.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RebateCalculator({ renderSubHeader }: any) {
  const [volume, setVolume] = useState('100');
  const [rebateRate, setRebateRate] = useState('2');

  const totalRebate = useMemo(() => {
    const v = parseFloat(volume) || 0;
    const r = parseFloat(rebateRate) || 0;
    return v * r;
  }, [volume, rebateRate]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      {renderSubHeader('Rebate Calculator', <DollarSign className="text-green-500" size={28} />, 'Calculate expected cashback from trading volume.')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Trading Volume (Lots)</label>
            <input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Rebate per Lot ($)</label>
            <input type="number" value={rebateRate} onChange={(e) => setRebateRate(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm">
          <h3 className="text-green-400/80 font-medium tracking-widest text-xs uppercase mb-1">Total Rebate</h3>
          <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
            ${totalRebate.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SwapRolloverCalculator({ renderSubHeader }: any) {
  const [lots, setLots] = useState('1');
  const [swapLong, setSwapLong] = useState('-5.5');
  const [swapShort, setSwapShort] = useState('1.2');
  const [nights, setNights] = useState('3');

  const longCost = useMemo(() => {
    return (parseFloat(lots) || 0) * (parseFloat(swapLong) || 0) * (parseFloat(nights) || 0);
  }, [lots, swapLong, nights]);

  const shortCost = useMemo(() => {
    return (parseFloat(lots) || 0) * (parseFloat(swapShort) || 0) * (parseFloat(nights) || 0);
  }, [lots, swapShort, nights]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      {renderSubHeader('Swap/Rollover', <Clock className="text-lime-500" size={28} />, 'Calculate overnight holding costs or credits.')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Lot Size</label>
            <input type="number" value={lots} onChange={(e) => setLots(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Swap Long (points/$)</label>
            <input type="number" value={swapLong} onChange={(e) => setSwapLong(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Swap Short (points/$)</label>
            <input type="number" value={swapShort} onChange={(e) => setSwapShort(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Nights Held</label>
            <input type="number" value={nights} onChange={(e) => setNights(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-br from-lime-900/20 to-emerald-900/20 border border-lime-500/20 rounded-xl p-6 flex-1 flex flex-col justify-center items-center text-center shadow-sm">
            <h3 className="text-lime-400/80 font-medium tracking-widest text-xs uppercase mb-1">Cost for Long</h3>
            <div className={`text-4xl font-bold font-mono ${longCost >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {longCost > 0 ? "+" : ""}{longCost.toFixed(2)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-lime-900/20 to-emerald-900/20 border border-lime-500/20 rounded-xl p-6 flex-1 flex flex-col justify-center items-center text-center shadow-sm">
             <h3 className="text-lime-400/80 font-medium tracking-widest text-xs uppercase mb-1">Cost for Short</h3>
             <div className={`text-4xl font-bold font-mono ${shortCost >= 0 ? "text-emerald-400" : "text-red-400"}`}>
               {shortCost > 0 ? "+" : ""}{shortCost.toFixed(2)}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeverageCalculator({ renderSubHeader }: any) {
  const [balance, setBalance] = useState('1000');
  const [leverage, setLeverage] = useState('100');
  
  const buyingPower = useMemo(() => {
    return (parseFloat(balance) || 0) * (parseFloat(leverage) || 0);
  }, [balance, leverage]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      {renderSubHeader('Leverage Calculator', <TrendingUp className="text-cyan-500" size={28} />, 'Calculate total buying power based on leverage.')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Account Balance</label>
            <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Leverage (1:X)</label>
            <input type="number" value={leverage} onChange={(e) => setLeverage(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm">
          <h3 className="text-cyan-400/80 font-medium tracking-widest text-xs uppercase mb-1">Buying Power</h3>
          <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            ${buyingPower.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CurrencyConverter({ renderSubHeader }: any) {
  const [amount, setAmount] = useState('1000');
  const [exchangeRate, setExchangeRate] = useState('1.10');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');

  const convertedValue = useMemo(() => {
    return (parseFloat(amount) || 0) * (parseFloat(exchangeRate) || 0);
  }, [amount, exchangeRate]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      {renderSubHeader('Currency Converter', <RefreshCw className="text-blue-400" size={28} />, 'Convert values between currencies.')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#151516] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Amount</label>
            <div className="flex gap-2">
               <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="glass-input font-mono text-lg flex-1" />
               <input type="text" value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="glass-input text-center w-20" placeholder="e.g. EUR" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Target Currency</label>
            <input type="text" value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="glass-input font-mono text-lg" placeholder="e.g. USD" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Exchange Rate ({fromCurrency} to {toCurrency})</label>
            <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-sky-900/20 border border-blue-500/20 rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm">
          <h3 className="text-blue-400/80 font-medium tracking-widest text-xs uppercase mb-1">Converted Amount</h3>
          <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-sky-400 break-all">
            {convertedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-3xl text-blue-300">{toCurrency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfitCalculator({ renderSubHeader }: any) {
  const [entryPrice, setEntryPrice] = useState('150.00');
  const [exitPrice, setExitPrice] = useState('155.00');
  const [lotSize, setLotSize] = useState('1');
  const [contractSize, setContractSize] = useState('100000');
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');

  const profit = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const exit = parseFloat(exitPrice) || 0;
    const lots = parseFloat(lotSize) || 0;
    const cs = parseFloat(contractSize) || 0;

    const priceDiff = direction === 'Long' ? (exit - entry) : (entry - exit);
    return priceDiff * lots * cs;
  }, [entryPrice, exitPrice, lotSize, contractSize, direction]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      {renderSubHeader('Profit Solver', <TrendingUp className="text-emerald-500" size={28} />, 'Calculate expected profit based on entry and exit targets.')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setDirection('Long')} className={`flex-1 py-2 rounded font-medium transition-colors ${direction === 'Long' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Long</button>
            <button onClick={() => setDirection('Short')} className={`flex-1 py-2 rounded font-medium transition-colors ${direction === 'Short' ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Short</button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Entry Price</label>
            <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Exit / Target Price</label>
            <input type="number" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Lot Size</label>
              <input type="number" value={lotSize} onChange={(e) => setLotSize(e.target.value)} className="glass-input font-mono text-lg" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Contract Size</label>
              <input type="number" value={contractSize} onChange={(e) => setContractSize(e.target.value)} className="glass-input font-mono text-lg" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${profit >= 0 ? 'from-emerald-900/20 to-teal-900/20 border-emerald-500/20 text-emerald-400' : 'from-rose-900/20 to-red-900/20 border-rose-500/20 text-rose-400'} border rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm`}>
          <h3 className="font-medium tracking-widest text-xs uppercase mb-1 opacity-80">Estimated PnL</h3>
        </div>
      </div>
    </div>
  );
}

export function MarginCalculator({ renderSubHeader }: any) {
  const [assetPrice, setAssetPrice] = useState('150.00');
  const [lotSize, setLotSize] = useState('1');
  const [contractSize, setContractSize] = useState('100000');
  const [leverage, setLeverage] = useState('100');

  const requiredMargin = useMemo(() => {
    const price = parseFloat(assetPrice) || 0;
    const lots = parseFloat(lotSize) || 0;
    const cs = parseFloat(contractSize) || 0;
    const lev = parseFloat(leverage) || 1;

    return lev > 0 ? (price * lots * cs) / lev : 0;
  }, [assetPrice, lotSize, contractSize, leverage]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      {renderSubHeader('Margin Requirement', <ShieldAlert className="text-orange-500" size={28} />, 'Calculate required margin to open a position.')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Asset Price</label>
            <input type="number" value={assetPrice} onChange={(e) => setAssetPrice(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Lot Size</label>
            <input type="number" value={lotSize} onChange={(e) => setLotSize(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Contract Size</label>
            <input type="number" value={contractSize} onChange={(e) => setContractSize(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Leverage (1:X)</label>
            <input type="number" value={leverage} onChange={(e) => setLeverage(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 border border-orange-500/20 rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm">
          <h3 className="text-orange-400/80 font-medium tracking-widest text-xs uppercase mb-1">Required Margin</h3>
          <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400 break-all">
            ${requiredMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RiskOfRuinCalculator({ renderSubHeader }: any) {
  const [winRate, setWinRate] = useState('50');
  const [payoffRatio, setPayoffRatio] = useState('2');
  const [riskPerTrade, setRiskPerTrade] = useState('1'); // %
  const [ruinLevel, setRuinLevel] = useState('50'); // %

  const probabilityOfRuin = useMemo(() => {
    const p = (parseFloat(winRate) || 0) / 100;
    const rr = parseFloat(payoffRatio) || 0;
    const rpt = (parseFloat(riskPerTrade) || 1) / 100;
    const rl = (parseFloat(ruinLevel) || 50) / 100;
    
    if (p <= 0 || p >= 1 || rr <= 0 || rpt <= 0 || rl <= 0 || rl > 1) return 0;
    
    // Simplified risk of ruin formula
    // E = probability of loss / probability of win
    const q = 1 - p;
    // Edge (EV)
    if (rr * p - q <= 0) return 100; // Expected value <= 0 means ruin is inevitable
    
    // Using simple ruin formula for continuous Kelly approximation: P = e^(-2 * edge / variance * capital)
    // Actually standard simple formula is : ((1 - Edge) / (1 + Edge)) ^ Units
    const edge = (rr * p) - q;
    if (edge <= 0) return 100;
    // Approximate Kelly ROR
    const units = rl / rpt; 
    const ror = Math.pow((1 - edge)/(1 + edge), units);
    return Math.min(100, Math.max(0, ror * 100));
  }, [winRate, payoffRatio, riskPerTrade, ruinLevel]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 pb-20 md:pb-6">
      {renderSubHeader('Risk Of Ruin', <HelpCircle className="text-red-500" size={28} />, 'Calculate the probability of losing a certain percentage of your account.')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Win Rate (%)</label>
            <input type="number" value={winRate} onChange={(e) => setWinRate(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Payoff Ratio (R:R)</label>
            <input type="number" value={payoffRatio} onChange={(e) => setPayoffRatio(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Risk Per Trade (%)</label>
            <input type="number" value={riskPerTrade} onChange={(e) => setRiskPerTrade(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Loss Level Meaning "Ruin" (%)</label>
            <input type="number" value={ruinLevel} onChange={(e) => setRuinLevel(e.target.value)} className="glass-input font-mono text-lg" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/20 rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm">
          <h3 className="text-red-400/80 font-medium tracking-widest text-xs uppercase mb-1">Probability Of Ruin</h3>
          <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400 break-all">
            {probabilityOfRuin < 0.01 && probabilityOfRuin > 0 ? '< 0.01' : probabilityOfRuin.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
          </div>
        </div>
      </div>
    </div>
  );
}
