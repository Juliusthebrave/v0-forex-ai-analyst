-- Create signals table for storing forex trading signals
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('BUY', 'SELL', 'NEUTRAL')),
  price NUMERIC NOT NULL,
  analysis TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  telegram_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by symbol and timestamp
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);

-- Enable Row Level Security (but allow all operations for now since this is a public trading tool)
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (no auth required for this app)
CREATE POLICY "Allow all operations on signals" ON signals
  FOR ALL
  USING (true)
  WITH CHECK (true);
