export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ForexSignalRequest {
  symbol: string;
  price: number;
  ema8: number;
  ema20: number;
  ema50: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  sl?: number;
  tp?: number;
  atr?: number;
  history?: OHLC[]; // Last 4 candles OHLC data
}

export type SignalType = 'BUY' | 'SELL' | 'NEUTRAL';

export type CandlePattern = 
  | 'HAMMER' 
  | 'BULLISH_ENGULFING' 
  | 'FALLING_STAR' 
  | 'BEARISH_ENGULFING' 
  | 'DOJI' 
  | 'NONE';

export type MarketPhase = 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN';

export interface ForexSignal {
  id: string;
  symbol: string;
  signal: SignalType;
  price: number;
  analysis: string;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: Date;
  telegramSent: boolean;
  sl?: number;
  tp?: number;
  atr?: number;
  volatility?: 'LOW' | 'MEDIUM' | 'HIGH';
  pattern?: CandlePattern;
  patternType?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  marketPhase?: MarketPhase;
  volatileAlert?: boolean;
  adjustedSl?: number;
}

export interface RiskMetrics {
  accountBalance: number;
  maxRiskPerTrade: number;
  currentExposure: number;
  riskPercentage: number;
  recommendedLotSize: number;
}

export interface MarketCard {
  id: string;
  symbol: string;
  price: number;
  ema8: number;
  ema20: number;
  ema50: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  signal?: ForexSignal;
  isLoading: boolean;
  lastUpdated: Date;
}
