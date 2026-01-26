# Prescription Pricing Export Files

This directory contains CSV exports of all prescription pricing data from the database.

## 🚀 Quick Start - Deploy Pricing in 30 Seconds

**After deployment, just run:**
```bash
npx ts-node scripts/import-prescription-pricing.ts
```

That's it! The script will automatically:
- Find the most recent CSV file
- Clear old pricing data
- Import all 41 pricing entries (33 lens prices + 2 tint fees + 5 edging fees + 1 profit)

**No manual data entry required!** ✨

## 📁 Files Generated

1. **`prescription-pricing-complete-{date}.csv`** - **RECOMMENDED** - Combined file with all pricing data
2. `prescription-lens-prices-{date}.csv` - Lens prices only
3. `prescription-tint-fees-{date}.csv` - Tint fees only
4. `prescription-edging-fees-{date}.csv` - Edging fees only
5. `prescription-profit-{date}.csv` - Fixed profit only

## 📊 Data Structure

### Lens Prices
- **Unit**: Per SINGLE lens (multiply by 2 for pair price)
- **Columns**: Lens Type, Lens Index, Coating, Price (EUR per Single Lens), Pair Price (EUR), Is Active

### Tint Fees
- **Unit**: Per PAIR
- **Columns**: Tint Type, Price (EUR per Pair), Is Active

### Edging Fees
- **Unit**: Per ORDER (one-time fee)
- **Columns**: Frame Type, Price (EUR per Order), Is Active

### Fixed Profit
- **Unit**: Per ORDER (added to total Rx cost)
- **Columns**: Name, Profit (EUR), Is Active

## 🔄 How to Use After Deployment

### ✅ Option 1: Automatic CSV Import (EASIEST - RECOMMENDED)

**Just run one command and you're done!**

1. Copy the CSV file (`prescription-pricing-complete-YYYYMMDD.csv`) to your server
2. Run the import script:
   ```bash
   npx ts-node scripts/import-prescription-pricing.ts
   ```
   
   Or specify a custom CSV path:
   ```bash
   npx ts-node scripts/import-prescription-pricing.ts path/to/your/file.csv
   ```

The script will:
- ✅ Automatically find the most recent CSV file (if no path provided)
- ✅ Clear existing pricing data
- ✅ Import all lens prices, tint fees, edging fees, and profit
- ✅ Show a summary of what was imported

**That's it! No manual data entry needed.**

### Option 2: Use the Seed Script

1. Copy the pricing values from the CSV files
2. Update `prisma/seedPrescriptionPricing.ts` with the values
3. Run the seed script:
   ```bash
   npx ts-node prisma/seedPrescriptionPricing.ts
   ```

### Option 3: Manual Import via Admin Panel

1. Navigate to `/admin/prescription-pricing`
2. Use the admin interface to manually update each price
3. Reference the CSV files for the correct values

⚠️ **Note**: This option requires entering 41 values manually (33 lens prices + 2 tint fees + 5 edging fees + 1 profit)

## 📋 Pricing Formula Reference

```
Final Rx Price = (Single Lens × 2) + Tint Fee + Edging Fee + Fixed Profit
```

Where:
- **Single Lens × 2** = Pair price for lenses
- **Tint Fee** = Only applies if TINTED lens type is selected
- **Edging Fee** = One-time fee per order based on frame type
- **Fixed Profit** = €15.00 (default, can be changed in admin)

## ⚠️ Important Notes

1. **Lens prices are per SINGLE lens** - The system automatically calculates pair prices
2. **Tint fees only apply to TINTED lens type** - Not applicable to CLEAR, PHOTOCHROMIC, or POLARIZED
3. **Edging fees are per ORDER** - Not per item, applied once per order
4. **Fixed profit is per ORDER** - Added to the total prescription cost

## 🔍 Available UI Combinations

The following combinations are available in the prescription flow UI:

- **CLEAR**: 1.56, 1.60, 1.67 | UC, BLUE_PRO
- **TINTED**: 1.56, 1.60, 1.67 | SERICUM_UV only
- **PHOTOCHROMIC_SOLIS**: 1.56, 1.60, 1.67 | SERICUM_UV, BLUE_PRO
- **POLARIZED_NUPOLAR**: 1.60, 1.67 only (no 1.56) | SERICUM_UV only

## 📅 Export Date

Files are named with the export date: `prescription-pricing-complete-YYYYMMDD.csv`

## 🔄 Re-exporting

To create a new export with current database values:

```bash
npx ts-node scripts/export-prescription-pricing.ts
```

New files will be created in `data/exports/` with the current date.

