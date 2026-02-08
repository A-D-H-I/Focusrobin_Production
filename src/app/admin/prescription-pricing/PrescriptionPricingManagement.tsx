"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBundlePrice } from "@/app/actions/bundlePricing";
import {
  LENS_BUNDLE_LABELS,
  LENS_BUNDLE_DETAILS,
  BUNDLE_PRICES as DEFAULT_BUNDLE_PRICES,
  BUNDLE_BOD_MAPPING,
  COATING_LABELS,
  type LensBundle,
} from "@/lib/lensPricing";
import { getBundleCost } from "@/lib/pricing/costing";
import { Calculator, DollarSign, Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionPricingManagementProps {
  initialData: {
    lensPrices: any[];
    tintFees: any[];
    edgingFees: any[];
    profit: number | null;
  };
  initialBundlePrices: Record<string, number>;
}

export default function PrescriptionPricingManagement({
  initialData,
  initialBundlePrices,
}: PrescriptionPricingManagementProps) {
  const { toast } = useToast();
  const [bundlePrices, setBundlePrices] = useState<Record<string, number>>(initialBundlePrices || DEFAULT_BUNDLE_PRICES);
  const [updatingBundle, setUpdatingBundle] = useState<string | null>(null);

  const handleUpdatePrice = async (bundleId: string, newPriceStr: string) => {
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice < 0) return;

    setUpdatingBundle(bundleId);
    try {
      const result = await updateBundlePrice(bundleId, newPrice);
      if ('success' in result && result.success) {
        setBundlePrices((prev) => ({ ...prev, [bundleId]: newPrice }));
        toast({
          title: "Price Updated",
          description: `Price for ${LENS_BUNDLE_LABELS[bundleId as LensBundle]} updated to €${newPrice.toFixed(2)}`,
        });
      } else {
        throw new Error('error' in result ? result.error : "Failed to update price");
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update price. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingBundle(null);
    }
  };

  return (
    <div className="space-y-8">

      {/* Sales Prices Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Manage Bundle Sales Prices
          </CardTitle>
          <CardDescription>
            Set the customer-facing price for each lens bundle. These are the prices shown in the shop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.keys(DEFAULT_BUNDLE_PRICES) as LensBundle[]).map((bundle) => {
              const details = LENS_BUNDLE_DETAILS[bundle];
              const currentPrice = bundlePrices[bundle] ?? DEFAULT_BUNDLE_PRICES[bundle];
              const isUpdating = updatingBundle === bundle;

              return (
                <div key={bundle} className="border rounded-lg p-4 bg-card hover:bg-muted/10 transition-colors">
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm">{LENS_BUNDLE_LABELS[bundle]}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 h-4">{details.bestFor}</p>
                  </div>

                  <div className="flex items-end gap-2 mt-3">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`price-${bundle}`} className="text-xs">Price (€)</Label>
                      <Input
                        id={`price-${bundle}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setBundlePrices(prev => ({ ...prev, [bundle]: val }));
                          }
                        }}
                        className="h-9"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const val = document.getElementById(`price-${bundle}`) as HTMLInputElement;
                        if (val) handleUpdatePrice(bundle, val.value);
                      }}
                      disabled={isUpdating}
                      className="h-9 w-9 p-0 shrink-0"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bundle Profitability Analysis */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <Calculator className="h-6 w-6" />
            Bundle Profitability Analysis
          </CardTitle>
          <CardDescription>
            Live profit calculation: Sales Price (Fixed) - Total Cost (Lens Buy Price + Tint + Edging)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {(Object.keys(DEFAULT_BUNDLE_PRICES) as LensBundle[]).map((bundle) => {
              const details = LENS_BUNDLE_DETAILS[bundle];
              const mapping = BUNDLE_BOD_MAPPING[bundle];
              // Use dynamic price if available, else fallback
              const salesPrice = bundlePrices[bundle] ?? DEFAULT_BUNDLE_PRICES[bundle];

              const { totalCost, lensPairCost, tintCost, edgingCost, isMissingCost } = getBundleCost(bundle);
              const profitAmount = salesPrice - totalCost;
              const margin = salesPrice > 0 ? (profitAmount / salesPrice) * 100 : 0;

              return (
                <div key={bundle} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

                    {/* INFO */}
                    <div className="flex-1 min-w-[250px]">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base">{LENS_BUNDLE_LABELS[bundle]}</h4>
                        {!isMissingCost ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Cost Data Found</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Missing Cost Data</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{details.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs font-mono text-muted-foreground">
                        <span className="bg-secondary px-1.5 py-0.5 rounded">Idx: {mapping.index}</span>
                        <span className="bg-secondary px-1.5 py-0.5 rounded">Coat: {COATING_LABELS[mapping.coating]}</span>
                        <span className="bg-secondary px-1.5 py-0.5 rounded" title={mapping.techCode}>{mapping.techCode.split('_')[0]}...</span>
                      </div>
                    </div>

                    {/* FINANCIALS */}
                    <div className="flex gap-6 text-sm flex-wrap">

                      {/* SALES */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Sales Price</p>
                        <p className="text-lg font-bold text-primary">€{salesPrice.toFixed(2)}</p>
                      </div>

                      {/* COSTS */}
                      <div className="text-right border-l pl-4">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Total Cost</p>
                        {isMissingCost ? (
                          <p className="font-mono font-medium text-destructive">Unavailable</p>
                        ) : (
                          <>
                            <p className="font-mono font-medium">€{totalCost.toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              (L:€{lensPairCost.toFixed(2)} + T:€{tintCost.toFixed(2)} + E:€{edgingCost.toFixed(2)})
                            </p>
                          </>
                        )}
                      </div>

                      {/* PROFIT */}
                      <div className="text-right border-l pl-4 min-w-[100px]">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Net Profit</p>
                        {isMissingCost ? (
                          <p className="text-lg font-bold text-muted-foreground">—</p>
                        ) : (
                          <>
                            <p className={`text-lg font-bold ${profitAmount >= 15 ? 'text-green-600' : profitAmount > 0 ? 'text-orange-500' : 'text-red-600'}`}>
                              €{profitAmount.toFixed(2)}
                            </p>
                            <p className={`text-xs font-medium ${margin >= 50 ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {margin.toFixed(0)}% Margin
                            </p>
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
