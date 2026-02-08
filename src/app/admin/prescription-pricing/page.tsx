import { getPrescriptionPricing } from "@/app/actions/prescriptionPricing";
import { getBundlePrices } from "@/app/actions/bundlePricing";
import PrescriptionPricingManagement from "./PrescriptionPricingManagement";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrescriptionPricingPage() {
  const [legacyResult, bundleResult] = await Promise.all([
    getPrescriptionPricing(),
    getBundlePrices(),
  ]);

  if (!legacyResult.success) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Pricing Data</AlertTitle>
          <AlertDescription>
            {legacyResult.error || "Failed to load prescription pricing data."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pricingData = legacyResult.data || {
    lensPrices: [],
    tintFees: [],
    edgingFees: [],
    profit: null,
  };

  const bundlePrices = bundleResult.success ? bundleResult.data : {};

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-brand-h1 font-headline text-foreground">Prescription Pricing Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage lens prices, tint fees, edging fees, and profit margin based on BOD Lenses Price List 2025
        </p>
      </div>
      <PrescriptionPricingManagement initialData={pricingData} initialBundlePrices={bundlePrices} />
    </div>
  );
}

