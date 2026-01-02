"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Scan, ArrowRight, HelpCircle } from "lucide-react";
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

export default function Step1PrescriptionForm({ prescriptionData, onDataUpdate, onNext, onBack }: Step1PrescriptionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-headline">Enter your prescription</h2>
      </div>

      {/* Upload/Scan Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="h-12 flex items-center justify-center gap-2"
        >
          <Upload className="h-5 w-5" />
          <span>Choose my prescription</span>
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
        <Button
          variant="outline"
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
      />

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

      {/* Submit Button */}
      <Button
        onClick={onNext}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        Submit
      </Button>
    </div>
  );
}

