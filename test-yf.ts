import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
yahooFinance.search('AAPL').then(() => console.log('Success')).catch(console.error);
