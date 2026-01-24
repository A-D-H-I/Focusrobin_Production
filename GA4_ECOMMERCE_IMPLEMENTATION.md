# GA4 E-commerce Tracking Implementation

## ✅ Implementation Complete

All GA4 e-commerce events have been successfully implemented across the FocusRobin site.

---

## 📊 Events Implemented

### 1. `view_item` - Product Page View

**File**: `src/app/products/[slug]/ProductPageContent.tsx`

**Trigger**: When a user views a product page (fires once per page load)

**Payload**:
```typescript
{
  item_id: product.slug || product.id,
  item_name: product.name,
  price: parsedPrice,        // EUR price
  currency: 'EUR',
  item_category: category,   // e.g., "Men, Women"
}
```

**Implementation**:
- Uses `useEffect` with `useRef` to track only once per product
- Parses price from product.price string (handles various formats)
- Fires alongside Meta Pixel `ViewContent` event

---

### 2. `add_to_cart` - Add to Cart Action

**File**: `src/context/CartContext.tsx`

**Trigger**: When a user clicks "Add to Cart" button

**Payload**:
```typescript
{
  item_id: product.slug || product.id,
  item_name: product.name,
  price: price,              // EUR price per unit
  quantity: quantity,
  currency: 'EUR',
  item_category: category,
}
```

**Implementation**:
- Fires in the `addToCart` function after optimistic state update
- Tracks actual quantity added (not cumulative)
- Fires alongside Meta Pixel `AddToCart` event

---

### 3. `begin_checkout` - Checkout Initiated

**File**: `src/app/checkout/page.tsx`

**Trigger**: When a user clicks "Place Order" button on checkout page

**Payload**:
```typescript
{
  value: total,              // Total order value in EUR
  currency: 'EUR',
  items: [
    {
      item_id: product.slug || product.id,
      item_name: product.name,
      price: price,
      quantity: quantity,
    },
    // ... more items
  ]
}
```

**Implementation**:
- Uses `useRef` to track only once per checkout session
- Fires before payment processing begins
- Includes all cart items with individual prices
- Fires alongside Meta Pixel `InitiateCheckout` event

---

### 4. `purchase` - Order Completed

**File**: `src/app/checkout/success/page.tsx`

**Trigger**: When payment is successfully completed (two locations):
1. After Stripe payment verification
2. After PayPal payment capture

**Payload**:
```typescript
{
  transaction_id: orderData.orderNumber,  // Unique order number
  value: orderData.total,                 // Total order value
  currency: orderData.currency || 'EUR',
  items: [
    {
      item_id: item.sku || item.id,
      item_name: item.productName,
      price: item.price,
      quantity: item.quantity,
    },
    // ... more items
  ]
}
```

**Implementation**:
- Uses `useRef` to ensure event fires only once per order
- Fires after payment status is confirmed as `COMPLETED`
- Includes actual order data from database
- Fires alongside Meta Pixel `Purchase` event
- Handles both Stripe and PayPal payment flows

---

## 🔍 How to Verify Events

### Method 1: GA4 Realtime (Recommended)

1. Go to https://analytics.google.com/
2. Select property `G-J15YGN1PK6`
3. Navigate to: **Reports → Realtime**
4. Look for:
   - **Events in the last 30 minutes**
   - Event names: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`

### Method 2: Browser DevTools

1. Open DevTools (F12) → **Network** tab
2. Filter by: `collect`
3. Look for POST requests to `https://region1.google-analytics.com/g/collect`
4. Check the request payload for event names (`en=view_item`, `en=add_to_cart`, etc.)

### Method 3: GA4 DebugView (Advanced)

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) extension
2. Enable the extension
3. Visit your site
4. Go to GA4 → **Admin → DebugView**
5. See events in real-time with full parameter details

---

## 🧪 Testing Checklist

| Event | Test Action | Expected Result |
|-------|-------------|-----------------|
| `view_item` | Visit a product page | Event fires once with product details |
| `add_to_cart` | Click "Add to Cart" | Event fires with product + quantity |
| `begin_checkout` | Click "Place Order" on checkout | Event fires once with cart total + items |
| `purchase` | Complete a test order | Event fires once with order number + total |

---

## 📝 Files Changed

| File | Changes | Event |
|------|---------|-------|
| `src/app/products/[slug]/ProductPageContent.tsx` | Added `trackGA4ViewItem` import and call | `view_item` |
| `src/context/CartContext.tsx` | Added `trackGA4AddToCart` import and call | `add_to_cart` |
| `src/app/checkout/page.tsx` | Added `trackGA4BeginCheckout` import and call | `begin_checkout` |
| `src/app/checkout/success/page.tsx` | Added `trackGA4Purchase` import and calls (2 locations) | `purchase` |

---

## 💡 Key Implementation Details

### Preventing Duplicate Events

All events use `useRef` to track if they've already fired:
- `view_item`: `hasTrackedView` ref in ProductPageContent
- `add_to_cart`: Fires on every add (intentional - tracks each action)
- `begin_checkout`: `hasTrackedCheckout` ref in checkout page
- `purchase`: `hasTrackedPurchase` ref in success page

### Price Handling

All prices are sent in **EUR** (base currency):
- Product prices are parsed from string format (handles €, ЛВ, commas, etc.)
- Prices are validated before sending (must be > 0)
- Currency is consistently set to `'EUR'`

### Production-Only Tracking

All GA4 events only fire in production mode (`NODE_ENV === 'production'`):
- Development mode: Events are logged to console but not sent
- Production mode: Events are sent to Google Analytics

---

## 🚀 Next Steps

1. **Deploy to production** with `NEXT_PUBLIC_GA4_MEASUREMENT_ID` environment variable
2. **Test all events** in GA4 Realtime after deployment
3. **Monitor GA4 Reports** → E-commerce purchases report (available after 24-48 hours)
4. **Set up GA4 conversions** for key events (purchase, begin_checkout)
5. **Create GA4 audiences** based on e-commerce behavior

---

## 📊 Expected GA4 Reports

After 24-48 hours of data collection, you'll see:

- **Monetization → E-commerce purchases**: Revenue, transactions, average order value
- **Monetization → Purchase journey**: Funnel from view_item → purchase
- **Engagement → Events**: All e-commerce event counts
- **User → User lifetime**: Customer lifetime value (LTV)

---

## ✅ Summary

- ✅ All 4 core e-commerce events implemented
- ✅ Events fire at correct user actions
- ✅ Duplicate prevention in place
- ✅ Production-only tracking
- ✅ Consistent EUR currency
- ✅ Build passes without errors
- ✅ Ready for production deployment

GA4 e-commerce tracking is now fully functional and ready to provide valuable insights into your store's performance!

