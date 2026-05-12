import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import yahooFinance from 'yahoo-finance2';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/historical", async (req, res) => {
    try {
      const { symbol, start, end, interval } = req.query;
      if (!symbol || !start || !end) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Map our symbols to Yahoo Finance symbols
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
        // Synthetics don't exist on Yahoo Finance
      };

      const qSymbol = symbolMap[(symbol as string).toUpperCase()];
      if (!qSymbol) {
         return res.status(400).json({ error: "Symbol not supported by real data provider" });
      }

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
      console.error(error);
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
