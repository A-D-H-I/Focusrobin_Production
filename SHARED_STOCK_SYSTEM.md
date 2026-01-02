# Shared Stock System - Prescription Glasses & Sunglasses

## 🎯 The Problem You Wanted to Solve

> "The stocks should be merged if the product is same as the sunglasses, or just add separate stocks if the model is not in the sunglasses."

## ✅ The Solution: Linked Products with Shared Stock

### How It Works

```
Scenario 1: Same Frame Model (Shared Stock)
├─ Sunglasses: "Classic Aviator" 
│  └─ Stock: 50 units (in ProductVariant table)
│
├─ Prescription Glasses: "Classic Aviator RX"
│  ├─ Linked to: "Classic Aviator" sunglasses
│  ├─ useSharedStock: TRUE
│  └─ Stock Source: Uses sunglasses' 50 units (SHARED)
│
└─ Result: Both pull from the same 50 units

Scenario 2: Unique Model (Separate Stock)
├─ Prescription Glasses: "Reading Pro"
│  ├─ Linked to: NONE
│  ├─ useSharedStock: FALSE
│  └─ Stock: 30 units (own stock)
│
└─ Result: Has its own independent 30 units
```

## 📊 Database Structure

### New Fields Added to PrescriptionGlasses:

```prisma
model PrescriptionGlasses {
  // ... other fields ...
  
  linkedProductId String?  // Points to a Product (sunglasses) ID
  useSharedStock  Boolean  // If true, uses sunglasses stock
  
  LinkedProduct   Product? // The linked sunglasses product
}
```

### Product (Sunglasses) Updated:

```prisma
model Product {
  // ... other fields ...
  
  LinkedPrescriptionGlasses PrescriptionGlasses[] // All prescription glasses linked to this
}
```

## 🎨 How to Use

### Option 1: Create Linked Prescription Glasses (Shared Stock)

**Step 1: Create the Sunglasses First**
```
Go to: /admin/add
Product: "Classic Aviator"
Variants:
  - Black Frame: 25 units
  - Brown Frame: 25 units
Total Stock: 50 units
Save to Product table
```

**Step 2: Create Linked Prescription Glasses**
```
Go to: /admin/prescription-glasses/add
Product: "Classic Aviator RX"
✓ Link to Product: Select "Classic Aviator"
✓ Use Shared Stock: YES
Variants:
  - Black Frame: (uses sunglasses stock)
  - Brown Frame: (uses sunglasses stock)
Save to PrescriptionGlasses table
```

**Result:**
- Selling 1 sunglass reduces stock by 1
- Selling 1 prescription glass reduces the SAME stock by 1
- Both share the same 50 units

### Option 2: Create Independent Prescription Glasses (Separate Stock)

```
Go to: /admin/prescription-glasses/add
Product: "Reading Pro"
✓ Link to Product: NONE (leave empty)
✓ Use Shared Stock: NO
Variants:
  - Blue Frame: 15 units (own stock)
  - Red Frame: 15 units (own stock)
Total Stock: 30 units (independent)
Save to PrescriptionGlasses table
```

**Result:**
- Has its own 30 units
- Not connected to any sunglasses
- Independent inventory

## 📈 Stock Management

### Scenario: Shared Stock

**Initial State:**
```
Sunglasses "Classic Aviator" - Black: 25 units
Prescription "Classic Aviator RX" - Black: [Shares sunglasses stock]
```

**After selling 1 sunglass:**
```
Sunglasses "Classic Aviator" - Black: 24 units
Prescription "Classic Aviator RX" - Black: 24 units (auto-updated)
```

**After selling 1 prescription glass:**
```
Sunglasses "Classic Aviator" - Black: 23 units (auto-updated)
Prescription "Classic Aviator RX" - Black: 23 units
```

### Scenario: Separate Stock

**Initial State:**
```
Prescription "Reading Pro" - Blue: 15 units (own stock)
No linked sunglasses
```

**After selling 1 prescription glass:**
```
Prescription "Reading Pro" - Blue: 14 units
No other products affected
```

## 🔧 Technical Implementation

### When Adding Prescription Glasses:

1. **Admin selects from dropdown:**
   - "No Link (Separate Stock)" → Independent
   - "Classic Aviator" → Linked with shared stock
   - "Modern Wayfarer" → Linked with shared stock
   - ... (all available sunglasses)

2. **If linked:**
   - `linkedProductId` = selected sunglasses ID
   - `useSharedStock` = true
   - Variants must match sunglasses variants (by color)
   - Stock pulled from sunglasses ProductVariant table

3. **If not linked:**
   - `linkedProductId` = null
   - `useSharedStock` = false
   - Variants have their own stock
   - Stock stored in PrescriptionGlassesVariant table

## 💡 Benefits

### For Same Frame Models:
- ✅ One inventory to manage
- ✅ Sell frame as either sunglasses OR prescription
- ✅ No double-counting
- ✅ Real-time sync between both products

### For Unique Models:
- ✅ Independent inventory
- ✅ No connection needed
- ✅ Simpler management
- ✅ Own pricing, offers, everything

## ⚙️ Admin Experience

### Adding Prescription Glasses Form:

```
Product Name: [Classic Aviator RX]

Link to Sunglasses Product (Optional):
[Dropdown]
  - None (Separate Stock)
  - Classic Aviator ← Select this
  - Modern Wayfarer
  - Sport Series
  
☑ Use Shared Stock (only if linked)
  "When checked, this prescription glasses product will 
   share inventory with the linked sunglasses product"

Variants:
  If linked: Must match sunglasses variants
  If not linked: Can be anything
```

### Stock Display:

**When Linked:**
```
Black Frame
Stock: 23 units (shared with "Classic Aviator" sunglasses)
[Warning: Changing stock here will affect linked sunglasses]
```

**When Not Linked:**
```
Blue Frame
Stock: 15 units (independent)
[Stock is managed separately]
```

## 🎯 Use Cases

### Use Case 1: Popular Frame in Both Categories
```
Frame: "Aviator Pro"
Sunglasses: 50 units
Prescription: Links to sunglasses (shared 50 units)
Total Available: 50 units (not 100!)
Customer can buy as sunglasses OR prescription
```

### Use Case 2: Prescription-Only Frame
```
Frame: "Reading Comfort"
Sunglasses: N/A (doesn't exist)
Prescription: 30 units (independent)
Total Available: 30 units
Only available as prescription glasses
```

### Use Case 3: Sunglasses-Only Frame  
```
Frame: "Sport Shield"
Sunglasses: 40 units
Prescription: N/A (not offered)
Total Available: 40 units
Only available as sunglasses
```

## 📋 Summary

| Aspect | Linked (Shared Stock) | Not Linked (Separate Stock) |
|--------|----------------------|---------------------------|
| **Stock Source** | Sunglasses Product | Own stock |
| **Inventory Management** | One place | Separate |
| **Stock Count** | Merged | Independent |
| **Use When** | Same frame model | Unique frame model |
| **Database Link** | linkedProductId set | linkedProductId null |

## ⚠️ Important Notes

### When Linking:
1. Sunglasses product must exist FIRST
2. Variant colors should match
3. Stock managed at sunglasses level
4. Deleting sunglasses sets link to null (prescription keeps its data but loses stock link)

### When Not Linking:
1. Completely independent
2. Variants can be different
3. Stock managed at prescription glasses level
4. No dependency on sunglasses

## 🚀 Next Steps

I'm now updating the admin form to support this linking feature. You'll be able to:
1. Select which sunglasses product to link to (if any)
2. Toggle shared stock on/off
3. See stock status clearly
4. Manage both scenarios easily

This gives you the flexibility to:
- ✅ Share stock when frames are the same
- ✅ Keep stock separate when frames are different
- ✅ Best of both worlds!

