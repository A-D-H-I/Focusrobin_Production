"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload, Scan, ArrowRight, HelpCircle, Sun, Home, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/productData";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionFormProps {
  product: Product;
  productSlug: string;
}

// Generate prescription values for dropdowns
const generatePrescriptionValues = () => {
  const values: string[] = [];
  // SPH values from -20.00 to +20.00 in 0.25 increments
  for (let i = -20; i <= 20; i += 0.25) {
    const val = i.toFixed(2);
    values.push(val.startsWith('-') ? val : `+${val}`);
  }
  return values;
};

const prescriptionValues = generatePrescriptionValues();
const axisValues = Array.from({ length: 180 }, (_, i) => (i + 1).toString());
const pdValues = Array.from({ length: 100 }, (_, i) => ((i + 40) / 2).toFixed(2));

export default function PrescriptionForm({ product, productSlug }: PrescriptionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prescriptionData, setPrescriptionData] = useState({
    od: {
      sph: "-4.25",
      cyl: "+1.25",
      axis: "98",
    },
    os: {
      sph: "-4.00",
      cyl: "+1.25",
      axis: "85",
    },
    pd: "55.50",
    hasTwoPDs: false,
    hasPrism: false,
    savePrescription: false,
    lensType: "none", // "none", "color-tint", "photochromic"
  });

  const handleInputChange = (field: string, value: string, eye?: 'od' | 'os') => {
    if (eye) {
      setPrescriptionData(prev => ({
        ...prev,
        [eye]: {
          ...prev[eye],
          [field]: value,
        },
      }));
    } else {
      setPrescriptionData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleCheckboxChange = (field: 'hasTwoPDs' | 'hasPrism' | 'savePrescription', checked: boolean) => {
    setPrescriptionData(prev => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      toast({
        title: "File uploaded",
        description: "Processing your prescription image...",
      });
      // TODO: Implement file processing/OCR
    }
  };

  const handleScan = () => {
    // Handle prescription scanning logic
    toast({
      title: "Scan prescription",
      description: "Opening camera to scan your prescription...",
    });
    // TODO: Implement camera/scanning functionality
  };

  const handleSubmit = () => {
    // Store prescription data and navigate to confirmation page
    const prescriptionDataString = JSON.stringify(prescriptionData);
    sessionStorage.setItem(`prescription_${productSlug}`, prescriptionDataString);
    
    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('prescription-saved'));
    }
    
    toast({
      title: "Prescription saved",
      description: "Your prescription has been saved successfully.",
    });
    
    router.push(`/shop/${productSlug}/prescription/confirmation`);
  };

  const handleClose = () => {
    router.push(`/shop/${productSlug}`);
  };

  return (
    <div className="bg-card border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline">Enter your prescription</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Upload/Scan Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={handleFileUpload}
          className="h-12 flex items-center justify-center gap-2"
        >
          <Upload className="h-5 w-5" />
          <span>Choose my prescription</span>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
        <Button
          variant="outline"
          onClick={handleScan}
          className="h-12 flex items-center justify-center gap-2"
        >
          <Scan className="h-5 w-5" />
          <span>Scan my prescription</span>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Lens Options */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Lens Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Color Tint Option */}
          <button
            type="button"
            onClick={() => handleInputChange('lensType', prescriptionData.lensType === 'color-tint' ? 'none' : 'color-tint')}
            className={cn(
              "relative p-4 rounded-lg border-2 transition-all text-left",
              prescriptionData.lensType === 'color-tint'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-200 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-1">Color Tint</h4>
                <p className="text-sm text-muted-foreground">
                  Tint or coat your lenses and turn regular lenses into sunglasses
                </p>
              </div>
            </div>
            {prescriptionData.lensType === 'color-tint' && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>

          {/* Standard Photochromic Option */}
          <button
            type="button"
            onClick={() => handleInputChange('lensType', prescriptionData.lensType === 'photochromic' ? 'none' : 'photochromic')}
            className={cn(
              "relative p-4 rounded-lg border-2 transition-all text-left",
              prescriptionData.lensType === 'photochromic'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-300 flex-shrink-0 flex items-center justify-center relative">
                <Sun className="h-5 w-5 text-yellow-500 absolute -left-1 -top-1" />
                <Home className="h-4 w-4 text-blue-600 absolute -right-1 -bottom-1" />
                <div className="w-6 h-4 rounded bg-white/50" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-1">Standard Photochromic</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically adapt to changing light, dark outdoors and clear indoors
                </p>
              </div>
            </div>
            {prescriptionData.lensType === 'photochromic' && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Prescription Table */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">prescription</h3>
        <div className="border rounded-lg overflow-hidden">
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
                      {prescriptionValues.map((val) => (
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
                      {prescriptionValues.map((val) => (
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
                      {prescriptionValues.map((val) => (
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
                      {prescriptionValues.map((val) => (
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

        {/* PD Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium">PD (Pupillary Distance)</label>
          <Select
            value={prescriptionData.pd}
            onValueChange={(value) => handleInputChange('pd', value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {pdValues.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="twoPDs"
            checked={prescriptionData.hasTwoPDs}
            onCheckedChange={(checked) => handleCheckboxChange('hasTwoPDs', checked as boolean)}
          />
          <label
            htmlFor="twoPDs"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Have Two PDs?
          </label>
          <a href="#" className="text-sm text-primary ml-2 hover:underline">
            I don't know my PDs
          </a>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="prism"
            checked={prescriptionData.hasPrism}
            onCheckedChange={(checked) => handleCheckboxChange('hasPrism', checked as boolean)}
          />
          <label
            htmlFor="prism"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Have Prism?
          </label>
          <HelpCircle className="h-4 w-4 text-muted-foreground ml-2" />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="savePrescription"
            checked={prescriptionData.savePrescription}
            onCheckedChange={(checked) => handleCheckboxChange('savePrescription', checked as boolean)}
          />
          <label
            htmlFor="savePrescription"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Save my prescription
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
      >
        SUBMIT
      </Button>
    </div>
  );
}

