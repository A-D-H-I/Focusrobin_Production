# CSV Export Feature - Sales Data Export

## ✅ Feature Added: CSV Export for Sales Analytics

You can now download all sales data as CSV files for external analysis and visualization.

---

## 📊 What's Included in CSV Export

### CSV Columns (24 columns per row):

1. **Order Information:**
   - Order Number
   - Order Date
   - Order Status
   - Payment Status
   - Payment Method

2. **Customer Information:**
   - Customer Email
   - Customer Name

3. **Financial Data:**
   - Subtotal (EUR)
   - Shipping (EUR)
   - Promo Discount (EUR)
   - Wallet Used (EUR)
   - Total (EUR)
   - Currency

4. **Shipping Information:**
   - Shipping Country
   - Shipping City

5. **Product Information:**
   - Item Product Name
   - Item Variant Name
   - Item SKU
   - Item Quantity
   - Item Price (EUR)
   - Item Total (EUR)

6. **Product Classification:**
   - Product Type (Sunglasses / Prescription Glasses)
   - Product Category (Men, Women, Kids, Unisex)
   - Has Prescription (Yes / No)

---

## 🎯 How to Use

### Step 1: Go to Analytics Dashboard
1. Navigate to `/admin/analytics`
2. Select your desired time period (7d, 30d, 90d, 1y, all)

### Step 2: Export CSV
1. Click the **"Export CSV"** button (top right, next to refresh)
2. The CSV file will download automatically
3. Filename format: `sales-data-{period}-{date}.csv`

### Step 3: Use in External Tools
- Open in Excel, Google Sheets, or any spreadsheet software
- Import into data visualization tools (Tableau, Power BI, etc.)
- Use for custom analysis and reporting

---

## 📋 CSV Format Details

### File Structure:
- **One row per order item** (not per order)
- If an order has 3 items, it will have 3 rows
- All rows for the same order share the same order-level data

### Data Format:
- **Dates**: ISO format (YYYY-MM-DD)
- **Currency**: All amounts in EUR
- **Text**: Properly escaped for CSV (handles commas, quotes, newlines)
- **Product Type**: Automatically classified (Sunglasses / Prescription Glasses)

---

## 🔧 Technical Implementation

### Files Created:

1. **API Route**: `src/app/api/admin/analytics/export/route.ts`
   - Fetches all completed orders
   - Formats data into CSV
   - Returns CSV file with proper headers
   - Uses Node.js runtime

2. **Dashboard Update**: `src/app/admin/analytics/AnalyticsDashboard.tsx`
   - Added "Export CSV" button
   - Added `downloadCSV()` function
   - Handles file download

---

## 📊 CSV Data Structure Example

```csv
Order Number,Order Date,Customer Email,Customer Name,Order Status,Payment Status,Payment Method,Subtotal (EUR),Shipping (EUR),Promo Discount (EUR),Wallet Used (EUR),Total (EUR),Currency,Shipping Country,Shipping City,Item Product Name,Item Variant Name,Item SKU,Item Quantity,Item Price (EUR),Item Total (EUR),Product Type,Product Category,Has Prescription
ORD-2024-001,2024-01-15,user@example.com,John Doe,PAID,COMPLETED,card,47.50,5.00,0.00,0.00,52.50,EUR,Lithuania,Vilnius,Classic Aviator,Black Frame,AVI-BLK-001,1,47.50,47.50,Sunglasses,Men,No
ORD-2024-002,2024-01-16,user2@example.com,Jane Smith,PAID,COMPLETED,paypal,120.00,8.00,10.00,0.00,118.00,EUR,Ireland,Dublin,Prescription Frame,Clear Lens,PRX-CLR-001,1,120.00,120.00,Prescription Glasses,Women,Yes
```

---

## 🎨 Features

✅ **Automatic Product Classification**: Sunglasses vs Prescription Glasses
✅ **Complete Order Details**: All financial and shipping information
✅ **Item-Level Data**: One row per item for detailed analysis
✅ **Date Range Support**: Exports data for selected time period
✅ **Proper CSV Formatting**: Handles special characters correctly
✅ **Admin-Only Access**: Secure export endpoint

---

## 💡 Use Cases

1. **Financial Analysis**: Import into Excel for revenue analysis
2. **Product Performance**: Analyze which products sell best
3. **Geographic Analysis**: See sales distribution by country
4. **Customer Insights**: Analyze customer purchasing patterns
5. **Inventory Planning**: Use sales data for stock management
6. **Custom Reports**: Create custom visualizations in BI tools

---

## 🔒 Security

- **Admin-only**: Only admins can export data
- **Server-side**: Data is fetched securely from database
- **No client-side exposure**: All processing happens on server

---

## 📝 File Naming

CSV files are named: `sales-data-{period}-{date}.csv`

Examples:
- `sales-data-30d-2026-01-24.csv`
- `sales-data-all-2026-01-24.csv`

---

## ✅ Summary

- ✅ CSV export endpoint created
- ✅ Download button added to dashboard
- ✅ Complete sales data included
- ✅ Product type classification included
- ✅ Proper CSV formatting
- ✅ Build verified and working

**You can now export your sales data for external analysis!** 📊

