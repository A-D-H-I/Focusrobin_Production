# Delivery Days Breakdown
## Internal Company Documentation

**Last Updated:** 2026-01-18  
**Code Location:** `src/lib/delivery-time.ts`

---

## Overview

This document provides a complete breakdown of delivery timeframes for all order types, shipping locations, and delivery providers. Delivery times are calculated automatically based on order contents and shipping destination.

---

## 1. Delivery Time Matrix

### 1.1 Prescription Glasses

| Shipping Location | Delivery Time | Shipping Provider |
|-------------------|---------------|-------------------|
| **Lithuania** | **4-7 days** | Omniva |
| **All Other Countries** | **9-14 days** | DHL |

### 1.2 Sunglasses (Non-Prescription)

| Shipping Location | Delivery Time | Shipping Provider |
|-------------------|---------------|-------------------|
| **Lithuania** | **2-4 days** | Omniva |
| **All Other Countries** | **4-7 days** | DHL |

---

## 2. Product Type Detection

### How Prescription Glasses Are Identified

An order is classified as containing prescription glasses if **ANY** of the following conditions are met:

1. **Item has prescription data:** `item.prescriptionData` exists
2. **Product slug contains "prescription-glasses":** `item.productSlug.includes("prescription-glasses")`

### Code Logic

```typescript
const hasPrescriptionGlasses = items.some(
  (item) =>
    item.prescriptionData ||
    (item.productSlug && item.productSlug.includes("prescription-glasses"))
);
```

**Important Notes:**
- If an order contains **both** prescription glasses and sunglasses, it is treated as a prescription glasses order (longer delivery time)
- Mixed orders always use the longest delivery timeframe
- The system checks all items in the order to determine the type

---

## 3. Shipping Location Detection

### Lithuania Detection

Lithuania is identified by checking if the shipping country matches:
- Country name: `"Lithuania"` (case-insensitive)
- Country code: `"LT"` (case-insensitive)

### Code Logic

```typescript
const isInsideLithuania =
  shippingCountry.toLowerCase() === "lithuania" ||
  shippingCountry.toLowerCase() === "lt";
```

**All other countries** are treated as international shipments.

---

## 4. Shipping Provider Assignment

### Provider Selection Logic

| Countries | Shipping Provider | Notes |
|-----------|------------------|-------|
| **Latvia, Lithuania, Estonia** | **Omniva** | Baltic countries |
| **All Other Countries** | **DHL** | Default for international |

### Code Location

**File:** `src/lib/shipping-provider.ts`

```typescript
const omnivaCountries = ['latvia', 'lithuania', 'estonia'];

if (omnivaCountries.includes(normalizedCountry)) {
  return 'Omniva';
}

return 'DHL'; // Default
```

**Important:**
- Provider selection is **automatic** based on shipping country
- Customers cannot manually select shipping provider
- Provider is set during checkout and stored with the order

---

## 5. Complete Delivery Time Breakdown

### 5.1 Prescription Glasses Orders

#### Lithuania (Omniva)

| Order Contents | Processing Time | Shipping Time | **Total Delivery** |
|----------------|----------------|---------------|-------------------|
| Prescription Glasses | 2-3 days | 2-4 days | **4-7 days** |

**Breakdown:**
- Lens manufacturing: 1-2 days
- Quality control & edging: 1 day
- Omniva shipping: 2-4 days

#### International (DHL)

| Order Contents | Processing Time | Shipping Time | **Total Delivery** |
|----------------|----------------|---------------|-------------------|
| Prescription Glasses | 2-3 days | 7-11 days | **9-14 days** |

**Breakdown:**
- Lens manufacturing: 1-2 days
- Quality control & edging: 1 day
- DHL international shipping: 7-11 days
- Customs clearance: Included in shipping time

### 5.2 Sunglasses Orders

#### Lithuania (Omniva)

| Order Contents | Processing Time | Shipping Time | **Total Delivery** |
|----------------|----------------|---------------|-------------------|
| Sunglasses | 0-1 day | 2-3 days | **2-4 days** |

**Breakdown:**
- Order processing: 0-1 day
- Omniva shipping: 2-3 days

#### International (DHL)

| Order Contents | Processing Time | Shipping Time | **Total Delivery** |
|----------------|----------------|---------------|-------------------|
| Sunglasses | 0-1 day | 3-6 days | **4-7 days** |

**Breakdown:**
- Order processing: 0-1 day
- DHL international shipping: 3-6 days
- Customs clearance: Included in shipping time

---

## 6. Delivery Time Calculation Function

### Function Signature

```typescript
export function getDeliveryTime(
  items: Array<{ prescriptionData?: any; productSlug?: string | null }>,
  shippingCountry: string
): string
```

### Return Values

| Product Type | Location | Return Value |
|--------------|----------|--------------|
| Prescription Glasses | Lithuania | `"4-7 days"` |
| Prescription Glasses | Other | `"9-14 days"` |
| Sunglasses | Lithuania | `"2-4 days"` |
| Sunglasses | Other | `"4-7 days"` |

### Usage in Codebase

**Locations where delivery time is displayed:**
1. **Checkout Page** (`src/app/checkout/page.tsx`)
   - Shows expected delivery time during checkout
   - Updates dynamically when shipping country changes

2. **Order Success Page** (`src/app/checkout/success/page.tsx`)
   - Displays delivery time in order confirmation

3. **Account Page** (`src/app/account/page.tsx`)
   - Shows delivery time for each order in order history

4. **Admin Orders Management** (`src/app/admin/orders/OrdersManagement.tsx`)
   - Displays delivery time in order details for admins

---

## 7. Factors Affecting Delivery Time

### 7.1 Processing Time Factors

#### Prescription Glasses
- **Lens Type:** Standard lenses (1-2 days), Premium lenses may take longer
- **Lens Index:** Higher index (1.67) may require additional processing
- **Coating:** Special coatings may add processing time
- **Tinting:** Custom tinting adds 0.5-1 day
- **Frame Type:** Complex frames (rimless, Lindberg) may add processing time
- **Prescription Complexity:** High prescriptions may require additional quality checks

#### Sunglasses
- **Stock Availability:** In-stock items ship faster
- **Customization:** Any customization adds processing time

### 7.2 Shipping Time Factors

#### Omniva (Baltic Countries)
- **Domestic Lithuania:** 2-4 days
- **Latvia/Estonia:** 3-5 days
- **Weekend/Holidays:** May add 1-2 days

#### DHL (International)
- **Schengen Zone:** 4-7 days
- **EU (Non-Schengen):** 5-9 days
- **Rest of World:** 7-14 days
- **Customs Clearance:** 1-3 days (included in estimate)
- **Weekend/Holidays:** May add 1-2 days

### 7.3 External Factors

- **Holiday Seasons:** Increased shipping volumes may cause delays
- **Customs Delays:** International orders may experience customs delays
- **Weather Conditions:** Extreme weather may affect shipping
- **Address Issues:** Incorrect or incomplete addresses cause delays

---

## 8. Delivery Time Display

### Customer-Facing Display

Delivery times are displayed to customers in the following format:

```
📦 Expected Delivery: 4-7 days
```

**Display Locations:**
- Checkout page (before order placement)
- Order confirmation page (after order placement)
- Order history (in account page)
- Order details (admin panel)

### Format

- **Icon:** 📦 (package emoji)
- **Label:** "Expected Delivery:"
- **Time Range:** Dynamic based on order type and location
- **Styling:** Teal/blue color, bold font

---

## 9. Order Processing Workflow

### 9.1 Prescription Glasses Order Flow

```
Order Placed
    ↓
Payment Confirmed
    ↓
Prescription Data Validated (0-1 day)
    ↓
Lens Manufacturing (1-2 days)
    ↓
Coating Application (if applicable)
    ↓
Edging & Mounting (0.5-1 day)
    ↓
Quality Control Check (0.5 day)
    ↓
Packaging (0.5 day)
    ↓
Handed to Shipping Provider
    ↓
In Transit (2-14 days depending on location)
    ↓
Delivered
```

**Total Processing Time:** 2-3 days (before shipping)

### 9.2 Sunglasses Order Flow

```
Order Placed
    ↓
Payment Confirmed
    ↓
Stock Verification (0-0.5 day)
    ↓
Packaging (0.5 day)
    ↓
Handed to Shipping Provider
    ↓
In Transit (2-7 days depending on location)
    ↓
Delivered
```

**Total Processing Time:** 0-1 day (before shipping)

---

## 10. Shipping Provider Details

### 10.1 Omniva

**Coverage:** Latvia, Lithuania, Estonia

**Service Features:**
- Parcel lockers available
- Home delivery available
- Tracking provided
- SMS notifications

**Typical Delivery Times:**
- Lithuania: 2-4 days
- Latvia: 3-5 days
- Estonia: 3-5 days

### 10.2 DHL

**Coverage:** All other countries (default)

**Service Features:**
- International express shipping
- Full tracking provided
- Signature required (where applicable)
- Customs handling included

**Typical Delivery Times:**
- Schengen Zone: 3-6 days
- EU (Non-Schengen): 5-9 days
- Rest of World: 7-14 days

---

## 11. Special Cases

### 11.1 Mixed Orders

**Scenario:** Order contains both prescription glasses and sunglasses

**Handling:**
- Order is classified as **prescription glasses order**
- Uses prescription glasses delivery timeframe
- All items ship together in one package

**Example:**
- 1x Prescription Glasses + 1x Sunglasses
- Shipping to Germany
- **Delivery Time:** 9-14 days (prescription glasses timeframe)

### 11.2 Multiple Prescription Glasses

**Scenario:** Order contains multiple pairs of prescription glasses

**Handling:**
- Each pair is manufactured separately
- Processing time may increase by 1-2 days per additional pair
- All pairs ship together once all are ready
- Delivery time remains the same (based on location)

### 11.3 Rush Orders

**Current Status:** Rush order processing is not currently implemented

**Future Consideration:**
- May add expedited processing option
- Would require additional fees
- Would reduce processing time by 1-2 days

---

## 12. Tracking Information

### When Tracking Becomes Available

- **Prescription Glasses:** Tracking number provided after quality control (2-3 days after order)
- **Sunglasses:** Tracking number provided after packaging (0-1 day after order)

### Tracking Updates

- Tracking numbers are stored in order record
- Customers can view tracking in their account
- Admin can add tracking messages/updates
- Email notifications sent when tracking is available

---

## 13. Delivery Time Guarantees

### Current Policy

- Delivery times are **estimates**, not guarantees
- Actual delivery may vary based on external factors
- No compensation for delays due to:
  - Customs clearance
  - Weather conditions
  - Incorrect shipping addresses
  - Customer unavailability

### Customer Communication

- Delivery times are clearly displayed before order placement
- Customers receive order confirmation with delivery estimate
- Tracking information provided when available
- Updates sent if significant delays occur

---

## 14. Code References

### Main Delivery Time Function

**File:** `src/lib/delivery-time.ts`
- Function: `getDeliveryTime()`
- Lines: 7-42

### Shipping Provider Function

**File:** `src/lib/shipping-provider.ts`
- Function: `getShippingProvider()`
- Lines: 6-20
- Function: `getShippingProviderDisplayName()`
- Lines: 25-27

### Usage Locations

1. `src/app/checkout/page.tsx` - Line 116-124
2. `src/app/checkout/success/page.tsx` - Line 557-572
3. `src/app/account/page.tsx` - Line 880-894
4. `src/app/admin/orders/OrdersManagement.tsx` - Line 652-666

---

## 15. Summary Table

### Quick Reference

| Product Type | Lithuania | International | Provider |
|--------------|-----------|---------------|----------|
| **Prescription Glasses** | 4-7 days | 9-14 days | Omniva / DHL |
| **Sunglasses** | 2-4 days | 4-7 days | Omniva / DHL |

### Processing Time Breakdown

| Product Type | Processing | Lithuania Shipping | International Shipping |
|--------------|------------|---------------------|------------------------|
| **Prescription Glasses** | 2-3 days | 2-4 days | 7-11 days |
| **Sunglasses** | 0-1 day | 2-3 days | 3-6 days |

---

## 16. Important Notes

1. **Delivery times are estimates** - Actual delivery may vary
2. **Processing time starts** after payment confirmation
3. **Weekends and holidays** may add to delivery time
4. **International orders** include customs clearance time
5. **Mixed orders** use the longest delivery timeframe
6. **Tracking information** provided when order ships
7. **Shipping provider** is automatically selected based on country
8. **Lithuania** gets faster delivery due to local processing
9. **Prescription glasses** require manufacturing time
10. **Sunglasses** ship faster as they're pre-made

---

## 17. Update Instructions

To update delivery times:

1. **Edit the function:** `src/lib/delivery-time.ts`
2. **Update return values** in the `getDeliveryTime()` function
3. **Test with different order types** and locations
4. **Update this documentation** with new timeframes
5. **Notify customer service** of any changes

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-18  
**Maintained By:** Development Team



