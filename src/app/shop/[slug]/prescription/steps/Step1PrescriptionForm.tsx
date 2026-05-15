"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Upload, ArrowRight, HelpCircle, Loader2, CheckCircle, X } from "lucide-react";
import type { PrescriptionData, RxConfigData } from "@/types/prescription";
import { type RxPriceResult } from "@/lib/pricing/rx167";
import { useToast } from "@/hooks/use-toast";

interface Step1PrescriptionFormProps {
  prescriptionData: PrescriptionData;
  rxConfig?: RxConfigData;
  onDataUpdate: (data: Partial<PrescriptionData>) => void;
  onNext: () => void | Promise<void>;
  onBack: () => void;
  rxPriceResult: RxPriceResult;
  framePrice: number;
  formatPrice: (price: number) => string;
}

// Generate prescription values for dropdowns based on category
const getSphValues = (category?: 'NORMAL' | 'HIGH') => {
  const max = category === 'NORMAL' ? 6 : 20;
  const values: string[] = [];
  for (let i = -max; i <= max; i += 0.25) {
    const val = i.toFixed(2);
    values.push(val.startsWith('-') ? val : `+${val}`);
  }
  return values;
};

const getCylValues = () => {
  const max = 10;
  const values: string[] = [];
  for (let i = -max; i <= max; i += 0.25) {
    const val = i.toFixed(2);
    values.push(val.startsWith('-') ? val : `+${val}`);
  }
  return values;
};
const axisValues = ["0", ...Array.from({ length: 180 }, (_, i) => (i + 1).toString())]; // Include 0 as first option
const pdValues = Array.from({ length: 100 }, (_, i) => ((i + 40) / 2).toFixed(2));

// Generate prism values (0.00 to 10.00 in 0.25 increments)
const generatePrismValues = () => {
  const values: string[] = [];
  for (let i = 0; i <= 40; i++) {
    values.push((i * 0.25).toFixed(2));
  }
  return values;
};

const prismValues = generatePrismValues();
const horizontalBaseDirections = ["IN", "OUT"];
const verticalBaseDirections = ["UP", "DOWN"];

export default function Step1PrescriptionForm({
  prescriptionData,
  rxConfig,
  onDataUpdate,
  onNext,
  onBack,
  rxPriceResult,
  framePrice,
  formatPrice,
}: Step1PrescriptionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPdHelpOpen, setIsPdHelpOpen] = useState(false);
  const [isPrismHelpOpen, setIsPrismHelpOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle prescription file upload to S3
  const handlePrescriptionUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/prescription", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload prescription");
      }

      // Update prescription data with S3 URL and PDF mode
      // Ensure we create a new object to trigger React state update
      onDataUpdate({
        prescriptionImageUrl: result.url,
        prescriptionPdfUrl: result.url,
        isPdfMode: true,
      });

      // Force a small delay to ensure state propagation
      // This helps in Docker environments where state updates might be slower
      await new Promise(resolve => setTimeout(resolve, 100));

      toast({
        title: "Prescription uploaded",
        description: "Your prescription has been uploaded successfully.",
      });

      console.log("Prescription uploaded to S3:", result.url);
    } catch (error: any) {
      console.error("Error uploading prescription:", error);
      setUploadError(error.message || "Failed to upload prescription");

      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove uploaded prescription
  const handleRemovePrescription = () => {
    onDataUpdate({
      prescriptionImageUrl: undefined,
      prescriptionPdfUrl: undefined,
      isPdfMode: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Check if PDF is uploaded - check both prescriptionPdfUrl and prescriptionImageUrl
  // If either exists, consider PDF uploaded (more lenient check)
  // Use useMemo to ensure reactivity
  const hasPdfUploaded = useMemo(() => {
    const uploaded = !!(
      prescriptionData.prescriptionPdfUrl ||
      prescriptionData.prescriptionImageUrl
    );
    console.log('[Step1PrescriptionForm] hasPdfUploaded check:', {
      prescriptionPdfUrl: prescriptionData.prescriptionPdfUrl,
      prescriptionImageUrl: prescriptionData.prescriptionImageUrl,
      isPdfMode: prescriptionData.isPdfMode,
      uploaded
    });
    return uploaded;
  }, [prescriptionData.prescriptionPdfUrl, prescriptionData.prescriptionImageUrl, prescriptionData.isPdfMode]);

  // Check if PD is filled
  // If PDF is uploaded, PD is not required - allow submission
  // Use useMemo to ensure reactivity
  const isPdFilled = useMemo(() => {
    const filled = hasPdfUploaded
      ? true // PDF uploaded, PD not required - always allow submission
      : prescriptionData.hasTwoPDs
        ? (prescriptionData.pdOd && prescriptionData.pdOd !== "" && prescriptionData.pdOs && prescriptionData.pdOs !== "")
        : (prescriptionData.pd && prescriptionData.pd !== "");
    console.log('[Step1PrescriptionForm] isPdFilled check:', {
      hasPdfUploaded,
      hasTwoPDs: prescriptionData.hasTwoPDs,
      pd: prescriptionData.pd,
      pdOd: prescriptionData.pdOd,
      pdOs: prescriptionData.pdOs,
      filled
    });
    return filled;
  }, [hasPdfUploaded, prescriptionData.hasTwoPDs, prescriptionData.pd, prescriptionData.pdOd, prescriptionData.pdOs]);

  // Generate values based on selected category
  const sphValues = useMemo(() => getSphValues(rxConfig?.powerCategory), [rxConfig?.powerCategory]);
  const cylValues = useMemo(() => getCylValues(), []);

  // Debug: Log the state to help troubleshoot
  useEffect(() => {
    console.log('[Step1PrescriptionForm] State update detected', {
      isPdfMode: prescriptionData.isPdfMode,
      prescriptionPdfUrl: prescriptionData.prescriptionPdfUrl,
      prescriptionImageUrl: prescriptionData.prescriptionImageUrl,
      hasPdfUploaded,
      isPdFilled,
      submitButtonEnabled: isPdFilled,
    });
  }, [hasPdfUploaded, isPdFilled, prescriptionData.isPdfMode, prescriptionData.prescriptionPdfUrl, prescriptionData.prescriptionImageUrl]);

  const handleInputChange = (field: string, value: string, eye?: 'od' | 'os') => {
    if (eye) {
      onDataUpdate({
        [eye]: {
          ...prescriptionData[eye],
          [field]: value,
        },
      });
    } else {
      onDataUpdate({ [field]: value });
    }
  };

  const handleCheckboxChange = (field: 'hasTwoPDs' | 'hasPrism', checked: boolean) => {
    onDataUpdate({ [field]: checked });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-headline">Enter your prescription</h2>
      </div>

      {/* Upload Button */}
      <div className="space-y-2">
        {prescriptionData.prescriptionImageUrl ? (
          // Show uploaded state
          <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Prescription uploaded</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemovePrescription}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Preview if it's an image */}
            {prescriptionData.prescriptionImageUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) && (
              <div className="mt-3">
                <img
                  src={prescriptionData.prescriptionImageUrl}
                  alt="Prescription preview"
                  className="max-h-32 rounded-md object-contain"
                />
              </div>
            )}
          </div>
        ) : (
          // Show upload button
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-12 w-full flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Choose my prescription</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </>
            )}
          </Button>
        )}

        {/* Upload error message */}
        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            // Upload to S3
            handlePrescriptionUpload(file);
          }
        }}
      />

      {/* Prescription Table - Only show if PDF is NOT uploaded */}
      {!hasPdfUploaded && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">prescription</h3>

          {/* Desktop Table View - Hidden on mobile */}
          <div className="border rounded-lg overflow-hidden hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="p-3 text-left text-sm font-medium"></th>
                  <th className="p-3 text-center text-sm font-medium">SPH</th>
                  <th className="p-3 text-center text-sm font-medium">CYL</th>
                  <th className="p-3 text-center text-sm font-medium">AXIS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">OD (Right)</td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.od.sph}
                      onValueChange={(value) => handleInputChange('sph', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {sphValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.od.cyl}
                      onValueChange={(value) => handleInputChange('cyl', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {cylValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.od.axis}
                      onValueChange={(value) => handleInputChange('axis', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {axisValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">OS (Left)</td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.os.sph}
                      onValueChange={(value) => handleInputChange('sph', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {sphValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.os.cyl}
                      onValueChange={(value) => handleInputChange('cyl', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {cylValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.os.axis}
                      onValueChange={(value) => handleInputChange('axis', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {axisValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Shown on mobile only */}
          <div className="space-y-4 md:hidden">
            {/* OD (Right Eye) Card */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm mb-3">OD (Right Eye)</h4>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">SPH</label>
                  <Select
                    value={prescriptionData.od.sph}
                    onValueChange={(value) => handleInputChange('sph', value, 'od')}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {sphValues.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">CYL</label>
                  <Select
                    value={prescriptionData.od.cyl}
                    onValueChange={(value) => handleInputChange('cyl', value, 'od')}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {cylValues.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">AXIS</label>
                  <Select
                    value={prescriptionData.od.axis}
                    onValueChange={(value) => handleInputChange('axis', value, 'od')}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {axisValues.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* OS (Left Eye) Card */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm mb-3">OS (Left Eye)</h4>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">SPH</label>
                  <Select
                    value={prescriptionData.os.sph}
                    onValueChange={(value) => handleInputChange('sph', value, 'os')}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {sphValues.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">CYL</label>
                  <Select
                    value={prescriptionData.os.cyl}
                    onValueChange={(value) => handleInputChange('cyl', value, 'os')}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {cylValues.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">AXIS</label>
                  <Select
                    value={prescriptionData.os.axis}
                    onValueChange={(value) => handleInputChange('axis', value, 'os')}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {axisValues.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* PD Field - Only show if PDF is NOT uploaded */}
          {!hasPdfUploaded && (
            <div className="space-y-2">
              <label className="text-sm font-medium">PD (Pupillary Distance)</label>
              {prescriptionData.hasTwoPDs ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">OD (Right)</label>
                    <Select
                      value={prescriptionData.pdOd || ""}
                      onValueChange={(value) => handleInputChange('pdOd', value)}
                    >
                      <SelectTrigger className={`h-10 ${!prescriptionData.pdOd || prescriptionData.pdOd === "" ? "text-muted-foreground" : ""}`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {pdValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val} mm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">OS (Left)</label>
                    <Select
                      value={prescriptionData.pdOs || ""}
                      onValueChange={(value) => handleInputChange('pdOs', value)}
                    >
                      <SelectTrigger className={`h-10 ${!prescriptionData.pdOs || prescriptionData.pdOs === "" ? "text-muted-foreground" : ""}`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {pdValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val} mm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <Select
                  value={prescriptionData.pd || ""}
                  onValueChange={(value) => handleInputChange('pd', value)}
                >
                  <SelectTrigger className={`h-10 ${!prescriptionData.pd || prescriptionData.pd === "" ? "text-muted-foreground" : ""}`}>
                    <SelectValue placeholder="Select PD" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {pdValues.map((val) => (
                      <SelectItem key={val} value={val}>
                        {val} mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      )}

      {/* Checkboxes */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="twoPDs"
            checked={prescriptionData.hasTwoPDs}
            onCheckedChange={(checked) => {
              handleCheckboxChange('hasTwoPDs', checked as boolean);
              // If enabling two PDs, split the single PD value if it exists
              if (checked && prescriptionData.pd && prescriptionData.pd !== "") {
                const pdValue = parseFloat(prescriptionData.pd);
                const halfPd = (pdValue / 2).toFixed(2);
                onDataUpdate({
                  pdOd: halfPd,
                  pdOs: halfPd,
                });
              } else if (!checked && prescriptionData.pdOd && prescriptionData.pdOs && prescriptionData.pdOd !== "" && prescriptionData.pdOs !== "") {
                // If disabling two PDs, combine the values
                const combinedPd = (parseFloat(prescriptionData.pdOd) + parseFloat(prescriptionData.pdOs)).toFixed(2);
                onDataUpdate({
                  pd: combinedPd,
                });
              }
            }}
          />
          <label htmlFor="twoPDs" className="text-sm font-medium">
            Have Two PDs?
          </label>
          <button
            type="button"
            onClick={() => setIsPdHelpOpen(true)}
            className="ml-2 text-primary hover:text-primary/80 transition-colors"
            aria-label="How to measure PD"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="prism"
            checked={prescriptionData.hasPrism}
            onCheckedChange={(checked) => {
              handleCheckboxChange('hasPrism', checked as boolean);
              // Initialize prism values when enabling
              if (checked) {
                onDataUpdate({
                  od: {
                    ...prescriptionData.od,
                    prismHorizontal: prescriptionData.od.prismHorizontal || "0.00",
                    prismHorizontalBase: prescriptionData.od.prismHorizontalBase || "",
                    prismVertical: prescriptionData.od.prismVertical || "0.00",
                    prismVerticalBase: prescriptionData.od.prismVerticalBase || "",
                  },
                  os: {
                    ...prescriptionData.os,
                    prismHorizontal: prescriptionData.os.prismHorizontal || "0.00",
                    prismHorizontalBase: prescriptionData.os.prismHorizontalBase || "",
                    prismVertical: prescriptionData.os.prismVertical || "0.00",
                    prismVerticalBase: prescriptionData.os.prismVerticalBase || "",
                  },
                });
              }
            }}
          />
          <label htmlFor="prism" className="text-sm font-medium">
            Have Prism?
          </label>
          <button
            type="button"
            onClick={() => setIsPrismHelpOpen(true)}
            className="ml-2 text-primary hover:text-primary/80 transition-colors"
            aria-label="What is Prism?"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Prism Table - Show when hasPrism is checked */}
      {prescriptionData.hasPrism && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Prism Correction</label>

          {/* Desktop Table View - Hidden on mobile */}
          <div className="border rounded-lg overflow-hidden hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="p-3 text-left text-sm font-medium"></th>
                  <th className="p-3 text-center text-sm font-medium">Prism Horizontal</th>
                  <th className="p-3 text-center text-sm font-medium">Base Direction</th>
                  <th className="p-3 text-center text-sm font-medium">Prism Vertical</th>
                  <th className="p-3 text-center text-sm font-medium">Base Direction</th>
                </tr>
              </thead>
              <tbody>
                {/* OD (Right) Row */}
                <tr className="border-b">
                  <td className="p-3 font-medium">OD (Right)</td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.od.prismHorizontal || "0.00"}
                      onValueChange={(value) => handleInputChange('prismHorizontal', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {prismValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.od.prismHorizontalBase || ""}
                      onValueChange={(value) => handleInputChange('prismHorizontalBase', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {horizontalBaseDirections.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.od.prismVertical || "0.00"}
                      onValueChange={(value) => handleInputChange('prismVertical', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {prismValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.od.prismVerticalBase || ""}
                      onValueChange={(value) => handleInputChange('prismVerticalBase', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {verticalBaseDirections.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
                {/* OS (Left) Row */}
                <tr>
                  <td className="p-3 font-medium">OS (Left)</td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.os.prismHorizontal || "0.00"}
                      onValueChange={(value) => handleInputChange('prismHorizontal', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {prismValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.os.prismHorizontalBase || ""}
                      onValueChange={(value) => handleInputChange('prismHorizontalBase', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {horizontalBaseDirections.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.os.prismVertical || "0.00"}
                      onValueChange={(value) => handleInputChange('prismVertical', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {prismValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={prescriptionData.os.prismVerticalBase || ""}
                      onValueChange={(value) => handleInputChange('prismVerticalBase', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {verticalBaseDirections.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Shown on mobile only */}
          <div className="space-y-4 md:hidden">
            {/* OD (Right Eye) Card */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm mb-3">OD (Right Eye)</h4>

              {/* Horizontal Prism */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Horizontal Prism</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Select
                      value={prescriptionData.od.prismHorizontal || "0.00"}
                      onValueChange={(value) => handleInputChange('prismHorizontal', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {prismValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={prescriptionData.od.prismHorizontalBase || ""}
                      onValueChange={(value) => handleInputChange('prismHorizontalBase', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {horizontalBaseDirections.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Vertical Prism */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Vertical Prism</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Select
                      value={prescriptionData.od.prismVertical || "0.00"}
                      onValueChange={(value) => handleInputChange('prismVertical', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {prismValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={prescriptionData.od.prismVerticalBase || ""}
                      onValueChange={(value) => handleInputChange('prismVerticalBase', value, 'od')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {verticalBaseDirections.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* OS (Left Eye) Card */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm mb-3">OS (Left Eye)</h4>

              {/* Horizontal Prism */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Horizontal Prism</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Select
                      value={prescriptionData.os.prismHorizontal || "0.00"}
                      onValueChange={(value) => handleInputChange('prismHorizontal', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {prismValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={prescriptionData.os.prismHorizontalBase || ""}
                      onValueChange={(value) => handleInputChange('prismHorizontalBase', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {horizontalBaseDirections.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Vertical Prism */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Vertical Prism</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Select
                      value={prescriptionData.os.prismVertical || "0.00"}
                      onValueChange={(value) => handleInputChange('prismVertical', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {prismValues.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={prescriptionData.os.prismVerticalBase || ""}
                      onValueChange={(value) => handleInputChange('prismVerticalBase', value, 'os')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {verticalBaseDirections.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="button"
        onClick={async () => {
          console.log('[Step1PrescriptionForm] Submit button clicked', {
            hasPdfUploaded,
            isPdFilled,
            isPdfMode: prescriptionData.isPdfMode,
            prescriptionPdfUrl: prescriptionData.prescriptionPdfUrl,
            prescriptionImageUrl: prescriptionData.prescriptionImageUrl,
          });
          if (isPdFilled) {
            console.log('[Step1PrescriptionForm] Calling onNext()...');
            try {
              await onNext();
              console.log('[Step1PrescriptionForm] onNext() completed');
            } catch (error) {
              console.error('[Step1PrescriptionForm] Error in onNext():', error);
            }
          } else {
            console.warn('[Step1PrescriptionForm] Submit blocked - isPdFilled is false');
            toast({
              title: "Cannot proceed",
              description: hasPdfUploaded
                ? "Please wait for prescription processing to complete"
                : "Please select your Pupillary Distance (PD) to continue",
              variant: "destructive",
            });
          }
        }}
        disabled={!isPdFilled}
        className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit
      </Button>

      {/* Warning message if PD not filled - only show if PDF is NOT uploaded */}
      {!isPdFilled && !hasPdfUploaded && (
        <p className="text-xs text-destructive text-center -mt-2">
          Please select your Pupillary Distance (PD) to continue
        </p>
      )}

      {/* PD Help Dialog */}
      <Dialog open={isPdHelpOpen} onOpenChange={setIsPdHelpOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How to Measure Your Pupillary Distance (PD)?</DialogTitle>
            <DialogDescription>
              Learn how to accurately measure your pupillary distance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pupillary distance (PD) measures the distance between the centers of your pupils.
                This measurement is used to determine where you look through the lens of your glasses
                and should be as accurate as possible.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Average PD Range:</p>
                <p className="text-sm text-muted-foreground">
                  The average adult's PD is between <strong>54-74 mm</strong>.
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your eye doctor will usually measure your PD during an eye exam. However, if it was
                not given to you, you can measure it yourself using a ruler with millimeter markings.
              </p>
            </div>

            {/* Additional Tips */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <p className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                💡 Pro Tips:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Measure multiple times for accuracy</li>
                <li>Ask a friend or family member to help you measure</li>
                <li>Keep your eyes focused on a distant object while measuring</li>
                <li>Use a ruler with millimeter markings</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prism Help Dialog */}
      <Dialog open={isPrismHelpOpen} onOpenChange={setIsPrismHelpOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PRISM</DialogTitle>
            <DialogDescription>
              Understanding prism correction in prescription lenses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Prism is a measure in prism diopters. We can process prism prescriptions to correct eye orientation.
                The most common application for this is the treatment of strabismus.
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed">
                In eyeglasses, prisms are used primarily for double vision, positional correction, or convergence correction.
                By moving the image in front of the deviated eye, double vision can be avoided and comfortable binocular vision can be achieved.
              </p>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">How Prism Works:</p>
                <p className="text-sm text-muted-foreground">
                  A lens that includes some amount of prism correction will displace the viewed image horizontally,
                  vertically, or a combination of both directions.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                  📋 Common Uses:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Treatment of strabismus (misaligned eyes)</li>
                  <li>Correction of double vision (diplopia)</li>
                  <li>Positional correction</li>
                  <li>Convergence correction</li>
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <p className="text-sm font-medium mb-2 text-amber-900 dark:text-amber-100">
                  ⚠️ Important:
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Prism prescriptions should be provided by your eye care professional.
                  Accurate measurements are crucial for effective treatment.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

