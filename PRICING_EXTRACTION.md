# EXACT PRICING CONSTANTS AND CALCULATION LOGIC
## Extracted from Codebase - Cross-Verification Document

---

## A) PRICING TABLES (HARDCODED)

### File: `src/lib/lensPricing.ts` (Lines 38-61)

**LENS PRICE TABLE (PER SINGLE LENS - from Excel "BOD Lenses. Price list 2025.xlsx")**

```typescript
const LENS_PRICE_SINGLE: Record<LensType, Partial<Record<LensIndex, Record<Coating, number>>>> = {
  CLEAR: {
    "1.56": { UC: 8.49, BLUE_PRO: 14.49, SERICUM_UV: 14.49 },
    "1.60": { UC: 16.98, BLUE_PRO: 22.98, SERICUM_UV: 22.98 },
    "1.67": { UC: 25.07, BLUE_PRO: 31.07, SERICUM_UV: 31.07 },
  },
  TINTED: {
    // Same base prices as CLEAR, but UC will be disallowed by rules
    "1.56": { UC: 8.49, BLUE_PRO: 14.49, SERICUM_UV: 14.49 },
    "1.60": { UC: 16.98, BLUE_PRO: 22.98, SERICUM_UV: 22.98 },
    "1.67": { UC: 25.07, BLUE_PRO: 31.07, SERICUM_UV: 31.07 },
  },
  PHOTOCHROMIC_SOLIS: {
    "1.56": { UC: 13.53, BLUE_PRO: 19.53, SERICUM_UV: 19.53 },
    "1.60": { UC: 24.66, BLUE_PRO: 30.66, SERICUM_UV: 30.66 },
    "1.67": { UC: 32.90, BLUE_PRO: 38.90, SERICUM_UV: 38.90 },
  },
  POLARIZED_NUPOLAR: {
    // No 1.56 available
    "1.60": { UC: 35.98, BLUE_PRO: 41.98, SERICUM_UV: 41.98 },
    "1.67": { UC: 58.62, BLUE_PRO: 64.62, SERICUM_UV: 64.62 },
  },
};
```

**IMPORTANT:** These values are PER SINGLE LENS. Pair prices = single price × 2.

---

## B) TINT FEE TABLE

### File: `src/lib/lensPricing.ts` (Lines 63-67)

**TINT ADD-ON FEES (PER PAIR)**

```typescript
const TINT_FEES_PAIR: Record<TintType, number> = {
  FULL_TINT_CATALOG: 6.00,  // €6.00 per pair
  GRADIENT: 12.00,          // €12.00 per pair
};
```

**IMPORTANT:** These values are PER PAIR (not per lens).

---

## C) ALLOWED OPTIONS RULES

### File: `src/lib/lensPricing.ts`

### 1. Supported Indexes Per Lens Type (Lines 108-119)

```typescript
export function getSupportedIndexes(lensType: LensType): LensIndex[] {
  switch (lensType) {
    case "CLEAR":
    case "TINTED":
    case "PHOTOCHROMIC_SOLIS":
      return ["1.56", "1.60", "1.67"];
    case "POLARIZED_NUPOLAR":
      return ["1.60", "1.67"]; // No 1.56
    default:
      return ["1.67"];
  }
}
```

**Rules:**
- CLEAR: Supports 1.56, 1.60, 1.67
- TINTED: Supports 1.56, 1.60, 1.67
- PHOTOCHROMIC_SOLIS: Supports 1.56, 1.60, 1.67
- POLARIZED_NUPOLAR: Supports 1.60, 1.67 only (NO 1.56)

### 2. Allowed Coatings Per Lens Type (Lines 124-135)

```typescript
export function getAllowedCoatings(lensType: LensType): Coating[] {
  switch (lensType) {
    case "CLEAR":
      return ["UC", "BLUE_PRO"]; // IMPORTANT: hide SERICUM_UV for CLEAR
    case "TINTED":
    case "PHOTOCHROMIC_SOLIS":
    case "POLARIZED_NUPOLAR":
      return ["SERICUM_UV", "BLUE_PRO"];
    default:
      return ["SERICUM_UV", "BLUE_PRO"];
  }
}
```

**Rules:**
- CLEAR: UC, BLUE_PRO only (SERICUM_UV is HIDDEN/DISALLOWED)
- TINTED: SERICUM_UV, BLUE_PRO only (UC is DISALLOWED)
- PHOTOCHROMIC_SOLIS: SERICUM_UV, BLUE_PRO only (UC is DISALLOWED)
- POLARIZED_NUPOLAR: SERICUM_UV, BLUE_PRO only (UC is DISALLOWED)

### 3. Auto-Correction/Normalization Rules (Lines 244-301)

```typescript
export function normalizeSelection(selection: LensSelection): LensSelection {
  const normalized: LensSelection = { ...selection };

  // 1. Validate and auto-correct lens index
  const supportedIndexes = getSupportedIndexes(normalized.lensType);
  if (!supportedIndexes.includes(normalized.lensIndex)) {
    normalized.lensIndex = supportedIndexes[0]; // Set to first supported index
  }

  // 2. Validate and auto-correct coating
  const allowedCoatings = getAllowedCoatings(normalized.lensType);
  if (!allowedCoatings.includes(normalized.coating)) {
    normalized.coating = allowedCoatings[0]; // Set to first allowed coating
  }

  // 3. Clear tint fields if not TINTED
  if (normalized.lensType !== "TINTED") {
    normalized.tintType = undefined;
    normalized.tintColor = undefined;
    normalized.tintShade = undefined;
    normalized.tintRecipe = undefined;
  } else {
    // 4. For TINTED: ensure tintType exists
    if (!normalized.tintType) {
      normalized.tintType = "FULL_TINT_CATALOG";
    }

    // 5. For TINTED: ensure tintColor exists
    if (!normalized.tintColor) {
      normalized.tintColor = "Grey";
    }

    // 6. For FULL_TINT_CATALOG: ensure shade exists and is valid
    if (normalized.tintType === "FULL_TINT_CATALOG" && normalized.tintColor) {
      const allowedShades = FULL_TINT_SHADES[normalized.tintColor];
      if (!normalized.tintShade || !allowedShades.includes(normalized.tintShade)) {
        normalized.tintShade = DEFAULT_FULL_TINT_SHADE[normalized.tintColor];
      }
      normalized.tintRecipe = undefined;
    }

    // 7. For GRADIENT: auto-assign recipe from color
    if (normalized.tintType === "GRADIENT" && normalized.tintColor) {
      normalized.tintRecipe = GRADIENT_RECIPES[normalized.tintColor];
      normalized.tintShade = undefined;
    }
  }

  // 8. Clear color fields if not applicable
  if (normalized.lensType !== "PHOTOCHROMIC_SOLIS") {
    normalized.photochromicColor = undefined;
  }
  if (normalized.lensType !== "POLARIZED_NUPOLAR") {
    normalized.polarizedColor = undefined;
  }

  return normalized;
}
```

**Auto-Correction Rules:**
1. Invalid index → Set to first supported index
2. Invalid coating → Set to first allowed coating
3. Non-TINTED lens → Clear all tint fields
4. TINTED without tintType → Default to "FULL_TINT_CATALOG"
5. TINTED without tintColor → Default to "Grey"
6. FULL_TINT_CATALOG without valid shade → Set to default shade per color
7. GRADIENT → Auto-assign recipe from color
8. Clear photochromicColor if not PHOTOCHROMIC_SOLIS
9. Clear polarizedColor if not POLARIZED_NUPOLAR

---

## D) EXACT FORMULAS

### 1. "From €..." Calculation in Step 1

**File:** `src/app/products/[slug]/prescription/steps/Step3LensCategory.tsx` (Line 193)
```typescript
const fromPrice = getFromPricePair(option.value, currentLensIndex);
```

**File:** `src/lib/lensPricing.ts` (Lines 212-221)
```typescript
export function getFromPricePair(lensType: LensType, index: LensIndex): number {
  const fromBase = getCheapestAllowedBasePairPrice(lensType, index);
  
  // If TINTED, add minimum tint fee (FULL_TINT_CATALOG = 6)
  if (lensType === "TINTED") {
    return round2(fromBase + TINT_FEES_PAIR.FULL_TINT_CATALOG);
  }
  
  return round2(fromBase);
}
```

**Formula:**
- Step 1: Get cheapest allowed base pair price for lens type + index
- Step 2: If TINTED, add €6.00 (FULL_TINT_CATALOG fee)
- Step 3: Round to 2 decimal places

**Helper Function:** `getCheapestAllowedBasePairPrice` (Lines 159-173)
```typescript
export function getCheapestAllowedBasePairPrice(
  lensType: LensType,
  index: LensIndex
): number {
  const allowedCoatings = getAllowedCoatings(lensType);
  const prices = allowedCoatings
    .map((coating) => getBasePairPrice(lensType, index, coating))
    .filter((price) => price > 0);
  
  if (prices.length === 0) {
    return 0;
  }
  
  return round2(Math.min(...prices));
}
```

**Helper Function:** `getBasePairPrice` (Lines 144-154)
```typescript
export function getBasePairPrice(
  lensType: LensType,
  index: LensIndex,
  coating: Coating
): number {
  const singlePrice = LENS_PRICE_SINGLE[lensType]?.[index]?.[coating];
  if (singlePrice === undefined || singlePrice === 0) {
    return 0;
  }
  return round2(2 * singlePrice);
}
```

### 2. Coating Label Calculation ("Included" vs "+€X")

**File:** `src/app/products/[slug]/prescription/steps/Step4Coating.tsx` (Lines 58-62, 108-115)
```typescript
// Calculate price delta (difference from cheapest allowed coating)
const getPriceDelta = (coating: Coating): number => {
  if (!rxConfig.lensType || !rxConfig.lensIndex) return 0;
  return getCoatingDeltaPair(rxConfig.lensType, rxConfig.lensIndex, coating);
};

// In render:
{delta === 0 ? (
  <p className="text-sm font-medium text-muted-foreground">
    Included
  </p>
) : (
  <p className="text-sm font-medium text-primary">
    +{formatPrice(delta)} per pair
  </p>
)}
```

**File:** `src/lib/lensPricing.ts` (Lines 178-186)
```typescript
export function getCoatingDeltaPair(
  lensType: LensType,
  index: LensIndex,
  coating: Coating
): number {
  const basePrice = getBasePairPrice(lensType, index, coating);
  const cheapestPrice = getCheapestAllowedBasePairPrice(lensType, index);
  return round2(basePrice - cheapestPrice);
}
```

**Formula:**
- Delta = Base pair price for this coating - Cheapest allowed base pair price
- If delta === 0 → Show "Included"
- If delta > 0 → Show "+€{delta} per pair"

### 3. Final Total Calculation

**File:** `src/lib/lensPricing.ts` (Lines 191-207)
```typescript
export function calculateLensPairTotal(selection: LensSelection): number {
  const normalized = normalizeSelection(selection);
  
  const basePair = getBasePairPrice(
    normalized.lensType,
    normalized.lensIndex,
    normalized.coating
  );
  
  // Tint fee (only for TINTED)
  let tintFeePair = 0;
  if (normalized.lensType === "TINTED" && normalized.tintType) {
    tintFeePair = TINT_FEES_PAIR[normalized.tintType];
  }
  
  return round2(basePair + tintFeePair);
}
```

**Formula:**
- Step 1: Normalize selection (auto-correct invalid values)
- Step 2: Get base pair price = single lens price × 2
- Step 3: If TINTED, add tint fee (FULL_TINT_CATALOG = €6.00 or GRADIENT = €12.00)
- Step 4: Return basePair + tintFeePair (rounded to 2 decimals)

**Note:** Edging fees and profit are calculated separately in `PrescriptionFlow.tsx` (Lines 226-231):
```typescript
const edgingFee = result.breakdown.edgingFee;
const rxAddOnNet = lensPairPrice + edgingFee;
const rxRetailNet = rxAddOnNet + FIXED_PROFIT; // FIXED_PROFIT = 15.00
const rxRetailGross = rxRetailNet * 1.21; // VAT
```

---

## E) SAMPLE COMPUTED OUTPUTS

### 1. CLEAR 1.67 UC total pair price
- Single lens price: €25.07
- Base pair price: €25.07 × 2 = €50.14
- Tint fee: €0.00 (not TINTED)
- **Total: €50.14**

### 2. CLEAR 1.67 Blue PRO total pair price
- Single lens price: €31.07
- Base pair price: €31.07 × 2 = €62.14
- Tint fee: €0.00 (not TINTED)
- **Total: €62.14**

### 3. TINTED 1.67 UV + Full Tint total pair price
- Single lens price: €31.07 (SERICUM_UV)
- Base pair price: €31.07 × 2 = €62.14
- Tint fee: €6.00 (FULL_TINT_CATALOG)
- **Total: €68.14**

### 4. TINTED 1.67 UV + Gradient total pair price
- Single lens price: €31.07 (SERICUM_UV)
- Base pair price: €31.07 × 2 = €62.14
- Tint fee: €12.00 (GRADIENT)
- **Total: €74.14**

### 5. PHOTOCHROMIC 1.67 UV total pair price
- Single lens price: €38.90 (SERICUM_UV)
- Base pair price: €38.90 × 2 = €77.80
- Tint fee: €0.00 (not TINTED)
- **Total: €77.80**

### 6. POLARIZED 1.67 UV total pair price
- Single lens price: €64.62 (SERICUM_UV)
- Base pair price: €64.62 × 2 = €129.24
- Tint fee: €0.00 (not TINTED)
- **Total: €129.24**

---

## FILES INVOLVED IN PRICING

1. **`src/lib/lensPricing.ts`** - Main pricing module (single source of truth)
   - Pricing constants (per single lens)
   - Tint fees (per pair)
   - All calculation functions
   - Normalization/validation logic

2. **`src/lib/pricing/rx167.ts`** - Legacy pricing module (still used for edging fees and profit)
   - Edging fees
   - Fixed profit (€15.00)
   - VAT calculation

3. **`src/app/products/[slug]/prescription/PrescriptionFlow.tsx`** - Main flow component
   - Uses `calculateLensPairTotal()` for lens pricing
   - Uses `calculateRxTotal()` from rx167.ts for edging/profit
   - Combines both for final total

4. **`src/app/products/[slug]/prescription/steps/Step3LensCategory.tsx`** - Step 1 UI
   - Uses `getFromPricePair()` to display "From €..." labels

5. **`src/app/products/[slug]/prescription/steps/Step4Coating.tsx`** - Step 2 UI
   - Uses `getCoatingDeltaPair()` to display "Included" or "+€X" labels

---

## NOTES

- All single lens prices are from Excel "BOD Lenses. Price list 2025.xlsx"
- Pair prices = single price × 2
- Tint fees are per pair (not per lens)
- Edging fees and profit are calculated separately (not in lensPricing.ts)
- VAT is applied at 21% (1.21 multiplier) in PrescriptionFlow.tsx

