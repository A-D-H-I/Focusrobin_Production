"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  updateLensPrice, 
  updateTintFee, 
  updateEdgingFee, 
  updateFixedProfit 
} from "@/app/actions/prescriptionPricing";
import { 
  LENS_TYPE_LABELS, 
  COATING_LABELS,
  type LensType,
  type LensIndex,
  type Coating,
} from "@/lib/lensPricing";
import { FRAME_TYPE_LABELS } from "@/lib/pricing/rx167";
import { DollarSign, Info, Glasses, Palette, Settings, Calculator } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface PrescriptionPricingManagementProps {
  initialData: {
    lensPrices: Array<{
      id: string;
      lensType: string;
      lensIndex: string;
      coating: string;
      price: number;
      isActive: boolean;
    }>;
    tintFees: Array<{
      id: string;
      tintType: string;
      price: number;
      isActive: boolean;
    }>;
    edgingFees: Array<{
      id: string;
      frameType: string;
      price: number;
      isActive: boolean;
    }>;
    profit: number | null;
  };
}

const TINT_TYPE_LABELS: Record<string, string> = {
  FULL_TINT_CATALOG: "Full Tint (Catalog Colors)",
  GRADIENT: "Gradient Tint",
};

// Available combinations based on UI logic
const AVAILABLE_COMBINATIONS: Record<string, { indexes: string[]; coatings: string[] }> = {
  CLEAR: { indexes: ["1.56", "1.60", "1.67"], coatings: ["UC", "BLUE_PRO"] },
  TINTED: { indexes: ["1.56", "1.60", "1.67"], coatings: ["SERICUM_UV"] },
  PHOTOCHROMIC_SOLIS: { indexes: ["1.56", "1.60", "1.67"], coatings: ["SERICUM_UV", "BLUE_PRO"] },
  POLARIZED_NUPOLAR: { indexes: ["1.60", "1.67"], coatings: ["SERICUM_UV"] },
};

export default function PrescriptionPricingManagement({
  initialData,
}: PrescriptionPricingManagementProps) {
  const { toast } = useToast();
  const [lensPrices, setLensPrices] = useState(initialData.lensPrices);
  const [tintFees, setTintFees] = useState(initialData.tintFees);
  const [edgingFees, setEdgingFees] = useState(initialData.edgingFees);
  const [profit, setProfit] = useState(initialData.profit?.toString() || "15.00");
  const [saving, setSaving] = useState<string | null>(null);

  const handleLensPriceUpdate = async (id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Invalid price",
        description: "Price must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setSaving(`lens-${id}`);
    try {
      const result = await updateLensPrice(id, price);
      if (result.success) {
        setLensPrices((prev) =>
          prev.map((p) => (p.id === id ? { ...p, price } : p))
        );
        toast({
          title: "Price updated",
          description: "Lens price has been updated successfully",
        });
      } else {
        throw new Error(result.error || "Failed to update price");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update price",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleTintFeeUpdate = async (id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Invalid price",
        description: "Price must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setSaving(`tint-${id}`);
    try {
      const result = await updateTintFee(id, price);
      if (result.success) {
        setTintFees((prev) =>
          prev.map((p) => (p.id === id ? { ...p, price } : p))
        );
        toast({
          title: "Fee updated",
          description: "Tint fee has been updated successfully",
        });
      } else {
        throw new Error(result.error || "Failed to update fee");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update fee",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleEdgingFeeUpdate = async (id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Invalid price",
        description: "Price must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setSaving(`edging-${id}`);
    try {
      const result = await updateEdgingFee(id, price);
      if (result.success) {
        setEdgingFees((prev) =>
          prev.map((p) => (p.id === id ? { ...p, price } : p))
        );
        toast({
          title: "Fee updated",
          description: "Edging fee has been updated successfully",
        });
      } else {
        throw new Error(result.error || "Failed to update fee");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update fee",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleProfitUpdate = async () => {
    const profitValue = parseFloat(profit);
    if (isNaN(profitValue) || profitValue < 0) {
      toast({
        title: "Invalid profit",
        description: "Profit must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setSaving("profit");
    try {
      const result = await updateFixedProfit(profitValue);
      if (result.success) {
        toast({
          title: "Profit updated",
          description: "Fixed profit has been updated successfully",
        });
      } else {
        throw new Error(result.error || "Failed to update profit");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profit",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  // Group lens prices by type
  const groupedByType = lensPrices.reduce((acc, price) => {
    if (!acc[price.lensType]) {
      acc[price.lensType] = {};
    }
    if (!acc[price.lensType][price.lensIndex]) {
      acc[price.lensType][price.lensIndex] = [];
    }
    acc[price.lensType][price.lensIndex].push(price);
    return acc;
  }, {} as Record<string, Record<string, typeof lensPrices>>);

  // Check if a combination is available in the UI
  const isAvailableInUI = (lensType: string, index: string, coating: string): boolean => {
    const combo = AVAILABLE_COMBINATIONS[lensType];
    if (!combo) return false;
    return combo.indexes.includes(index) && combo.coatings.includes(coating);
  };

  return (
    <div className="space-y-6">
      {/* Pricing Information Alert */}
      <Alert className="border-primary/20 bg-primary/5">
        <Calculator className="h-4 w-4" />
        <AlertTitle>Pricing Formula (from PDF)</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p><strong>Lens Prices:</strong> Per SINGLE lens</p>
              <p><strong>Tint Fees:</strong> Per PAIR (€3/lens for Full, €4/lens for Gradient)</p>
              <p><strong>Edging Fees:</strong> Per ORDER (one-time)</p>
              <p><strong>Fixed Profit:</strong> Per ORDER (€15 default)</p>
            </div>
            <div className="bg-background p-3 rounded-lg border">
              <p className="font-mono text-xs">
                <strong>Final Rx Price =</strong><br />
                (Single Lens × 2) + Tint + Edging + Profit
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Available Combinations Reference */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Available UI Combinations</AlertTitle>
        <AlertDescription className="mt-2 text-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <p><Badge variant="outline" className="mr-2">CLEAR</Badge> 1.56, 1.60, 1.67 | UC, BLUE_PRO</p>
            <p><Badge variant="outline" className="mr-2">TINTED</Badge> 1.56, 1.60, 1.67 | SERICUM_UV only</p>
            <p><Badge variant="outline" className="mr-2">PHOTOCHROMIC</Badge> 1.56, 1.60, 1.67 | SERICUM_UV, BLUE_PRO</p>
            <p><Badge variant="outline" className="mr-2">POLARIZED</Badge> 1.60, 1.67 only | SERICUM_UV only</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Fixed Profit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Fixed Profit Margin
          </CardTitle>
          <CardDescription>
            Profit amount added to each prescription lens order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="profit">Fixed Profit (EUR)</Label>
              <Input
                id="profit"
                type="number"
                step="0.01"
                min="0"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
                placeholder="15.00"
                className="text-lg font-mono"
              />
            </div>
            <Button
              onClick={handleProfitUpdate}
              disabled={saving === "profit"}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving === "profit" ? "Saving..." : "Save Profit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lens Prices by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Glasses className="h-5 w-5" />
            Lens Prices (Per Single Lens)
          </CardTitle>
          <CardDescription>
            Base cost prices - pair price is calculated as single × 2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedByType).map(([lensType, indices]) => (
            <div key={lensType} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b">
                <h3 className="font-semibold text-lg">
                  {LENS_TYPE_LABELS[lensType as LensType] || lensType}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Available: {AVAILABLE_COMBINATIONS[lensType]?.indexes.join(", ")} | {AVAILABLE_COMBINATIONS[lensType]?.coatings.map(c => COATING_LABELS[c as Coating] || c).join(", ")}
                </p>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium">Index</th>
                        <th className="text-left py-2 px-2 font-medium">Coating</th>
                        <th className="text-right py-2 px-2 font-medium">Single (€)</th>
                        <th className="text-right py-2 px-2 font-medium">Pair (€)</th>
                        <th className="text-center py-2 px-2 font-medium">In UI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(indices).flatMap(([index, prices]) =>
                        prices.map((price) => {
                          const available = isAvailableInUI(price.lensType, price.lensIndex, price.coating);
                          return (
                            <tr key={price.id} className={`border-b last:border-b-0 ${!available ? 'opacity-50 bg-muted/30' : ''}`}>
                              <td className="py-2 px-2 font-mono">{price.lensIndex}</td>
                              <td className="py-2 px-2">
                                {COATING_LABELS[price.coating as Coating] || price.coating}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={price.price}
                                  onChange={(e) => {
                                    setLensPrices((prev) =>
                                      prev.map((p) =>
                                        p.id === price.id
                                          ? { ...p, price: parseFloat(e.target.value) || 0 }
                                          : p
                                      )
                                    );
                                  }}
                                  onBlur={(e) => handleLensPriceUpdate(price.id, e.target.value)}
                                  disabled={saving === `lens-${price.id}`}
                                  className="w-24 text-right font-mono"
                                />
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                                €{(Number(price.price) * 2).toFixed(2)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                {available ? (
                                  <Badge variant="default" className="bg-green-600 text-xs">Yes</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">No</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tint Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-600" />
            Tint Fees (Per Pair)
          </CardTitle>
          <CardDescription>
            Additional fees for tinting services - only applies to TINTED lens type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tintFees.map((fee) => (
              <div key={fee.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-medium">{TINT_TYPE_LABELS[fee.tintType] || fee.tintType}</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fee.tintType === 'FULL_TINT_CATALOG' ? '€3 per lens × 2' : '€4 per lens × 2'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fee.price}
                    onChange={(e) => {
                      setTintFees((prev) =>
                        prev.map((p) =>
                          p.id === fee.id
                            ? { ...p, price: parseFloat(e.target.value) || 0 }
                            : p
                        )
                      );
                    }}
                    onBlur={(e) => handleTintFeeUpdate(fee.id, e.target.value)}
                    disabled={saving === `tint-${fee.id}`}
                    className="w-24 text-right font-mono"
                  />
                  <span className="text-sm text-muted-foreground">€</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edging Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            Edging/Mounting Fees (Per Order)
          </CardTitle>
          <CardDescription>
            Frame mounting and edging fees - applied once per order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {edgingFees.map((fee) => (
              <div key={fee.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-base font-medium">
                    {FRAME_TYPE_LABELS[fee.frameType as keyof typeof FRAME_TYPE_LABELS] || fee.frameType}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fee.price}
                    onChange={(e) => {
                      setEdgingFees((prev) =>
                        prev.map((p) =>
                          p.id === fee.id
                            ? { ...p, price: parseFloat(e.target.value) || 0 }
                            : p
                        )
                      );
                    }}
                    onBlur={(e) => handleEdgingFeeUpdate(fee.id, e.target.value)}
                    disabled={saving === `edging-${fee.id}`}
                    className="w-24 text-right font-mono"
                  />
                  <span className="text-sm text-muted-foreground">€</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Example */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Calculator className="h-5 w-5" />
            Pricing Example
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="mb-3"><strong>POLARIZED_NUPOLAR 1.67 + SERICUM_UV + Full Frame:</strong></p>
          <div className="font-mono bg-muted p-3 rounded-lg space-y-1">
            <p>Single lens: €64.62</p>
            <p>Pair (×2): €129.24</p>
            <p>Edging (FULL_FRAME): €4.60</p>
            <p>Profit: €{profit}</p>
            <p className="border-t pt-1 mt-1 font-semibold">
              Total Rx Add-on: €{(129.24 + 4.60 + parseFloat(profit || "15")).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
