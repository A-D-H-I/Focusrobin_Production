import ExcelJS from 'exceljs';

const API_KEY = '0b005f3d6cbf7421501e9f5b7fff7fc855ce3b13';
const API_URL = 'https://mbx.blue-berry.eu/api';
const PAGE_LIMIT = 100;

interface BBProduct {
  number: string;
  ean: string;
  name: string;
  model: string;
  brand: string;
  category: string;
  stock: number;
  priceNet: number;
  priceRrp: number;
  color: string;
}

function calculateRetailPrice(wholesalePrice: number): number {
  if (wholesalePrice <= 0) return 0;
  return Math.round(wholesalePrice * 2.5 * 100) / 100;
}

async function fetchAllInStock(): Promise<BBProduct[]> {
  const results: BBProduct[] = [];
  let page = 0;
  while (true) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
      stock_min: '1',
      category: 'Sunglasses,Optical Frames',
    });
    const res = await fetch(`${API_URL}/products?${params}`, { headers: { akey: API_KEY } });
    const json = await res.json();
    const items: BBProduct[] = json?.data || [];
    if (items.length === 0) break;
    results.push(...items);
    console.log(`  Fetched page ${page} — running total: ${results.length}`);
    if (items.length < PAGE_LIMIT) break;
    page++;
  }
  return results;
}

async function main() {
  console.log('Fetching all in-stock Blueberry products (Sunglasses + Optical Frames)...');
  const products = await fetchAllInStock();
  console.log(`Total: ${products.length} products.\n`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FocusRobin';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Blueberry Availability');
  sheet.columns = [
    { header: 'SKU', key: 'sku', width: 14 },
    { header: 'EAN', key: 'ean', width: 16 },
    { header: 'Name', key: 'name', width: 45 },
    { header: 'Brand', key: 'brand', width: 20 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Color', key: 'color', width: 14 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Wholesale Price (EUR)', key: 'wholesale', width: 20 },
    { header: 'Blueberry RRP (EUR)', key: 'rrp', width: 20 },
    { header: 'Our Retail Price (EUR)', key: 'retail', width: 22 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  sheet.autoFilter = { from: 'A1', to: 'J1' };

  for (const p of products) {
    sheet.addRow({
      sku: p.number,
      ean: p.ean,
      name: p.name,
      brand: p.brand,
      category: p.category,
      color: p.color || '',
      stock: p.stock,
      wholesale: p.priceNet,
      rrp: p.priceRrp || '',
      retail: calculateRetailPrice(p.priceNet),
    });
  }

  // Summary sheet
  const summary = workbook.addWorksheet('Summary');
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const sunglasses = products.filter((p) => p.category === 'Sunglasses');
  const opticalFrames = products.filter((p) => p.category === 'Optical Frames');
  const brands = new Set(products.map((p) => p.brand));

  summary.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  summary.getRow(1).font = { bold: true };
  summary.addRows([
    { metric: 'Report generated', value: new Date().toISOString().slice(0, 10) },
    { metric: 'Total in-stock products', value: products.length },
    { metric: 'Sunglasses', value: sunglasses.length },
    { metric: 'Optical Frames', value: opticalFrames.length },
    { metric: 'Distinct brands', value: brands.size },
    { metric: 'Total units in stock', value: totalStock },
  ]);

  const outPath = process.argv[2] || './Blueberry_Availability_Report.xlsx';
  await workbook.xlsx.writeFile(outPath);
  console.log(`\n✅ Report written to: ${outPath}`);
}

main().catch(console.error);
