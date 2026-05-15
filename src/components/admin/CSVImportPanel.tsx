'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, CheckSquare, Square, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, FileText, RefreshCw, AlignLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrandOption {
  brand: string;
  count: number;
}

interface ImportResult {
  brand: string;
  count: number;
}

interface CSVImportPanelProps {
  categoryType: 'SUNGLASSES' | 'PRESCRIPTION';
  onImportComplete?: () => void;
}

export function CSVImportPanel({ categoryType, onImportComplete }: CSVImportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'select' | 'importing' | 'done'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [productsPerBrand, setProductsPerBrand] = useState(10);
  const [selectedGender, setSelectedGender] = useState<'MEN' | 'WOMEN' | 'KIDS'>('WOMEN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{ created: number; skipped: number; results: ImportResult[]; errors?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── BigBuy Utility Buttons State ─────────────────────────────────────────
  const [descStatus, setDescStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [descResult, setDescResult] = useState<string | null>(null);
  const [stockStatus, setStockStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [stockResult, setStockResult] = useState<string | null>(null);
  const [priceChanges, setPriceChanges] = useState<Array<{
    sku: string;
    productName: string;
    oldWholesale: number;
    newWholesale: number;
    oldRetail: number;
    newRetail: number;
    diffPct: number;
  }> | null>(null);
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
      const changes = data.priceChanges || [];
      setPriceChanges(changes);
      setPriceChangesOpen(changes.length > 0);
      const priceNote = changes.length > 0 ? ` · ⚠️ ${changes.length} price change${changes.length > 1 ? 's' : ''} detected` : '';
      setStockResult(`✅ Updated ${data.updated} variants (${data.skipped} not found in BigBuy)${priceNote}`);
      setStockStatus('done');
    } catch (err: any) {
      setStockResult(err.message);
      setStockStatus('error');
    }
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please upload a .csv file');
      return;
    }
    setError(null);
    setCsvFile(file);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/csv-parse', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to parse CSV');

      setBrands(data.brands);
      setSelectedBrands(new Set(data.brands.map((b: BrandOption) => b.brand)));
      setStep('select');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  };

  const selectAll = () => setSelectedBrands(new Set(brands.map(b => b.brand)));
  const deselectAll = () => setSelectedBrands(new Set());

  const handleImport = async () => {
    if (!csvFile || selectedBrands.size === 0) return;
    setStep('importing');
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('brands', JSON.stringify(Array.from(selectedBrands)));
      formData.append('categoryType', categoryType);
      formData.append('productsPerBrand', String(productsPerBrand));
      formData.append('gender', selectedGender);

      const res = await fetch('/api/admin/csv-import', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Import failed');

      setImportResults(data);
      setStep('done');
      onImportComplete?.();
    } catch (err: any) {
      setError(err.message);
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setCsvFile(null);
    setBrands([]);
    setSelectedBrands(new Set());
    setImportResults(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* ─── CSV Import Panel ─────────────────────────────────────────── */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Upload className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-foreground">Import from BigBuy CSV</p>
            <p className="text-xs text-muted-foreground">Upload a CSV file to bulk import products by brand</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="border-t border-border p-5">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                  ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
                `}
              >
                <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-foreground mb-1">Drop your BigBuy CSV here</p>
                <p className="text-sm text-muted-foreground">or click to browse — semicolon-delimited (.csv)</p>
                {isLoading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Parsing CSV...</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}

          {/* STEP 2: Brand selection */}
          {step === 'select' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-foreground">Select Brands to Import</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {brands.length} brands found in <span className="font-medium">{csvFile?.name}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
                </div>
              </div>

              {/* Settings row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">Target Gender:</span>
                  <select
                    value={selectedGender}
                    onChange={e => setSelectedGender(e.target.value as any)}
                    className="border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="WOMEN">Women's</option>
                    <option value="MEN">Men's</option>
                    <option value="KIDS">Kids</option>
                  </select>
                </div>
                
                <div className="hidden sm:block w-px h-6 bg-border"></div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">Max products per brand:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={productsPerBrand}
                    onChange={e => setProductsPerBrand(parseInt(e.target.value) || 10)}
                    className="w-20 border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              {/* Brand grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1 mb-4">
                {brands.map(({ brand, count }) => {
                  const selected = selectedBrands.has(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={`
                        flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all text-sm
                        ${selected
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'}
                      `}
                    >
                      {selected
                        ? <CheckSquare className="w-4 h-4 shrink-0" />
                        : <Square className="w-4 h-4 shrink-0" />}
                      <span className="truncate">{brand}</span>
                      <span className="ml-auto text-xs opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedBrands.size}</span> brands selected
                  &nbsp;·&nbsp;up to <span className="font-semibold text-foreground">{selectedBrands.size * productsPerBrand}</span> products
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={reset}>Start Over</Button>
                  <Button
                    size="sm"
                    disabled={selectedBrands.size === 0}
                    onClick={handleImport}
                  >
                    Import {selectedBrands.size} Brand{selectedBrands.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Importing */}
          {step === 'importing' && (
            <div className="text-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="font-semibold text-foreground">Importing products...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Importing {selectedBrands.size} brands into the database. This may take a moment.
              </p>
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && importResults && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Import Complete!</p>
                  <p className="text-sm text-muted-foreground">
                    {importResults.created} products created · {importResults.skipped} skipped
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto mb-4">
                {importResults.results.map(({ brand, count }) => (
                  <div key={brand} className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-sm font-medium text-foreground truncate">{brand}</span>
                    <span className="text-xs text-green-600 dark:text-green-400 ml-2 shrink-0">{count} added</span>
                  </div>
                ))}
              </div>

              {/* Show errors if any */}
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-red-600 mb-2">Errors ({importResults.errors.length}):</p>
                  <div className="max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-xs text-red-700 dark:text-red-300 space-y-1">
                    {importResults.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={reset} variant="outline" size="sm">Import Another CSV</Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}
      </div>

      {/* ─── BigBuy Utility Buttons ────────────────────────────────────── */}
      <div className="border border-border rounded-xl bg-card p-5 space-y-3">
        <p className="font-semibold text-sm text-foreground mb-1">BigBuy Data Sync</p>
        <p className="text-xs text-muted-foreground mb-3">Run these after importing products to enrich your catalog with live BigBuy data.</p>

        {/* Fetch Descriptions */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <AlignLeft className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Fetch HTML Descriptions</p>
              <p className="text-xs text-muted-foreground">Pulls product descriptions from BigBuy API</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={descStatus === 'loading'}
            onClick={handleFetchDescriptions}
          >
            {descStatus === 'loading' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running...</> : 'Run'}
          </Button>
        </div>
        {descResult && (
          <p className={`text-xs px-3 py-1.5 rounded-md ${descStatus === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
            {descResult}
          </p>
        )}

        {/* Update Stock */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Update Stock Levels</p>
              <p className="text-xs text-muted-foreground">Syncs real stock quantities from BigBuy API</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={stockStatus === 'loading'}
            onClick={handleUpdateStock}
          >
            {stockStatus === 'loading' ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running...</> : 'Run'}
          </Button>
        </div>
        {stockResult && (
          <p className={`text-xs px-3 py-1.5 rounded-md ${stockStatus === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
            {stockResult}
          </p>
        )}

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
                  ⚠️ {priceChanges.length} BigBuy Price Change{priceChanges.length > 1 ? 's' : ''} Detected
                </span>
              </div>
              {priceChangesOpen
                ? <ChevronUp className="w-4 h-4 text-amber-600" />
                : <ChevronDown className="w-4 h-4 text-amber-600" />}
            </button>

            {priceChangesOpen && (
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {/* Header */}
                <div className="grid grid-cols-4 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
                  <span>Product</span>
                  <span className="text-right">Old wholesale</span>
                  <span className="text-right">New wholesale</span>
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
                💡 Prices above are BigBuy's wholesale cost. Your retail prices were NOT auto-updated. Review and adjust manually in the product editor if needed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
