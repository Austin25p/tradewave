import { GoogleGenAI } from '@google/genai';
import { Trade } from './types';
import { calculateMetrics } from './metrics';

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateWeeklySummary(trades: Trade[]): Promise<string> {
  if (!ai) {
    return 'Gemini API Key is not configured. Please add GEMINI_API_KEY to your environment/settings to enable AI Coach insights.';
  }

  const metrics = calculateMetrics(trades);
  
  // Extract execution errors
  const allErrors = trades.flatMap(t => t.executionErrors);
  const errorCounts = allErrors.reduce((acc, err) => {
    acc[err] = (acc[err] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topError = Object.entries(errorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None identified';

  const prompt = `
You are an expert, no-nonsense trading coach analyzing a trader's recent performance.

Here are the stats for their recent trades:
- Total Trades: ${metrics.totalTrades}
- Win Rate: ${(metrics.winRate * 100).toFixed(1)}%
- Profit Factor: ${metrics.profitFactor.toFixed(2)}
- Net PnL: $${metrics.netPnL.toFixed(2)}
- Top Execution Error this period: "${topError}"

Generate a short "Weekly Performance Summary" (max 3 concise paragraphs).
It must specifically highlight the "Top Execution Error" and provide exactly ONE actionable trading rule they should change or focus onto fix this for the following week.
Use a professional, encouraging but direct tone.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || 'Unable to generate insights at this time.';
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return 'An error occurred while communicating with the AI Coach.';
  }
}
