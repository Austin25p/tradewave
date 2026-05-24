import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import yahooFinanceLib from 'yahoo-finance2';
import NodeCache from "node-cache";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { createServer } from "http";

dotenv.config();

const YFClass = (yahooFinanceLib as any).default || yahooFinanceLib;
const yahooFinance = new YFClass();

// Set up a cache with a default TTL of 60 seconds and check period of 120 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // Create HTTP server
  const server = createServer(app);

  // Setup WebSocket Server
  const wss = new WebSocketServer({ server });
  
  let connectedClients = 0;
  wss.on("connection", (ws) => {
    connectedClients++;
    console.log(`WebSocket client connected. Total: ${connectedClients}`);
    
    // Simulate live data updates
    const interval = setInterval(() => {
      ws.send(JSON.stringify({ 
        type: 'live_update',
        data: {
          balance: 10000 + (Math.random() * 50 - 25),
          margin: Math.random() * 5,
          equity: 10050 + (Math.random() * 60 - 30),
          timestamp: Date.now()
        }
      }));

      // Simulate Whale Algo Live Events
      if (Math.random() > 0.7) {
        const type = Math.random() > 0.5 ? 'iFVG' : 'Liquidity Grab';
        const direction = Math.random() > 0.5 ? 'Bullish' : 'Bearish';
        const asset = ['EUR/USD', 'GBP/USD', 'BTC/USD', 'XAU/USD', 'USD/JPY'][Math.floor(Math.random()*5)];
        ws.send(JSON.stringify({
          type: 'smc_event',
          data: {
            asset,
            type,
            direction,
            timestamp: Date.now(),
          }
        }));
      }
    }, 2000);

    ws.on("close", () => {
      connectedClients--;
      clearInterval(interval);
      console.log(`WebSocket client disconnected. Total: ${connectedClients}`);
    });
  });

  // Trust proxy is required when running behind a reverse proxy (like in cloud environments)
  app.set("trust proxy", 1);

  // Apply basic security headers but allow Vite dev assets
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // Rate limiting to prevent abuse
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    validate: { trustProxy: false, xForwardedForHeader: false } // Disable validation warnings
  });

  app.use(cors());
  app.use('/api/', apiLimiter);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/validate-keys", async (req, res) => {
    try {
      const { platform, server, login, password } = req.body;
      if (!platform || !login || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Simulate a ping to specific broker API to check read-only
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating network latency

      // Add dummy logic mimicking explicitly verified "Withdrawal" permissions check
      if (password.toLowerCase().includes("withdrawal") || password.toLowerCase().includes("admin")) {
         return res.status(403).json({ error: "Validation Failed: These API keys have withdrawal permissions enabled. For your security, please provide entirely Read-Only API keys." });
      }

      res.json({ status: "success", message: `Connected to ${platform} successfully.` });
    } catch (e) {
      res.status(500).json({ error: "API Validation Error" });
    }
  });

  app.post("/api/trade/execute", async (req, res) => {
    try {
      const { symbol, side, qty, sl, tp, platform } = req.body;
      if (!symbol || !side || !qty) return res.status(400).json({ error: "Missing parameters" });

      // Mock integration firing direct commands
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate propagation

      res.json({ 
        status: "success", 
        message: `Order Executed: ${side.toUpperCase()} ${qty} ${symbol} via ${platform || 'Connected Broker'}`,
        orderId: `ORD-${Math.random().toString(36).substring(7).toUpperCase()}`
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to execute trade" });
    }
  });

  app.get("/api/oauth/connect/:provider", (req, res) => {
    // This mocks the OAuth redirect for Bybit / Binance
    const { provider } = req.params;
    // In real app, build OAuth URL and redirect
    res.json({ redirectUrl: `https://oauth.${provider}.com/authorize?client_id=fake_id&response_type=code` });
  });

  app.get("/api/news", async (req, res) => {
    try {
      const q = (req.query.q as string) || "markets";
      const cacheKey = `news_${q}`;
      
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const result = await yahooFinance.search(q, { newsCount: 20 });
      const articles = result.news.map((item: any) => {
        let published_on = 0;
        if (item.providerPublishTime) {
          if (item.providerPublishTime instanceof Date) published_on = Math.floor(item.providerPublishTime.getTime() / 1000);
          else if (typeof item.providerPublishTime === 'number') published_on = item.providerPublishTime;
          else if (typeof item.providerPublishTime === 'string') published_on = Math.floor(new Date(item.providerPublishTime).getTime() / 1000);
        }
        
        const titleLower = (item.title || '').toLowerCase();
        let impact = 'Low';
        let eventType = 'General News';
        if (titleLower.match(/rate|fed|inflation|cpi|interest|war|crisis/)) {
          impact = 'High';
          eventType = 'Macroeconomic';
        } else if (titleLower.match(/earnings|sales|growth|gdp|unemployment/)) {
          impact = 'Medium';
          eventType = 'Economic Data';
        } else if (titleLower.match(/crypto|bitcoin|sec|lawsuit/)) {
          eventType = 'Industry Specific';
          impact = titleLower.includes('sec') ? 'High' : 'Medium';
        }

        const affectedAssets = [];
        if (titleLower.match(/usd|fed|powell|cpi/)) affectedAssets.push('USD');
        if (titleLower.match(/eur|ecb|lagarde/)) affectedAssets.push('EUR');
        if (titleLower.match(/gbp|boe/)) affectedAssets.push('GBP');
        if (titleLower.match(/jpy|boj/)) affectedAssets.push('JPY');
        if (titleLower.match(/crypto|bitcoin|btc/)) affectedAssets.push('BTC');
        if (titleLower.match(/gold|xau/)) affectedAssets.push('XAU');
        if (titleLower.match(/oil|wti/)) affectedAssets.push('USOIL');
        if (affectedAssets.length === 0) affectedAssets.push('Global');

        return {
          id: item.uuid || item.id || String(Math.random()),
          title: item.title,
          url: item.link,
          source: item.publisher,
          published_on,
          imageurl: item.thumbnail?.resolutions?.[0]?.url || "",
          body: item.title,
          categories: q,
          impact,
          eventType,
          affectedAssets
        };
      });
      
      cache.set(cacheKey, articles, 300); // cache news for 5 mins
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch news" });
    }
  });

  app.get("/api/quote", async (req, res) => {
    try {
      const { symbol, provider } = req.query;
      if (!symbol) return res.status(400).json({ error: "Missing symbol" });
      
      const cacheKey = `quote_${symbol}_${provider || 'default'}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const sSymbol = (symbol as string).toUpperCase();
      let reqProvider = (provider as string) || 'yahoo';

      if ((!provider || provider === 'binance') && (sSymbol === 'BTCUSD' || sSymbol === 'ETHUSD')) {
         reqProvider = 'binance';
      }

      if (reqProvider === 'binance') {
         const binanceSymbol = sSymbol === 'BTCUSD' ? 'BTCUSDT' : (sSymbol === 'ETHUSD' ? 'ETHUSDT' : sSymbol);
         const bRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(binanceSymbol)}`);
         if (!bRes.ok) throw new Error("Binance API error");
         const bData = await bRes.json();
         const result = { price: parseFloat(bData.price) };
         cache.set(cacheKey, result, 10); // cache for 10 seconds
         return res.json(result);
      }

      if (reqProvider === 'twelvedata') {
         const keyToUse = process.env.TWELVEDATA_API_KEY;
         if (!keyToUse) return res.status(400).json({error: "API key required for Twelve Data"});
         const tdRes = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(sSymbol)}&apikey=${encodeURIComponent(keyToUse as string)}`);
         if (!tdRes.ok) throw new Error("Twelve Data API error");
         const tdData = await tdRes.json();
         if (tdData.price) {
           const result = { price: parseFloat(tdData.price) };
           cache.set(cacheKey, result, 15);
           return res.json(result);
         }
         return res.status(400).json({ error: "Invalid Twelve Data response" });
      }

      if (reqProvider === 'polygon') {
         const keyToUse = process.env.POLYGON_API_KEY;
         if (!keyToUse) return res.status(400).json({error: "API key required for Polygon.io"});
         let polySymbol = sSymbol;
         if (['EURUSD', 'GBPUSD'].includes(sSymbol)) polySymbol = `C:${sSymbol}`;
         else if (['BTCUSD', 'ETHUSD'].includes(sSymbol)) polySymbol = `X:${sSymbol}`;
         
         const pRes = await fetch(`https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(polySymbol)}/prev?adjusted=true&apiKey=${encodeURIComponent(keyToUse as string)}`);
         if (!pRes.ok) throw new Error("Polygon API error");
         const pData = await pRes.json();
         if (pData.results && pData.results.length > 0) {
            const result = { price: pData.results[0].c };
            cache.set(cacheKey, result, 60);
            return res.json(result);
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
         const result = { price: yData.quoteResponse.result[0].regularMarketPrice };
         cache.set(cacheKey, result, 15); // Yahoo finance doesn't have same strict rate limits, 15s cache
         return res.json(result);
      }
      return res.status(404).json({ error: "Price not found" });

    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch quote" });
    }
  });

  app.get("/api/historical", async (req, res) => {
    try {
      const { symbol, start, end, interval, provider } = req.query;
      if (!symbol || !start || !end) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const cacheKey = `hist_${symbol}_${start}_${end}_${interval}_${provider || 'default'}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

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
         
         const bRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(binanceSymbol)}&interval=${encodeURIComponent(bInterval)}&startTime=${startMs}&endTime=${endMs}&limit=1000`);
         if (!bRes.ok) throw new Error("Binance API error");
         const bData = await bRes.json();
         const formattedData = bData.map((k: any) => ({
             time: Math.floor(k[0] / 1000),
             open: parseFloat(k[1]),
             high: parseFloat(k[2]),
             low: parseFloat(k[3]),
             close: parseFloat(k[4])
         }));
         cache.set(cacheKey, formattedData, 60);
         return res.json(formattedData);
      }

      if (reqProvider === 'polygon') {
         const keyToUse = process.env.POLYGON_API_KEY;
         if (!keyToUse) return res.status(400).json({error: "API key required for Polygon.io"});
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

         const pUrl = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(polySymbol)}/range/${encodeURIComponent(multiplier)}/${encodeURIComponent(timespan)}/${encodeURIComponent(sDate)}/${encodeURIComponent(eDate)}?adjusted=true&sort=asc&limit=5000&apiKey=${encodeURIComponent(keyToUse as string)}`;
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
         cache.set(cacheKey, formattedData, 300);
         return res.json(formattedData);
      }

      if (reqProvider === 'twelvedata') {
         const keyToUse = process.env.TWELVEDATA_API_KEY;
         if (!keyToUse) return res.status(400).json({error: "API key required for Twelve Data"});
         let tdInterval = '1day';
         if (interval === '60m' || interval === '1h') tdInterval = '1h';
         else if (interval === '15m') tdInterval = '15min';
         else if (interval === '5m') tdInterval = '5min';
         else if (interval === '1m') tdInterval = '1min';

         // Format: YYYY-MM-DD HH:MM:SS
         const formatDate = (dateString: string) => new Date(dateString).toISOString().replace('T', ' ').substring(0, 19);
         const startStr = formatDate(start as string);
         const endStr = formatDate(end as string);

         const tdUrl = `https://api.twelvedata.com/time_series?symbol=${sSymbol}&interval=${tdInterval}&start_date=${encodeURIComponent(startStr)}&end_date=${encodeURIComponent(endStr)}&apikey=${keyToUse}&outputsize=5000&format=JSON`;
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
         
         cache.set(cacheKey, formattedData, 300);
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

      cache.set(cacheKey, formattedData, 60);
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
