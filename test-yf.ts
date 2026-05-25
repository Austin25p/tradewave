import yahooFinanceLib from 'yahoo-finance2';
const YFClass = (yahooFinanceLib as any).default || yahooFinanceLib;
const yahooFinance = new YFClass();

async function run() {
  try {
    const res = await yahooFinance.chart('JPY=X', { period1: '2024-01-01', interval: '1d' });
    console.log("JPY=X ok, quotes:", res.quotes.length);
  } catch(e: any) { console.error('JPY=X err', e.message); }
  
  try {
    const res2 = await yahooFinance.chart('USDJPY=X', { period1: '2024-01-01', interval: '1d' });
    console.log("USDJPY=X ok, quotes:", res2.quotes.length);
  } catch(e: any) { console.error('USDJPY=X err', e.message); }
}
run();
