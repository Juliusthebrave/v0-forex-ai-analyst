'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Wallet, Edit2, Check, X, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export function BalanceCard({ balance, onBalanceChange }: BalanceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(balance.toString());

  const maxRiskPerTrade = balance * 0.02; // 2% risk
  const recommendedLotSize = (balance * 0.01) / 100; // 1% risk with 100 pip SL
  const dailyLossLimit = balance * 0.06; // 6% daily max loss

  const handleSave = () => {
    const newBalance = parseFloat(editValue);
    if (!isNaN(newBalance) && newBalance > 0) {
      onBalanceChange(newBalance);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(balance.toString());
    setIsEditing(false);
  };

  const getAccountSizeCategory = (bal: number) => {
    if (bal < 50) return { label: 'Micro', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (bal < 200) return { label: 'Mini', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (bal < 1000) return { label: 'Small', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    return { label: 'Standard', color: 'text-primary', bg: 'bg-primary/10' };
  };

  const category = getAccountSizeCategory(balance);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Account Balance</h2>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-8 w-32 text-lg font-bold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                </div>
              ) : (
                <p className="text-2xl font-bold text-foreground">${balance.toFixed(2)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-1 rounded-md text-xs font-medium', category.bg, category.color)}>
              {category.label}
            </span>
            {isEditing ? (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                  <Check className="h-4 w-4 text-emerald-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Risk Calculations */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground mb-1">2% Risk/Trade</p>
            <p className="text-lg font-bold text-foreground">${maxRiskPerTrade.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground mb-1">Rec. Lot Size</p>
            <p className="text-lg font-bold text-foreground">{recommendedLotSize.toFixed(3)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground mb-1">Daily Limit</p>
            <p className="text-lg font-bold text-foreground">${dailyLossLimit.toFixed(2)}</p>
          </div>
        </div>

        {/* Small Account Warning */}
        {balance < 100 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Small Account Advisory</p>
              <p className="text-xs text-amber-500/80 mt-1">
                With a ${balance.toFixed(0)} balance, AI will recommend conservative trades. 
                Consider using micro lots (0.01) and wider stop losses to manage risk effectively.
              </p>
            </div>
          </div>
        )}

        {/* Balance Tips */}
        <div className="p-3 rounded-lg bg-muted/20 flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Risk Management Rules</p>
            <ul className="space-y-1">
              <li>Max 2% risk per trade (${maxRiskPerTrade.toFixed(2)})</li>
              <li>Max 6% daily drawdown (${dailyLossLimit.toFixed(2)})</li>
              <li>AI adjusts analysis based on your account size</li>
            </ul>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {[27, 50, 100, 250, 500, 1000].map((preset) => (
              <Button
                key={preset}
                variant={balance === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => onBalanceChange(preset)}
                className="h-7 text-xs"
              >
                ${preset}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
