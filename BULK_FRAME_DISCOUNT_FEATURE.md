# ✅ Bulk Frame Discount Feature - Complete Implementation

## Overview
Added a new promo code type that applies discounts **only to frames** (not prescription glasses) when purchasing multiple frames.

## Features

### Admin Panel Configuration
1. **Checkbox**: "Apply Discount to Frames Only (Not Prescription Glasses)"
2. **Minimum Frame Quantity**: Select minimum number of frames required (e.g., 2, 3, 4)
3. **Frame Discount Percentage**: Discount percentage applied only to frames (e.g., 50%)

### How It Works

**Example:**
- Promo Code: `BUY2FRAMES50`
- Minimum Frame Quantity: **2**
- Frame Discount Percentage: **50%**
- Apply to Frames Only: **✓**

**Result:**
- User adds 2 regular frames → Gets 50% off on both frames ✓
- User adds 1 frame + 1 prescription glasses → No discount (only 1 frame) ✗
- User adds 3 frames → Gets 50% off on all 3 frames ✓
- User adds 2 frames + 2 prescription glasses → Gets 50% off on the 2 frames only ✓

## Database Changes

### New Fields in `PromoCode` Model:
- `minFrameQuantity` (Int?) - Minimum number of frames required
- `bulkFrameDiscountPercentage` (Decimal?) - Discount percentage for frames only
- `applyToFramesOnly` (Boolean) - If true, discount only applies to frames

## Files Modified

### 1. Database Schema
- `prisma/schema.prisma` - Added 3 new fields to PromoCode model

### 2. Admin Panel
- `src/app/admin/promo-codes/PromoCodeManagement.tsx`
  - Added checkbox for "Apply to Frames Only"
  - Added input fields for minimum frame quantity and discount percentage
  - Added validation
  - Updated table to show frame discount info

### 3. API Routes
- `src/app/api/admin/promo-codes/route.ts` - Handle new fields in POST
- `src/app/api/admin/promo-codes/[id]/route.ts` - Handle new fields in PUT
- `src/app/api/promo-codes/validate/route.ts` - Validate frame quantity and calculate frame-only discount

### 4. Checkout Logic
- `src/app/checkout/page.tsx` - Calculate frame quantity/subtotal and pass to validation API
- `src/app/actions/checkout.ts` - Apply frame-only discount in Stripe checkout
- `src/app/api/paypal/create-order/route.ts` - Apply frame-only discount in PayPal checkout

## How to Use

### Creating a Bulk Frame Discount Promo Code:

1. Go to `/admin/promo-codes`
2. Click "Create Promo Code"
3. Enter promo code (e.g., `BUY2FRAMES50`)
4. **Check** "Apply Discount to Frames Only"
5. Set **Minimum Frame Quantity**: `2` (or 3, 4, etc.)
6. Set **Frame Discount Percentage**: `50` (or any percentage)
7. Set other fields (start date, end date, usage limit, etc.)
8. Click "Create"

### How Customers Use It:

1. Add **2 or more frames** to cart (regular frames, not prescription glasses)
2. Go to checkout
3. Enter the promo code
4. Discount is automatically applied **only to the frames**

## Technical Details

### Frame Detection Logic:
- **Frame**: Cart item with `prescriptionData === null` or `undefined`
- **Prescription Glasses**: Cart item with `prescriptionData` object

### Discount Calculation:
```typescript
// If applyToFramesOnly = true:
if (frameQuantity >= minFrameQuantity) {
  discount = (frameSubtotal * bulkFrameDiscountPercentage) / 100;
  // Discount only applied to frames, not prescription glasses
}
```

### Validation:
- Checks minimum frame quantity requirement
- Validates promo code is active and within date range
- Validates usage limits
- Calculates discount only on frame subtotal

## Testing Checklist

✅ Create promo code with "Apply to Frames Only" enabled
✅ Set minimum frame quantity to 2
✅ Set discount percentage to 50%
✅ Add 2 frames to cart → Apply promo code → Verify 50% discount on frames
✅ Add 1 frame + 1 prescription → Apply promo code → Verify error (not enough frames)
✅ Add 3 frames → Apply promo code → Verify 50% discount on all 3 frames
✅ Add 2 frames + 2 prescription → Apply promo code → Verify 50% discount only on 2 frames

## Notes

- Frame-only discounts **do NOT** apply to prescription glasses
- Regular discounts (not frame-only) still work as before
- Both discount types can coexist (but only one can be active per promo code)
- The discount is calculated and applied automatically when the promo code is entered

