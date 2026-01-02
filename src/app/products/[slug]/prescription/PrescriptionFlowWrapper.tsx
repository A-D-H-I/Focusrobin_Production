"use client";

import { Suspense } from "react";
import PrescriptionFlow from "./PrescriptionFlow";
import type { Product } from "@/lib/productData";

interface PrescriptionFlowWrapperProps {
  product: Product;
  productSlug: string;
}

export default function PrescriptionFlowWrapper({ product, productSlug }: PrescriptionFlowWrapperProps) {
  return (
    <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
      <PrescriptionFlow product={product} productSlug={productSlug} />
    </Suspense>
  );
}

