import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, TrendingUp, ExternalLink, RefreshCw, Calendar, Clock, Globe, CalendarDays } from 'lucide-react';
import { EconomicCalendar } from 'react-ts-tradingview-widgets';
import { clsx } from 'clsx';

interface NewsArticle {
  id: string;
  guid: string;
  published_on: number;
  imageurl: string;
  title: string;
  url: string;
  source: string;
  body: string;
  tags: string;
  categories: string;
  upvotes: string;
  downvotes: string;
  lang: string;
  impact?: 'High' | 'Medium' | 'Low';
  eventType?: string;
  affectedAssets?: string[];
  source_info: {
    name: string;
    img: string;
    lang: string;
  };
}

export function MarketNews() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Markets' | 'Bitcoin' | 'Blockchain' | 'Regulation'>('All');
  const [viewMode, setViewMode] = useState<'news' | 'calendar'>('news');

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = filter === 'All' ? 'markets' : filter;
      const res = await fetch('/api/news?q=' + encodeURIComponent(q));
      if (!res.ok) throw new Error('Failed to fetch news data');
      const data = await res.json();
      if (data && Array.isArray(data.Data)) {
        setNews(data.Data);
      } else if (data && Array.isArray(data)) {
        setNews(data);
      } else {
         throw new Error("Invalid format received from news API");
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching news.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [filter]);

  const getFilterSynonyms = (f: string) => {
    switch(f) {
      case 'Bitcoin': return ['btc', 'bitcoin'];
      case 'Markets': return ['market', 'exchange', 'trading', 'fiat'];
      case 'Blockchain': return ['blockchain', 'tech', 'mining'];
      case 'Regulation': return ['regulation', 'legal', 'government', 'sec'];
      default: return [];
    }
  };

  const filteredNews = (Array.isArray(news) ? news : []).filter(item => {
    if (filter === 'All') return true;
    const searchTerms = getFilterSynonyms(filter);
    const contentToSearch = `${item.title} ${item.categories} ${item.tags} ${item.body}`.toLowerCase();
    return searchTerms.some(term => contentToSearch.includes(term));
  });

  // Get trending news (first 3)
  const trendingNews = filteredNews.slice(0, 3);
  const regularNews = filteredNews.slice(3, 50); // limit to 50 items

  return (
    <div className="flex flex-col h-full space-y-6 font-sans max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 p-1">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2 flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Newspaper className="text-blue-400" size={28} />
            </div>
            <span>Market Events & News</span>
          </h1>
          <p className="text-gray-400">Real-time global financial and crypto market updates.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 backdrop-blur-md overflow-x-auto w-full sm:w-auto custom-scrollbar">
            {['All', 'Markets', 'Bitcoin', 'Blockchain', 'Regulation'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={clsx(
                  "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0",
                  filter === f 
                    ? "bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.15)]" 
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex bg-black/40 rounded-xl border border-white/5 backdrop-blur-md p-1">
            <button
               onClick={() => setViewMode('news')}
               className={clsx(
                  "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2",
                  viewMode === 'news' ? "bg-indigo-600/20 text-indigo-400" : "text-gray-400 hover:bg-white/5"
               )}
            >
               <Newspaper size={16} className="shrink-0" /> <span className="hidden sm:inline">News</span>
            </button>
            <button
               onClick={() => setViewMode('calendar')}
               className={clsx(
                  "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2",
                  viewMode === 'calendar' ? "bg-indigo-600/20 text-indigo-400" : "text-gray-400 hover:bg-white/5"
               )}
            >
               <CalendarDays size={16} className="shrink-0" /> <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>

          <button 
             onClick={fetchNews}
             disabled={loading || viewMode === 'calendar'}
             className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors border border-white/10 flex items-center space-x-2 disabled:opacity-50"
          >
             <RefreshCw size={16} className={clsx("shrink-0", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center space-x-3">
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
           <p>{error}</p>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="flex-1 glass-panel rounded-2xl overflow-hidden min-h-[600px] border border-white/10 p-2">
           <EconomicCalendar colorTheme="dark" width="100%" height="100%" />
        </div>
      ) : !error && (
        <>
          {/* Trending Section */}
          <div className="space-y-4">
             <div className="flex items-center space-x-2 px-2">
               <TrendingUp className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" size={20} />
               <h2 className="text-xl font-display font-bold text-white tracking-wide">Top Headlines</h2>
             </div>
             
             {loading && trendingNews.length === 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse border border-white/5"></div>
                 ))}
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {trendingNews.map((article, i) => (
                   <a 
                     key={article.id} 
                     href={article.url} 
                     target="_blank" 
                     rel="noreferrer"
                     className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all duration-300 block"
                   >
                     <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent z-10" />
                     {article.imageurl?.trim() ? (
                       <img 
                         src={article.imageurl} 
                         alt={article.title} 
                         className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-105" 
                         loading="lazy"
                       />
                     ) : <div className="w-full h-72 border-b border-white/5" />}
                     <div className="absolute bottom-0 left-0 w-full p-5 z-20 flex flex-col justify-end bg-gradient-to-t from-black via-black/80 to-transparent">
                       <div className="flex items-center space-x-2 mb-2">
                         <span className={clsx(
                           "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border",
                           article.impact === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                           article.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                           'bg-blue-500/20 text-blue-400 border-blue-500/30'
                         )}>
                            {article.impact || 'Low'} Impact
                         </span>
                         <span className="text-[10px] font-bold text-gray-300 uppercase bg-white/10 px-2 py-0.5 rounded-md border border-white/5">
                           {article.eventType || 'News'}
                         </span>
                       </div>
                       <div className="flex items-center space-x-3 mb-2">
                         <span className="px-2.5 py-1 bg-blue-600/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                           {article.source_info?.name || article.source}
                         </span>
                         <span className="text-gray-300 text-[10px] flex items-center space-x-1 font-mono">
                           <Clock size={10} />
                           <span>{new Date(article.published_on * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </span>
                       </div>
                       <h3 className="text-md font-bold text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2 title-shadow mb-2">
                         {article.title}
                       </h3>
                       {article.affectedAssets && article.affectedAssets.length > 0 && (
                         <div className="flex items-center space-x-1">
                           <span className="text-[9px] text-gray-400 uppercase tracking-widest mr-1">Assets:</span>
                           {article.affectedAssets.slice(0, 3).map(asset => (
                             <span key={asset} className="text-[9px] font-mono text-gray-300 bg-white/10 px-1 rounded border border-white/10">{asset}</span>
                           ))}
                         </div>
                       )}
                     </div>
                   </a>
                 ))}
               </div>
             )}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

          {/* Latest News Flow */}
          <div className="space-y-4">
             <div className="flex items-center space-x-2 px-2">
               <Globe className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={20} />
               <h2 className="text-xl font-display font-bold text-white tracking-wide">Latest Market Flow</h2>
             </div>
             
             {loading && regularNews.length === 0 ? (
               <div className="space-y-4">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
                 ))}
               </div>
             ) : (
               <div className="flex flex-col space-y-4">
                 <AnimatePresence>
                   {regularNews.map((article) => (
                     <motion.a
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       key={article.id}
                       href={article.url}
                       target="_blank"
                       rel="noreferrer"
                       className="group flex flex-col md:flex-row bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 rounded-xl overflow-hidden transition-all duration-300 p-4 gap-5 items-start"
                     >
                       <div className="w-full md:w-48 h-32 shrink-0 rounded-lg overflow-hidden border border-white/5 relative">
                         {article.imageurl?.trim() ? (
                           <img 
                             src={article.imageurl} 
                             alt={article.title} 
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                             loading="lazy"
                           />
                         ) : <div className="w-full h-full border-b border-white/5" />}
                       </div>
                       
                       <div className="flex-1 flex flex-col justify-between h-full">
                         <div>
                           <div className="flex items-center space-x-3 mb-2">
                             <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-1 rounded">
                               {article.source_info?.img?.trim() && (
                                 <img src={article.source_info.img} alt="source" className="w-4 h-4 rounded-full" />
                               )}
                               <span>{article.source_info?.name || article.source}</span>
                             </div>
                             <span className="text-gray-500 text-xs flex items-center space-x-1 font-mono">
                               <Calendar size={12} />
                               <span>{new Date(article.published_on * 1000).toLocaleDateString()}</span>
                               <span className="mx-1">•</span>
                               <span>{new Date(article.published_on * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </span>
                           </div>
                           
                           <h3 className="text-lg font-bold text-gray-200 group-hover:text-blue-400 transition-colors mb-2 leading-tight">
                             {article.title}
                           </h3>
                           
                           <p className="text-sm text-gray-400 line-clamp-2 md:line-clamp-3 leading-relaxed">
                             {article.body}
                           </p>
                         </div>
                         
                         <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                           <div className="flex space-x-2">
                             {article.categories.split('|').slice(0, 2).map(tag => (
                               <span key={tag} className="text-[9px] text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5 font-mono uppercase tracking-widest">
                                 {tag}
                               </span>
                             ))}
                             {article.eventType && (
                               <span className="text-[9px] text-gray-300 bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 font-bold uppercase tracking-widest">
                                 {article.eventType}
                               </span>
                             )}
                           </div>
                           <div className="flex items-center space-x-2">
                             {article.affectedAssets && article.affectedAssets.length > 0 && (
                               <div className="flex space-x-1 border-r border-white/10 pr-2 mr-1">
                                 {article.affectedAssets.slice(0, 3).map(asset => (
                                   <span key={asset} className="text-[9px] text-gray-300 font-bold tracking-wider">{asset}</span>
                                 ))}
                               </div>
                             )}
                             <span className={clsx(
                               "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border",
                               article.impact === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                               article.impact === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                               'bg-blue-500/10 text-blue-400 border-blue-500/20'
                             )}>
                               {article.impact || 'Low'} Impact
                             </span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="hidden md:flex shrink-0 w-8 h-8 rounded-full bg-white/5 group-hover:bg-blue-500/20 group-hover:text-blue-400 items-center justify-center transition-colors">
                         <ExternalLink size={14} />
                       </div>
                     </motion.a>
                   ))}
                 </AnimatePresence>
               </div>
             )}
          </div>
        </>
      )}
    </div>
  );
}
