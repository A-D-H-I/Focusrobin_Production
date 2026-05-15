'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, AlignLeft, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PriceChange {
  sku: string;
  productName: string;
  oldWholesale: number;
  newWholesale: number;
  oldRetail: number;
  newRetail: number;
  diffPct: number;
}

export function BigBuySyncButtons() {
  const [descStatus, setDescStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [descResult, setDescResult] = useState<string | null>(null);

  const [stockStatus, setStockStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [stockResult, setStockResult] = useState<string | null>(null);
  const [priceChanges, setPriceChanges] = useState<PriceChange[] | null>(null);
  const [priceChangesOpen, setPriceChangesOpen] = useState(false);

  const handleFetchDescriptions = async () => {
    setDescStatus('loading');
    setDescResult(null);
    try {
      const res = await fetch('/api/admin/bigbuy-fetch-descriptions', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDescResult(`✅ Updated ${data.updated} products (${data.failed} failed, ${data.skipped} skipped)`);
      setDescStatus('done');
    } catch (err: any) {
      setDescResult(err.message);
      setDescStatus('error');
    }
  };

  const handleUpdateStock = async () => {
    setStockStatus('loading');
    setStockResult(null);
    setPriceChanges(null);
    try {
      const res = await fetch('/api/admin/bigbuy-update-stock', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const changes: PriceChange[] = data.priceChanges || [];
      setPriceChanges(changes);
      setPriceChangesOpen(changes.length > 0);
      const priceNote = changes.length > 0
        ? ` · ⚠️ ${changes.length} price change${changes.length > 1 ? 's' : ''} detected`
        : '';
      setStockResult(`✅ Updated ${data.updated} variants (${data.skipped} not in BigBuy)${priceNote}`);
      setStockStatus('done');
    } catch (err: any) {
      setStockResult(err.message);
      setStockStatus('error');
    }
  };

  return (
    <div className="border border-border rounded-xl bg-card p-5 space-y-4 mb-6">
      <div>
        <p className="font-semibold text-sm text-foreground">BigBuy Data Sync</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Run these to sync live BigBuy data into your catalog.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Fetch HTML Descriptions */}
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <AlignLeft className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">HTML Descriptions</p>
                <p className="text-xs text-muted-foreground">Pulls product descriptions from BigBuy</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={descStatus === 'loading'}
              onClick={handleFetchDescriptions}
              className="shrink-0"
            >
              {descStatus === 'loading'
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running...</>
                : 'Run'}
            </Button>
          </div>
          {descResult && (
            <p className={`text-xs px-3 py-1.5 rounded-md ${
              descStatus === 'error'
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {descResult}
            </p>
          )}
        </div>

        {/* Update Stock */}
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Update Stock & Prices</p>
                <p className="text-xs text-muted-foreground">Syncs stock + detects price changes</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={stockStatus === 'loading'}
              onClick={handleUpdateStock}
              className="shrink-0"
            >
              {stockStatus === 'loading'
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running...</>
                : 'Run'}
            </Button>
          </div>
          {stockResult && (
            <p className={`text-xs px-3 py-1.5 rounded-md ${
              stockStatus === 'error'
                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {stockResult}
            </p>
          )}
        </div>
      </div>

      {/* Price Changes Panel */}
      {priceChanges && priceChanges.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
          <button
            onClick={() => setPriceChangesOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                ⚠️ {priceChanges.length} BigBuy Wholesale Price Change{priceChanges.length > 1 ? 's' : ''} Detected
              </span>
            </div>
            {priceChangesOpen
              ? <ChevronUp className="w-4 h-4 text-amber-600" />
              : <ChevronDown className="w-4 h-4 text-amber-600" />}
          </button>

          {priceChangesOpen && (
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              <div className="grid grid-cols-4 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
                <span>Product</span>
                <span className="text-right">Old cost</span>
                <span className="text-right">New cost</span>
                <span className="text-right">Change</span>
              </div>
              {priceChanges.map((ch, i) => (
                <div key={i} className="grid grid-cols-4 px-3 py-2 items-center hover:bg-muted/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{ch.productName}</p>
                    <p className="text-[10px] text-muted-foreground">{ch.sku}</p>
                  </div>
                  <span className="text-xs text-right text-muted-foreground">€{ch.oldWholesale.toFixed(2)}</span>
                  <span className="text-xs text-right font-medium text-foreground">€{ch.newWholesale.toFixed(2)}</span>
                  <div className="flex items-center justify-end gap-1">
                    {ch.diffPct > 0
                      ? <TrendingUp className="w-3 h-3 text-red-500" />
                      : <TrendingDown className="w-3 h-3 text-green-500" />}
                    <span className={`text-xs font-semibold ${ch.diffPct > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {ch.diffPct > 0 ? '+' : ''}{ch.diffPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              💡 These are BigBuy&apos;s wholesale costs. Your retail prices were NOT auto-updated — review and adjust manually if needed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
