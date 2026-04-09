'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { RiskMeter } from './risk-meter';
import { SignalLog } from './signal-log';
import { MarketCard } from './market-card';
import { SearchBar } from './search-bar';
import type { ForexSignal, MarketCard as MarketCardType } from '@/lib/types';
import { Activity, TrendingUp, TrendingDown, BarChart3, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ACCOUNT_BALANCE = 27;

export function Dashboard() {
  const { data, mutate } = useSWR<{ signals: ForexSignal[] }>('/api/signals', fetcher, {
    refreshInterval: 5000,
  });

  const [markets, setMarkets] = useState<MarketCardType[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const signals = data?.signals || [];
  const selectedMarket = markets.find(m => m.id === selectedMarketId) || null;

  const handleAddSymbol = useCallback((symbol: string) => {
    const newMarket: MarketCardType = {
      id: `${symbol}-${Date.now()}`,
      symbol,
      price: 0,
      ema8: 0,
      ema20: 0,
      ema50: 0,
      macd: { line: 0, signal: 0, histogram: 0 },
      isLoading: false,
      lastUpdated: new Date(),
    };
    setMarkets(prev => [...prev, newMarket]);
    setSelectedMarketId(newMarket.id);
  }, []);

  const handleRemoveMarket = useCallback((id: string) => {
    setMarkets(prev => prev.filter(m => m.id !== id));
    if (selectedMarketId === id) {
      setSelectedMarketId(null);
    }
  }, [selectedMarketId]);

  const handleUpdateMarket = useCallback((updated: MarketCardType) => {
    setMarkets(prev => prev.map(m => m.id === updated.id ? updated : m));
  }, []);

  const handleAnalyze = useCallback(async (card: MarketCardType): Promise<ForexSignal | null> => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: card.symbol,
          price: card.price,
          ema8: card.ema8,
          ema20: card.ema20,
          ema50: card.ema50,
          macd: card.macd,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.signal) {
        mutate({ signals: [data.signal, ...signals] }, false);
        return data.signal;
      }
      return null;
    } catch (error) {
      console.error('Failed to analyze:', error);
      return null;
    }
  }, [signals, mutate]);

  // Calculate stats
  const todaySignals = signals.filter(s => {
    const signalDate = new Date(s.timestamp);
    const today = new Date();
    return signalDate.toDateString() === today.toDateString();
  });

  const buySignals = todaySignals.filter(s => s.signal === 'BUY').length;
  const sellSignals = todaySignals.filter(s => s.signal === 'SELL').length;
  const avgConfidence = todaySignals.length > 0
    ? Math.round(todaySignals.reduce((sum, s) => sum + s.confidence, 0) / todaySignals.length)
    : 0;

  const existingSymbols = markets.map(m => m.symbol);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Forex AI Analyst</h1>
                <p className="text-xs text-muted-foreground">April 2026 Market Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Balance:</span>
                <span className="font-bold text-foreground">${ACCOUNT_BALANCE}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onAddSymbol={handleAddSymbol} existingSymbols={existingSymbols} />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{markets.length}</p>
                <p className="text-xs text-muted-foreground">Markets Watched</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{buySignals}</p>
                <p className="text-xs text-muted-foreground">Buy Signals</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{sellSignals}</p>
                <p className="text-xs text-muted-foreground">Sell Signals</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgConfidence}%</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Markets Section */}
        {markets.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Your Markets</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className={cn(
              'gap-4',
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'flex flex-col'
            )}>
              {markets.map((market) => (
                <MarketCard
                  key={market.id}
                  card={market}
                  isSelected={selectedMarketId === market.id}
                  onSelect={() => setSelectedMarketId(market.id)}
                  onRemove={() => handleRemoveMarket(market.id)}
                  onAnalyze={handleAnalyze}
                  onUpdate={handleUpdateMarket}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {markets.length === 0 && (
          <div className="mb-6 p-8 rounded-xl border border-dashed border-border bg-card/50 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Markets Added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Search for symbols above to start monitoring markets like XAUUSD, BTCUSD, or EURUSD
            </p>
          </div>
        )}

        {/* Main Grid - Risk Meter & Signal Log */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Risk Meter */}
          <div className="lg:col-span-1">
            <RiskMeter 
              accountBalance={ACCOUNT_BALANCE} 
              selectedMarket={selectedMarket}
              allMarkets={markets}
            />
          </div>
          
          {/* Right Column - Signal Log */}
          <div className="lg:col-span-2">
            <SignalLog 
              signals={signals} 
              filterSymbol={selectedMarket?.symbol}
            />
          </div>
        </div>

        {/* API Info */}
        <div className="mt-6 p-4 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-2">API Endpoint</h3>
          <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            POST /api/analyze
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Send JSON with: symbol, price, ema8, ema20, ema50, macd (line, signal, histogram)
          </p>
        </div>
      </main>
    </div>
  );
}
