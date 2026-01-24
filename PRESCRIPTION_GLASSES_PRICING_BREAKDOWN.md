# Prescription Glasses Pricing Breakdown
## Internal Company Documentation

**Source:** BOD Lenses Price List 2025  
**Last Updated:** 2026-01-18  
**Currency:** EUR (€)

---

## Overview

This document provides a complete breakdown of prescription glasses pricing, including:
- Lens types and their available index combinations
- Coating options and pricing
- Base costs (per single lens and per pair)
- Additional fees (tinting, edging)
- Profit margin application
- Final retail pricing

---

## 1. Lens Types

| Lens Type | Description | Available Indexes |
|-----------|-------------|-------------------|
| **CLEAR** | Clear (Mono RX) | 1.56, 1.60, 1.67 |
| **TINTED** | Tinted (Mono RX) | 1.56, 1.60, 1.67 |
| **PHOTOCHROMIC_SOLIS** | Photochromic (Solis II) | 1.56, 1.60, 1.67 |
| **POLARIZED_NUPOLAR** | Polarized (NuPolar) | 1.60, 1.67 (No 1.56) |

---

## 2. Coating Types

| Coating Code | Full Name | Description |
|--------------|-----------|-------------|
| **UC** | Uncoated | Basic uncoated lens |
| **BLUE_PRO** | Blue PRO | Blue light protection coating |
| **SERICUM_UV** | UV Protection | UV protection coating |

### Coating Availability by Lens Type

| Lens Type | Allowed Coatings | Notes |
|-----------|------------------|-------|
| **CLEAR** | UC, BLUE_PRO | **SERICUM_UV is NOT available** - Pricing exists in data but option is hidden by business logic |
| **TINTED** | SERICUM_UV, BLUE_PRO | UC coating not available |
| **PHOTOCHROMIC_SOLIS** | SERICUM_UV, BLUE_PRO | UC coating not available |
| **POLARIZED_NUPOLAR** | SERICUM_UV, BLUE_PRO | UC coating not available |

**⚠️ IMPORTANT NOTE FOR CLEAR LENSES:**
- SERICUM_UV pricing exists in the source data (€14.49, €22.98, €31.07 per single lens)
- However, SERICUM_UV is **NOT selectable** for CLEAR lenses in the prescription flow
- This is enforced by the `getAllowedCoatings()` function which filters out SERICUM_UV for CLEAR lens type
- Only UC and BLUE_PRO coatings are available for CLEAR lenses in the UI
- The pricing data includes SERICUM_UV because it comes from the CSV source, but the business logic prevents it from being offered to customers

---

## 3. Base Lens Pricing (Per Single Lens)

### 3.1 CLEAR Lens Pricing

| Index | UC | BLUE_PRO | SERICUM_UV |
|-------|-----|----------|------------|
| **1.56** | €8.49 | €14.49 | €14.49 ⚠️ |
| **1.60** | €16.98 | €22.98 | €22.98 ⚠️ |
| **1.67** | €25.07 | €31.07 | €31.07 ⚠️ |

**⚠️ SERICUM_UV for CLEAR lenses:**
- Pricing exists in source data but **NOT available for selection** in prescription flow
- This coating is filtered out by business logic (`getAllowedCoatings()` function)
- Only UC and BLUE_PRO are selectable for CLEAR lenses
- SERICUM_UV prices shown here are for reference only (from CSV source data)

### 3.2 TINTED Lens Pricing

| Index | UC | BLUE_PRO | SERICUM_UV |
|-------|-----|----------|------------|
| **1.56** | €8.49 | €14.49 | €14.49 |
| **1.60** | €16.98 | €22.98 | €22.98 |
| **1.67** | €25.07 | €31.07 | €31.07 |

*Note: UC coating is disallowed for TINTED lenses in the system, but base price is the same as CLEAR.*

### 3.3 PHOTOCHROMIC_SOLIS Lens Pricing

| Index | UC | BLUE_PRO | SERICUM_UV |
|-------|-----|----------|------------|
| **1.56** | €13.53 | €19.53 | €19.53 |
| **1.60** | €24.66 | €30.66 | €30.66 |
| **1.67** | €32.90 | €38.90 | €38.90 |

### 3.4 POLARIZED_NUPOLAR Lens Pricing

| Index | UC | BLUE_PRO | SERICUM_UV |
|-------|-----|----------|------------|
| **1.60** | €35.98 | €41.98 | €41.98 |
| **1.67** | €58.62 | €64.62 | €64.62 |

*Note: 1.56 index is not available for POLARIZED_NUPOLAR.*

---

## 4. Base Lens Pricing (Per Pair)

*Pair price = Single lens price × 2*

### 4.1 CLEAR Lens Pair Pricing

| Index | UC | BLUE_PRO | SERICUM_UV |
|-------|-----|----------|------------|
| **1.56** | €16.98 | €28.98 | €28.98 ⚠️ |
| **1.60** | €33.96 | €45.96 | €45.96 ⚠️ |
| **1.67** | €50.14 | €62.14 | €62.14 ⚠️ |

**⚠️ SERICUM_UV for CLEAR lenses:**
- Pair pricing exists in data but **NOT available for selection**
- Only UC and BLUE_PRO pair prices are actually used in the system

### 4.2 TINTED Lens Pair Pricing

| Index | UC | BLUE_PRO | SERICUM_UV |
|-------|-----|----------|------------|
| **1.56** | €16.98 | €28.98 | €28.98 |
| **1.60** | €33.96 | €45.96 | €45.96 |
| **1.67** | €50.14 | €62.14 | €62.14 |

### 4.3 PHOTOCHROMIC_SOLIS Lens Pair Pricing

| Index | UC | BLUE_PRO | SERICUM_UV |
|-------|-----|----------|------------|
| **1.56** | €27.06 | €39.06 | €39.06 |
| **1.60** | €49.32 | €61.32 | €61.32 |
| **1.67** | €65.80 | €77.80 | €77.80 |

### 4.4 POLARIZED_NUPOLAR Lens Pair Pricing

| Index | UC | BLUE_PRO | SERICUM_UV |
|-------|-----|----------|------------|
| **1.60** | €71.96 | €83.96 | €83.96 |
| **1.67** | €117.24 | €129.24 | €129.24 |

---

## 5. Additional Fees

### 5.1 Tinting Fees (Per Pair)

| Tint Type | Fee (EUR) | Description |
|-----------|-----------|-------------|
| **NONE** | €0.00 | No tinting |
| **FULL_TINT_CATALOG** | €6.00 | Full tint from catalog (€3 per lens × 2) |
| **GRADIENT** | €8.00 | Gradient tint (€4 per lens × 2) |

*Note: Tinting fees only apply to TINTED lens type.*

### 5.2 Edging/Mounting Fees (Per Order)

| Frame Type | Fee (EUR) | Description |
|------------|-----------|-------------|
| **FULL_FRAME** | €4.60 | Standard full frame mounting |
| **NYLON_FRAME** | €5.90 | Nylon frame mounting |
| **RIMLESS_PRESSING** | €12.00 | Rimless pressing method |
| **RIMLESS_INDIVIDUAL** | €20.00 | Rimless individual mounting |
| **LINDBERG_COMPLEX** | €20.00 | Complex Lindberg frame mounting |

---

## 6. Profit Margin

**Fixed Profit:** €15.00 per lens pair order

*The profit is added to the base cost (lens pair + tint fee + edging fee) to calculate the final retail price. Profit is incorporated into the displayed price and is not shown separately to customers.*

---

## 7. Complete Pricing Breakdown by Combination

### 7.1 CLEAR Lens Combinations

#### CLEAR - Index 1.56

| Coating | Base Cost (Pair) | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|------------|-----------------|--------|------------------------|
| UC | €16.98 | €4.60 | €21.58 | €15.00 | **€36.58** |
| BLUE_PRO | €28.98 | €4.60 | €33.58 | €15.00 | **€48.58** |

**⚠️ SERICUM_UV NOT AVAILABLE:** 
- SERICUM_UV pricing exists (€28.98 pair base cost) but is **NOT selectable** for CLEAR lenses
- The `getAllowedCoatings("CLEAR")` function returns only `["UC", "BLUE_PRO"]`
- SERICUM_UV is filtered out in Step4Coating component before display
- This is a business rule, not a pricing limitation

#### CLEAR - Index 1.60

| Coating | Base Cost (Pair) | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|------------|-----------------|--------|------------------------|
| UC | €33.96 | €4.60 | €38.56 | €15.00 | **€53.56** |
| BLUE_PRO | €45.96 | €4.60 | €50.56 | €15.00 | **€65.56** |

#### CLEAR - Index 1.67

| Coating | Base Cost (Pair) | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|------------|-----------------|--------|------------------------|
| UC | €50.14 | €4.60 | €54.74 | €15.00 | **€69.74** |
| BLUE_PRO | €62.14 | €4.60 | €66.74 | €15.00 | **€81.74** |

---

### 7.2 TINTED Lens Combinations

#### TINTED - Index 1.56

| Coating | Base Cost (Pair) | Tint Fee | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|----------|------------|-----------------|--------|------------------------|
| SERICUM_UV | €28.98 | €6.00 | €4.60 | €39.58 | €15.00 | **€54.58** |
| BLUE_PRO | €28.98 | €6.00 | €4.60 | €39.58 | €15.00 | **€54.58** |
| SERICUM_UV (Gradient) | €28.98 | €8.00 | €4.60 | €41.58 | €15.00 | **€56.58** |
| BLUE_PRO (Gradient) | €28.98 | €8.00 | €4.60 | €41.58 | €15.00 | **€56.58** |

#### TINTED - Index 1.60

| Coating | Base Cost (Pair) | Tint Fee | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|----------|------------|-----------------|--------|------------------------|
| SERICUM_UV | €45.96 | €6.00 | €4.60 | €56.56 | €15.00 | **€71.56** |
| BLUE_PRO | €45.96 | €6.00 | €4.60 | €56.56 | €15.00 | **€71.56** |
| SERICUM_UV (Gradient) | €45.96 | €8.00 | €4.60 | €58.56 | €15.00 | **€73.56** |
| BLUE_PRO (Gradient) | €45.96 | €8.00 | €4.60 | €58.56 | €15.00 | **€73.56** |

#### TINTED - Index 1.67

| Coating | Base Cost (Pair) | Tint Fee | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|----------|------------|-----------------|--------|------------------------|
| SERICUM_UV | €62.14 | €6.00 | €4.60 | €72.74 | €15.00 | **€87.74** |
| BLUE_PRO | €62.14 | €6.00 | €4.60 | €72.74 | €15.00 | **€87.74** |
| SERICUM_UV (Gradient) | €62.14 | €8.00 | €4.60 | €74.74 | €15.00 | **€89.74** |
| BLUE_PRO (Gradient) | €62.14 | €8.00 | €4.60 | €74.74 | €15.00 | **€89.74** |

---

### 7.3 PHOTOCHROMIC_SOLIS Lens Combinations

#### PHOTOCHROMIC_SOLIS - Index 1.56

| Coating | Base Cost (Pair) | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|------------|-----------------|--------|------------------------|
| SERICUM_UV | €39.06 | €4.60 | €43.66 | €15.00 | **€58.66** |
| BLUE_PRO | €39.06 | €4.60 | €43.66 | €15.00 | **€58.66** |

#### PHOTOCHROMIC_SOLIS - Index 1.60

| Coating | Base Cost (Pair) | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|------------|-----------------|--------|------------------------|
| SERICUM_UV | €61.32 | €4.60 | €65.92 | €15.00 | **€80.92** |
| BLUE_PRO | €61.32 | €4.60 | €65.92 | €15.00 | **€80.92** |

#### PHOTOCHROMIC_SOLIS - Index 1.67

| Coating | Base Cost (Pair) | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|------------|-----------------|--------|------------------------|
| SERICUM_UV | €77.80 | €4.60 | €82.40 | €15.00 | **€97.40** |
| BLUE_PRO | €77.80 | €4.60 | €82.40 | €15.00 | **€97.40** |

---

### 7.4 POLARIZED_NUPOLAR Lens Combinations

#### POLARIZED_NUPOLAR - Index 1.60

| Coating | Base Cost (Pair) | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|------------|-----------------|--------|------------------------|
| SERICUM_UV | €83.96 | €4.60 | €88.56 | €15.00 | **€103.56** |
| BLUE_PRO | €83.96 | €4.60 | €88.56 | €15.00 | **€103.56** |

#### POLARIZED_NUPOLAR - Index 1.67

| Coating | Base Cost (Pair) | Edging Fee | Total Base Cost | Profit | **Final Retail Price** |
|---------|------------------|------------|-----------------|--------|------------------------|
| SERICUM_UV | €129.24 | €4.60 | €133.84 | €15.00 | **€148.84** |
| BLUE_PRO | €129.24 | €4.60 | €133.84 | €15.00 | **€148.84** |

---

## 8. Pricing Formula

### Base Cost Calculation

```
Base Cost = (Lens Price Per Single × 2) + Tint Fee (if applicable) + Edging Fee
```

### Final Retail Price Calculation

```
Final Retail Price = Base Cost + Fixed Profit (€15.00)
```

### Example Calculation

**Example:** TINTED lens, Index 1.60, BLUE_PRO coating, FULL_TINT_CATALOG, FULL_FRAME

1. Base lens pair cost: €45.96 (€22.98 × 2)
2. Tint fee: €6.00
3. Edging fee: €4.60
4. **Total base cost:** €45.96 + €6.00 + €4.60 = €56.56
5. **Profit:** €15.00
6. **Final retail price:** €56.56 + €15.00 = **€71.56**

---

## 9. Price Range Summary

### Minimum Prices (Cheapest Combination)

| Lens Type | Index | Coating | Tint | Edging | Base Cost | Final Price |
|-----------|-------|---------|------|--------|-----------|-------------|
| CLEAR | 1.56 | UC | N/A | FULL_FRAME | €21.58 | **€36.58** |
| TINTED | 1.56 | SERICUM_UV | FULL_TINT | FULL_FRAME | €39.58 | **€54.58** |
| PHOTOCHROMIC_SOLIS | 1.56 | SERICUM_UV | N/A | FULL_FRAME | €43.66 | **€58.66** |
| POLARIZED_NUPOLAR | 1.60 | SERICUM_UV | N/A | FULL_FRAME | €88.56 | **€103.56** |

### Maximum Prices (Most Expensive Combination)

| Lens Type | Index | Coating | Tint | Edging | Base Cost | Final Price |
|-----------|-------|---------|------|--------|-----------|-------------|
| CLEAR | 1.67 | BLUE_PRO | N/A | LINDBERG_COMPLEX | €82.14 | **€97.14** |
| TINTED | 1.67 | BLUE_PRO | GRADIENT | LINDBERG_COMPLEX | €90.74 | **€105.74** |
| PHOTOCHROMIC_SOLIS | 1.67 | BLUE_PRO | N/A | LINDBERG_COMPLEX | €97.80 | **€112.80** |
| POLARIZED_NUPOLAR | 1.67 | BLUE_PRO | N/A | LINDBERG_COMPLEX | €149.24 | **€164.24** |

---

## 10. Important Notes

1. **All prices are in EUR (€)**
2. **Lens prices are per single lens** - multiply by 2 for pair pricing
3. **Tint fees are per pair** (not per lens)
4. **Edging fees are per order** (regardless of lens type)
5. **Fixed profit of €15.00** is added to every lens pair order
6. **Profit is incorporated into the final price** and not shown separately to customers
7. **UC coating is not available** for TINTED, PHOTOCHROMIC_SOLIS, and POLARIZED_NUPOLAR lenses
8. **SERICUM_UV coating for CLEAR lenses:**
   - ⚠️ **Pricing exists in source data** (€14.49, €22.98, €31.07 per single lens)
   - ⚠️ **NOT selectable in prescription flow** - filtered out by `getAllowedCoatings()` function
   - ⚠️ **Business rule:** Only UC and BLUE_PRO are offered for CLEAR lenses
   - ⚠️ **Code location:** `src/lib/lensPricing.ts` line 108: `return ["UC", "BLUE_PRO"];`
   - ⚠️ **Why pricing exists:** Source CSV includes all combinations, but UI filters them
9. **POLARIZED_NUPOLAR** does not support 1.56 index
10. **All prices are rounded to 2 decimal places**

---

## 11. Data Source

- **Source File:** `data/pricing/bod-lenses-price-list-2025.csv`
- **Generated From:** BOD Lenses Price List 2025 Excel file
- **Code Location:** `src/lib/data/lensPricingData.ts`
- **Pricing Logic:** `src/lib/lensPricing.ts`
- **Last CSV Update:** 2026-01-07
- **Last Code Generation:** 2026-01-18

### Business Logic vs. Pricing Data

**Important Distinction:**
- **Pricing Data (CSV):** Contains ALL possible combinations including SERICUM_UV for CLEAR lenses
- **Business Logic (Code):** Filters available options based on business rules
- **For CLEAR lenses:** `getAllowedCoatings("CLEAR")` returns `["UC", "BLUE_PRO"]` only
- **Code Reference:** `src/lib/lensPricing.ts` lines 105-116
- **UI Filtering:** `src/app/shop/[slug]/prescription/steps/Step4Coating.tsx` line 57 filters options

**Why SERICUM_UV appears in pricing tables but not in UI:**
1. Source CSV includes SERICUM_UV pricing for CLEAR lenses
2. Business logic intentionally hides it from customer selection
3. This is a deliberate business decision, not a data error
4. The pricing exists for internal reference but is not offered to customers

---

## 12. Update Instructions

To update pricing:

1. Update the CSV file: `data/pricing/bod-lenses-price-list-2025.csv`
2. Run the generation script: `npm run generate-pricing`
3. This will automatically update `src/lib/data/lensPricingData.ts`
4. Update this documentation file with new prices

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-18  
**Maintained By:** Development Team

