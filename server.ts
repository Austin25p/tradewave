import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/news", async (req, res) => {
    try {
      const q = (req.query.q as string) || "markets";
      const result = await yahooFinance.search(q, { newsCount: 20 });
      const articles = result.news.map((item: any) => {
        let published_on = 0;
        if (item.providerPublishTime) {
          if (item.providerPublishTime instanceof Date) published_on = Math.floor(item.providerPublishTime.getTime() / 1000);
          else if (typeof item.providerPublishTime === 'number') published_on = item.providerPublishTime;
          else if (typeof item.providerPublishTime === 'string') published_on = Math.floor(new Date(item.providerPublishTime).getTime() / 1000);
        }
        return {
          id: item.uuid || item.id || String(Math.random()),
          title: item.title,
          url: item.link,
          source: item.publisher,
          published_on,
          imageurl: item.thumbnail?.resolutions?.[0]?.url || "",
          body: item.title, // yahoo finance search returns title, no body usually
          categories: q
        };
      });
      res.json(articles);
    } catch (error: any) {
      // Suppress verbose console.error to avoid log noise from external API errors
      res.status(500).json({ error: error.message || "Failed to fetch news" });
    }
  });

  app.get("/api/quote", async (req, res) => {
    try {
      const { symbol, provider, apiKey } = req.query;
      if (!symbol) return res.status(400).json({ error: "Missing symbol" });
      const sSymbol = (symbol as string).toUpperCase();
      let reqProvider = (provider as string) || 'yahoo';

      if ((!provider || provider === 'binance') && (sSymbol === 'BTCUSD' || sSymbol === 'ETHUSD')) {
         reqProvider = 'binance';
      }

      if (reqProvider === 'binance') {
         const binanceSymbol = sSymbol === 'BTCUSD' ? 'BTCUSDT' : (sSymbol === 'ETHUSD' ? 'ETHUSDT' : sSymbol);
         const bRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
         if (!bRes.ok) throw new Error("Binance API error");
         const bData = await bRes.json();
         return res.json({ price: parseFloat(bData.price) });
      }

      if (reqProvider === 'twelvedata') {
         if (!apiKey) return res.status(400).json({error: "API key required for Twelve Data"});
         const tdRes = await fetch(`https://api.twelvedata.com/price?symbol=${sSymbol}&apikey=${apiKey}`);
         if (!tdRes.ok) throw new Error("Twelve Data API error");
         const tdData = await tdRes.json();
         if (tdData.price) return res.json({ price: parseFloat(tdData.price) });
         return res.status(400).json({ error: "Invalid Twelve Data response" });
      }

      if (reqProvider === 'polygon') {
         if (!apiKey) return res.status(400).json({error: "API key required for Polygon.io"});
         let polySymbol = sSymbol;
         if (['EURUSD', 'GBPUSD'].includes(sSymbol)) polySymbol = `C:${sSymbol}`;
         else if (['BTCUSD', 'ETHUSD'].includes(sSymbol)) polySymbol = `X:${sSymbol}`;
         
         const pRes = await fetch(`https://api.polygon.io/v2/aggs/ticker/${polySymbol}/prev?adjusted=true&apiKey=${apiKey}`);
         if (!pRes.ok) throw new Error("Polygon API error");
         const pData = await pRes.json();
         if (pData.results && pData.results.length > 0) {
            return res.json({ price: pData.results[0].c });
         }
         return res.status(404).json({ error: "No data from Polygon" });
      }

      // Default Yahoo Finance route
      const symbolMap: Record<string, string> = {
        'EURUSD': 'EURUSD=X',
        'GBPUSD': 'GBPUSD=X',
        'BTCUSD': 'BTC-USD',
        'ETHUSD': 'ETH-USD',
        'SPX500': '^GSPC',
        'NAS100': '^NDX',
        'US30': '^DJI',
        'XAUUSD': 'GC=F',
        'AAPL': 'AAPL',
        'TSLA': 'TSLA',
        'MSFT': 'MSFT',
      };
      
      const qSymbol = symbolMap[sSymbol] || sSymbol;
      const yUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${qSymbol}`;
      const yRes = await fetch(yUrl);
      if (!yRes.ok) throw new Error("Yahoo Finance Fetch Error");
      const yData = await yRes.json();
      if (yData.quoteResponse && yData.quoteResponse.result && yData.quoteResponse.result.length > 0) {
         return res.json({ price: yData.quoteResponse.result[0].regularMarketPrice });
      }
      return res.status(404).json({ error: "Price not found" });

    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch quote" });
    }
  });

  app.get("/api/historical", async (req, res) => {
    try {
      const { symbol, start, end, interval, provider, apiKey } = req.query;
      if (!symbol || !start || !end) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const sSymbol = (symbol as string).toUpperCase();
      let reqProvider = (provider as string) || 'yahoo';

      // Use Binance automatically for crypto if no provider explicitly requested or if it's the free option
      if ((!provider || provider === 'binance') && (sSymbol === 'BTCUSD' || sSymbol === 'ETHUSD')) {
         reqProvider = 'binance';
      }

      if (reqProvider === 'binance') {
         const binanceSymbol = sSymbol === 'BTCUSD' ? 'BTCUSDT' : (sSymbol === 'ETHUSD' ? 'ETHUSDT' : sSymbol);
         let bInterval = '1d';
         if (interval === '60m' || interval === '1h') bInterval = '1h';
         else if (interval === '1m') bInterval = '1m';
         else if (interval === '5m') bInterval = '5m';
         else if (interval === '15m') bInterval = '15m';

         const startMs = new Date(start as string).getTime();
         const endMs = new Date(end as string).getTime();
         
         const bRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${bInterval}&startTime=${startMs}&endTime=${endMs}&limit=1000`);
         if (!bRes.ok) throw new Error("Binance API error");
         const bData = await bRes.json();
         const formattedData = bData.map((k: any) => ({
             time: Math.floor(k[0] / 1000),
             open: parseFloat(k[1]),
             high: parseFloat(k[2]),
             low: parseFloat(k[3]),
             close: parseFloat(k[4])
         }));
         return res.json(formattedData);
      }

      if (reqProvider === 'polygon') {
         if (!apiKey) return res.status(400).json({error: "API key required for Polygon.io"});
         let multiplier = '1';
         let timespan = 'day';
         if (interval === '60m' || interval === '1h') { multiplier = '1'; timespan = 'hour'; }
         else if (interval === '15m') { multiplier = '15'; timespan = 'minute'; }
         else if (interval === '5m') { multiplier = '5'; timespan = 'minute'; }
         else if (interval === '1m') { multiplier = '1'; timespan = 'minute'; }
         
         let polySymbol = sSymbol;
         if (['EURUSD', 'GBPUSD'].includes(sSymbol)) polySymbol = `C:${sSymbol}`;
         else if (['BTCUSD', 'ETHUSD'].includes(sSymbol)) polySymbol = `X:${sSymbol}`;
         
         const sDate = new Date(start as string).toISOString().split('T')[0];
         const eDate = new Date(end as string).toISOString().split('T')[0];

         const pUrl = `https://api.polygon.io/v2/aggs/ticker/${polySymbol}/range/${multiplier}/${timespan}/${sDate}/${eDate}?adjusted=true&sort=asc&limit=5000&apiKey=${apiKey}`;
         const pRes = await fetch(pUrl);
         if (!pRes.ok) throw new Error("Polygon API error");
         const pData = await pRes.json();
         if (!pData.results) return res.status(404).json({error: "No data from Polygon"});
         const formattedData = pData.results.map((r: any) => ({
            time: Math.floor(r.t / 1000),
            open: r.o,
            high: r.h,
            low: r.l,
            close: r.c
         }));
         return res.json(formattedData);
      }

      if (reqProvider === 'twelvedata') {
         if (!apiKey) return res.status(400).json({error: "API key required for Twelve Data"});
         let tdInterval = '1day';
         if (interval === '60m' || interval === '1h') tdInterval = '1h';
         else if (interval === '15m') tdInterval = '15min';
         else if (interval === '5m') tdInterval = '5min';
         else if (interval === '1m') tdInterval = '1min';

         // Format: YYYY-MM-DD HH:MM:SS
         const formatDate = (dateString: string) => new Date(dateString).toISOString().replace('T', ' ').substring(0, 19);
         const startStr = formatDate(start as string);
         const endStr = formatDate(end as string);

         const tdUrl = `https://api.twelvedata.com/time_series?symbol=${sSymbol}&interval=${tdInterval}&start_date=${encodeURIComponent(startStr)}&end_date=${encodeURIComponent(endStr)}&apikey=${apiKey}&outputsize=5000&format=JSON`;
         const tdRes = await fetch(tdUrl);
         if (!tdRes.ok) throw new Error("Twelve Data API error");
         const tdData = await tdRes.json();
         if (tdData.status === 'error' || !tdData.values) return res.status(400).json({error: tdData.message || "No data from Twelve Data"});
         const formattedData = tdData.values.map((v: any) => ({
            time: new Date(v.datetime + 'Z').getTime() / 1000,
            open: parseFloat(v.open),
            high: parseFloat(v.high),
            low: parseFloat(v.low),
            close: parseFloat(v.close)
         })).reverse(); // twelve data returns descending order
         return res.json(formattedData);
      }

      // Default Yahoo Finance route
      const symbolMap: Record<string, string> = {
        'EURUSD': 'EURUSD=X',
        'GBPUSD': 'GBPUSD=X',
        'BTCUSD': 'BTC-USD',
        'ETHUSD': 'ETH-USD',
        'SPX500': '^GSPC',
        'NAS100': '^NDX',
        'US30': '^DJI',
        'XAUUSD': 'GC=F',
        'AAPL': 'AAPL',
        'TSLA': 'TSLA',
        'MSFT': 'MSFT',
      };
      const qSymbol = symbolMap[sSymbol] || sSymbol;

      const queryOptions: any = {
        period1: start as string,
        period2: end as string,
        interval: (interval as string) || '1d',
      };

      const result = await yahooFinance.chart(qSymbol, queryOptions);
      
      if (!result || !result.quotes || result.quotes.length === 0) {
         return res.status(404).json({ error: "No data found for the given parameters" });
      }

      const formattedData = result.quotes.map((q: any) => ({
         time: new Date(q.date).getTime() / 1000,
         open: q.open,
         high: q.high,
         low: q.low,
         close: q.close,
      }));

      res.json(formattedData);
    } catch (error: any) {
      // Intentionally suppress console.error here to avoid log noise from Yahoo Finance API bounds limits, 
      // since the frontend falls back gracefully to generated data.
      res.status(500).json({ error: error.message || "Failed to fetch data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
