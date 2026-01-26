import { getPrescriptionPricing } from "@/app/actions/prescriptionPricing";
import PrescriptionPricingManagement from "./PrescriptionPricingManagement";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrescriptionPricingPage() {
  const result = await getPrescriptionPricing();
  
  if (!result.success) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Pricing Data</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to load prescription pricing data. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pricingData = result.data || {
    lensPrices: [],
    tintFees: [],
    edgingFees: [],
    profit: null,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-brand-h1 font-headline text-foreground">Prescription Pricing Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage lens prices, tint fees, edging fees, and profit margin based on BOD Lenses Price List 2025
        </p>
      </div>
      <PrescriptionPricingManagement initialData={pricingData} />
    </div>
  );
}

