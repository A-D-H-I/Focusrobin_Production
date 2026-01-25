"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface Dimensions {
  frameWidth: number;
  lensWidth: number;
  lensHeight: number;
  bridgeWidth: number;
  templeLength: number;
}

interface ProductDimensionsProps {
  dimensions: Partial<Dimensions>;
}

export default function ProductDimensions({ dimensions }: ProductDimensionsProps) {
  const [unit, setUnit] = useState<"mm" | "in">("mm");

  // Convert mm to inches (divide by 25.4)
  const convertToInches = (mm: number): number => {
    return parseFloat((mm / 25.4).toFixed(2));
  };

  // Format value based on unit
  const formatValue = (value: number | undefined): string => {
    if (value === undefined || isNaN(value)) return "N/A";
    const displayValue = unit === "in" ? convertToInches(value) : value;
    return `${displayValue}${unit === "in" ? "in" : "mm"}`;
  };

  // Get display values with fallbacks
  const frameWidth = dimensions.frameWidth;
  const lensWidth = dimensions.lensWidth;
  const lensHeight = dimensions.lensHeight;
  const bridgeWidth = dimensions.bridgeWidth;
  const templeLength = dimensions.templeLength;

  const unitToggle = (
    <div className="flex items-center justify-end mb-4">
      <div className="flex items-center border rounded-md p-1 bg-background">
        <Button
          variant={unit === "mm" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => setUnit("mm")}
        >
          MM
        </Button>
        <Button
          variant={unit === "in" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => setUnit("in")}
        >
          IN
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full rounded-lg border bg-card/50 p-4 sm:p-6">
      {unitToggle}

      <div className="overflow-x-auto">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-center border text-sm sm:text-base">Frame width</TableCell>
              <TableCell className="text-center border text-sm sm:text-base">
                {formatValue(frameWidth)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center border text-sm sm:text-base">Lens width</TableCell>
              <TableCell className="text-center border text-sm sm:text-base">
                {formatValue(lensWidth)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center border text-sm sm:text-base">Bridge</TableCell>
              <TableCell className="text-center border text-sm sm:text-base">
                {formatValue(bridgeWidth)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center border text-sm sm:text-base">Lens height</TableCell>
              <TableCell className="text-center border text-sm sm:text-base">
                {formatValue(lensHeight)}
              </TableCell>
            </TableRow>
            {templeLength !== undefined && (
              <TableRow>
                <TableCell className="font-medium text-center border text-sm sm:text-base">Temple length</TableCell>
                <TableCell className="text-center border text-sm sm:text-base">
                  {formatValue(templeLength)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
