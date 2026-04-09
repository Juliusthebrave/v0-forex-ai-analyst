'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onAddSymbol: (symbol: string) => void;
  existingSymbols: string[];
}

const POPULAR_SYMBOLS = [
  { symbol: 'EUR/USD', label: 'Euro/Dollar', category: 'forex' },
  { symbol: 'GBP/USD', label: 'Pound/Dollar', category: 'forex' },
  { symbol: 'USD/JPY', label: 'Dollar/Yen', category: 'forex' },
  { symbol: 'XAU/USD', label: 'Gold/Dollar', category: 'commodity' },
  { symbol: 'BTC/USD', label: 'Bitcoin/Dollar', category: 'crypto' },
  { symbol: 'ETH/USD', label: 'Ethereum/Dollar', category: 'crypto' },
  { symbol: 'USD/CHF', label: 'Dollar/Franc', category: 'forex' },
  { symbol: 'AUD/USD', label: 'Aussie/Dollar', category: 'forex' },
  { symbol: 'USD/CAD', label: 'Dollar/Loonie', category: 'forex' },
  { symbol: 'NZD/USD', label: 'Kiwi/Dollar', category: 'forex' },
  { symbol: 'EUR/GBP', label: 'Euro/Pound', category: 'forex' },
  { symbol: 'EUR/JPY', label: 'Euro/Yen', category: 'forex' },
  { symbol: 'XAG/USD', label: 'Silver/Dollar', category: 'commodity' },
  { symbol: 'WTI/USD', label: 'Oil (WTI)', category: 'commodity' },
];

export function SearchBar({ onAddSymbol, existingSymbols }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSymbols = POPULAR_SYMBOLS.filter(
    (s) =>
      (s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.label.toLowerCase().includes(query.toLowerCase())) &&
      !existingSymbols.includes(s.symbol)
  );

  const handleSelect = (symbol: string) => {
    onAddSymbol(symbol);
    setQuery('');
    setIsOpen(false);
  };

  const handleCustomSymbol = () => {
    if (query.trim() && !existingSymbols.includes(query.trim().toUpperCase())) {
      onAddSymbol(query.trim().toUpperCase());
      setQuery('');
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'forex': return 'bg-blue-500/10 text-blue-500';
      case 'crypto': return 'bg-purple-500/10 text-purple-500';
      case 'commodity': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search symbols (XAUUSD, BTCUSD, EURUSD...)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 h-12 text-base"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Button 
          onClick={handleCustomSymbol}
          disabled={!query.trim() || existingSymbols.includes(query.trim().toUpperCase())}
          className="h-12 px-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
        >
          {filteredSymbols.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto">
              {filteredSymbols.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelect(item.symbol)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{item.symbol}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium capitalize',
                    getCategoryColor(item.category)
                  )}>
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                No matching symbols found
              </p>
              <Button variant="outline" size="sm" onClick={handleCustomSymbol}>
                <Plus className="h-3 w-3 mr-1" />
                Add &quot;{query.toUpperCase()}&quot; as custom symbol
              </Button>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Popular Symbols</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SYMBOLS.slice(0, 8)
                  .filter(s => !existingSymbols.includes(s.symbol))
                  .map((item) => (
                    <Button
                      key={item.symbol}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(item.symbol)}
                      className="text-xs"
                    >
                      {item.symbol}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
