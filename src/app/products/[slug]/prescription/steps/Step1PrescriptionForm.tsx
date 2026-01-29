"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Scan, ArrowRight, HelpCircle, FileText, X, Loader2, Check } from "lucide-react";
import type { PrescriptionData } from "../PrescriptionFlow";

interface Step1PrescriptionFormProps {
  prescriptionData: PrescriptionData;
  onDataUpdate: (data: Partial<PrescriptionData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Generate prescription values for dropdowns
const generatePrescriptionValues = () => {
  const values: string[] = [];
  for (let i = -20; i <= 20; i += 0.25) {
    const val = i.toFixed(2);
    values.push(val.startsWith('-') ? val : `+${val}`);
  }
  return values;
};

const prescriptionValues = generatePrescriptionValues();
const axisValues = Array.from({ length: 180 }, (_, i) => (i + 1).toString());
const pdValues = Array.from({ length: 100 }, (_, i) => ((i + 40) / 2).toFixed(2));

// Default values to check if user has entered manual values
const DEFAULT_VALUES = {
  od: { sph: "0.00", cyl: "0.00", axis: "0" },
  os: { sph: "0.00", cyl: "0.00", axis: "0" },
  pd: "62",
};

export default function Step1PrescriptionForm({ prescriptionData, onDataUpdate, onNext, onBack }: Step1PrescriptionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Check if user has entered any manual values (different from defaults)
  const hasManualValues =
    prescriptionData.od.sph !== DEFAULT_VALUES.od.sph ||
    prescriptionData.od.cyl !== DEFAULT_VALUES.od.cyl ||
    prescriptionData.od.axis !== DEFAULT_VALUES.od.axis ||
    prescriptionData.os.sph !== DEFAULT_VALUES.os.sph ||
    prescriptionData.os.cyl !== DEFAULT_VALUES.os.cyl ||
    prescriptionData.os.axis !== DEFAULT_VALUES.os.axis ||
    prescriptionData.pd !== DEFAULT_VALUES.pd;

  // Check if PDF is uploaded
  const hasPdfUploaded = prescriptionData.isPdfMode && !!prescriptionData.prescriptionPdfUrl;

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

  const handleCheckboxChange = (field: 'hasTwoPDs' | 'hasPrism' | 'savePrescription', checked: boolean) => {
    onDataUpdate({ [field]: checked });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/prescription', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload prescription');
      }

      // Upload successful - update prescription data to PDF mode
      onDataUpdate({
        isPdfMode: true,
        prescriptionPdfUrl: result.url,
        // Reset manual values to defaults when PDF is uploaded
        od: DEFAULT_VALUES.od,
        os: DEFAULT_VALUES.os,
        pd: DEFAULT_VALUES.pd,
      });
    } catch (error: any) {
      console.error('Error uploading prescription:', error);
      setUploadError(error.message || 'Failed to upload prescription');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePdf = () => {
    onDataUpdate({
      isPdfMode: false,
      prescriptionPdfUrl: undefined,
    });
  };

  // Extract filename from URL for display
  const getPdfFilename = () => {
    if (!prescriptionData.prescriptionPdfUrl) return 'Prescription';
    const url = prescriptionData.prescriptionPdfUrl;
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    // Remove any query params
    return filename.split('?')[0] || 'Prescription';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-headline">Enter your prescription</h2>
      </div>

      {/* PDF Upload Section */}
      {hasPdfUploaded ? (
        // Show uploaded PDF info
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Prescription PDF Uploaded</p>
                <p className="text-sm text-green-600 dark:text-green-400">{getPdfFilename()}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemovePdf}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-3">
            Your prescription PDF will be sent to our lens manufacturer. You can remove it to enter values manually instead.
          </p>
        </div>
      ) : (
        // Show upload/scan buttons
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={hasManualValues || isUploading}
              className={`h-12 flex items-center justify-center gap-2 ${hasManualValues ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload prescription'}</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button
              variant="outline"
              disabled={hasManualValues}
              className={`h-12 flex items-center justify-center gap-2 ${hasManualValues ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Scan className="h-5 w-5" />
              <span>Scan my prescription</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
          {hasManualValues && (
            <p className="text-sm text-muted-foreground text-center">
              Clear manual values below to enable PDF upload
            </p>
          )}
          {uploadError && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {uploadError}
            </p>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Manual Entry Section - Hidden when PDF is uploaded */}
      {!hasPdfUploaded && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or enter values manually</span>
            <div className="flex-1 h-px bg-border" />
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

            {/* PD Field - Only show if PDF is NOT uploaded */}
            {!(prescriptionData.isPdfMode && prescriptionData.prescriptionPdfUrl) && (
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
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="twoPDs"
                checked={prescriptionData.hasTwoPDs}
                onCheckedChange={(checked) => handleCheckboxChange('hasTwoPDs', checked as boolean)}
              />
              <label htmlFor="twoPDs" className="text-sm font-medium">
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
              <label htmlFor="prism" className="text-sm font-medium">
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
              <label htmlFor="savePrescription" className="text-sm font-medium">
                Save my prescription
              </label>
            </div>
          </div>
        </>
      )}

      {/* Submit Button */}
      <Button
        onClick={onNext}
        disabled={isUploading}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        {hasPdfUploaded ? 'Continue with PDF' : 'Submit'}
      </Button>
    </div>
  );
}
