import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const res = await yahooFinance.search('markets', { newsCount: 20 });
    console.log("Success:", !!res.news, res.news.length);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
