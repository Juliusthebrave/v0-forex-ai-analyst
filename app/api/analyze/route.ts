import { generateText, Output } from 'ai';
import { z } from 'zod';
import { addSignal } from '@/lib/signal-store';
import { sendTelegramSignal } from '@/lib/telegram';
import type { ForexSignalRequest, ForexSignal, SignalType } from '@/lib/types';

const SYSTEM_PROMPT = `You are an expert Forex market analyst with deep knowledge of technical analysis and current geopolitical events. Your analysis takes place in April 2026.

CURRENT GEOPOLITICAL CONTEXT (April 2026):
- US Federal Reserve has maintained rates at 4.25% amid moderating inflation
- European Central Bank signaling potential rate cuts in Q2 2026
- China-Taiwan tensions have eased following diplomatic talks, boosting Asian markets
- Middle East oil production stable after new OPEC+ agreements
- USD strength persists against emerging market currencies
- JPY weakness continues as Bank of Japan maintains ultra-loose policy
- GBP volatility due to ongoing UK-EU trade renegotiations
- AUD benefiting from strong commodity demand, particularly lithium and rare earths

TECHNICAL ANALYSIS GUIDELINES:
- EMA 8 crossing above EMA 20: Short-term bullish signal
- EMA 8 crossing below EMA 20: Short-term bearish signal
- Price above all EMAs (8, 20, 50): Strong bullish trend
- Price below all EMAs: Strong bearish trend
- MACD line crossing above signal line: Bullish momentum
- MACD line crossing below signal line: Bearish momentum
- Positive MACD histogram: Increasing bullish momentum
- Negative MACD histogram: Increasing bearish momentum

ACCOUNT SIZE RISK GUIDELINES:
You will receive the trader's account balance. Adjust your risk assessment accordingly:
- Micro accounts (<$50): Be VERY conservative. Recommend only high-probability setups. Warn about leverage risks.
- Mini accounts ($50-$200): Conservative approach. Focus on major pairs with lower volatility.
- Small accounts ($200-$1000): Standard retail advice. Balance opportunity with risk management.
- Standard accounts (>$1000): Normal trading recommendations with proper position sizing.

Always tailor lot size recommendations and risk levels to the specific account balance provided.

Provide a concise but thorough analysis combining technical indicators with geopolitical context. Be specific about how current events might affect the currency pair.`;

const analysisSchema = z.object({
  signal: z.enum(['BUY', 'SELL', 'NEUTRAL']),
  confidence: z.number().min(0).max(100),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  analysis: z.string(),
});

export async function POST(req: Request) {
  // Log incoming request for debugging
  console.log('[v0] /api/analyze received request');
  
  let body: ForexSignalRequest & { accountBalance?: number };
  
  // Parse request body
  try {
    body = await req.json();
    console.log('[v0] Request body:', JSON.stringify(body));
  } catch (parseError) {
    console.error('[v0] Failed to parse request body:', parseError);
    return Response.json({
      success: true,
      error: 'Invalid JSON in request body',
      received: null
    });
  }

  const { symbol, price, ema8, ema20, ema50, macd, accountBalance = 27 } = body;

  // Log parsed data
  console.log('[v0] Parsed data:', { symbol, price, ema8, ema20, ema50, macd, accountBalance });

  // Validate required fields but don't fail - just log
  if (!symbol || typeof price !== 'number') {
    console.error('[v0] Missing required fields:', { symbol, price });
    return Response.json({
      success: true,
      error: 'Missing required fields: symbol and price',
      received: body
    });
  }

  const maxRiskPerTrade = accountBalance * 0.02;
  const recommendedLot = (accountBalance * 0.01) / 100;
  const accountCategory = accountBalance < 50 ? 'Micro' : accountBalance < 200 ? 'Mini' : accountBalance < 1000 ? 'Small' : 'Standard';

  const userPrompt = `Analyze this Forex data and provide a trading signal:

TRADER ACCOUNT INFO:
Account Balance: $${accountBalance.toFixed(2)} (${accountCategory} Account)
Max Risk Per Trade (2%): $${maxRiskPerTrade.toFixed(2)}
Recommended Lot Size: ${recommendedLot.toFixed(3)} lots

MARKET DATA:
Symbol: ${symbol}
Current Price: ${price}
EMA 8: ${ema8 ?? 'N/A'}
EMA 20: ${ema20 ?? 'N/A'}
EMA 50: ${ema50 ?? 'N/A'}
MACD Line: ${macd?.line ?? 'N/A'}
MACD Signal: ${macd?.signal ?? 'N/A'}
MACD Histogram: ${macd?.histogram ?? 'N/A'}

Technical Observations:
- Price vs EMA8: ${ema8 ? (price > ema8 ? 'Above' : 'Below') : 'N/A'}
- Price vs EMA20: ${ema20 ? (price > ema20 ? 'Above' : 'Below') : 'N/A'}
- Price vs EMA50: ${ema50 ? (price > ema50 ? 'Above' : 'Below') : 'N/A'}
- EMA Alignment: ${ema8 && ema20 && ema50 ? (ema8 > ema20 && ema20 > ema50 ? 'Bullish (8>20>50)' : ema8 < ema20 && ema20 < ema50 ? 'Bearish (8<20<50)' : 'Mixed') : 'N/A'}
- MACD Momentum: ${macd?.histogram !== undefined ? (macd.histogram > 0 ? 'Bullish' : 'Bearish') : 'N/A'}

Provide your analysis considering both technical indicators and current April 2026 geopolitical factors.`;

  // Try to get AI analysis - if it fails, create a fallback signal
  let aiResponse: { signal: 'BUY' | 'SELL' | 'NEUTRAL'; confidence: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; analysis: string } | null = null;
  
  try {
    console.log('[v0] Calling AI for analysis...');
    const result = await generateText({
      model: 'openai/gpt-4o',
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      output: Output.object({ schema: analysisSchema }),
    });
    aiResponse = result.object;
    console.log('[v0] AI response:', aiResponse);
  } catch (aiError) {
    console.error('[v0] AI analysis failed:', aiError);
    // Create a fallback response so MT5 still gets data
    aiResponse = {
      signal: 'NEUTRAL',
      confidence: 0,
      riskLevel: 'HIGH',
      analysis: `AI analysis unavailable. Received data for ${symbol} at ${price}. Please check API configuration.`
    };
  }

  // Create signal record
  const forexSignal: ForexSignal = {
    id: crypto.randomUUID(),
    symbol,
    signal: aiResponse.signal as SignalType,
    price,
    analysis: aiResponse.analysis,
    confidence: aiResponse.confidence,
    riskLevel: aiResponse.riskLevel,
    timestamp: new Date(),
    telegramSent: false,
  };

  // Try to send to Telegram - if it fails, just log
  try {
    console.log('[v0] Sending to Telegram...');
    const telegramSent = await sendTelegramSignal({
      symbol,
      signal: aiResponse.signal as SignalType,
      price,
      analysis: aiResponse.analysis,
      confidence: aiResponse.confidence,
      riskLevel: aiResponse.riskLevel,
    });
    forexSignal.telegramSent = telegramSent;
    console.log('[v0] Telegram result:', telegramSent);
  } catch (telegramError) {
    console.error('[v0] Telegram send failed:', telegramError);
    forexSignal.telegramSent = false;
  }

  // Try to store signal - if it fails, just log
  try {
    addSignal(forexSignal);
    console.log('[v0] Signal stored successfully');
  } catch (storeError) {
    console.error('[v0] Failed to store signal:', storeError);
  }

  // Always return success to MT5
  console.log('[v0] Returning success response to MT5');
  return Response.json({
    success: true,
    signal: forexSignal,
  });
}
