import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

/**
 * Helper function to check if prescription data contains actual prescription values
 * This prevents generating prescription PDFs for non-prescription items
 * 
 * Returns true if the data has:
 * - rxValues with OD or OS data containing actual prescription values (sph, cyl, axis)
 * - OR rxConfig with lens type configuration
 * 
 * Returns false if:
 * - Data is null/undefined
 * - Only has rxPriceBreakdown but no actual prescription values
 * - Has empty or default prescription values
 * 
 * IMPORTANT: Handles both data formats:
 * - Nested format: { od: { sph, cyl, axis }, os: { sph, cyl, axis } }
 * - Flat format: { odSph, odCyl, odAxis, osSph, osCyl, osAxis } (from cart)
 */
export function hasValidPrescriptionValues(prescriptionData: any): boolean {
  if (!prescriptionData) {
    return false;
  }

  // Check for rxValues structure (from cart or prescription flow)
  const rxValues = prescriptionData.rxValues || prescriptionData;
  
  // Helper to check if a value is a valid non-zero prescription value
  const isValidValue = (val: string | undefined | null): boolean => {
    if (!val) return false;
    const cleanVal = String(val).trim();
    return cleanVal !== '' && cleanVal !== '0.00' && cleanVal !== '0' && cleanVal !== 'undefined';
  };
  
  // Check NESTED format (od.sph, os.sph)
  const hasNestedOdValues = rxValues.od && (
    isValidValue(rxValues.od.sph) || isValidValue(rxValues.od.cyl)
  );
  
  const hasNestedOsValues = rxValues.os && (
    isValidValue(rxValues.os.sph) || isValidValue(rxValues.os.cyl)
  );
  
  // Check FLAT format (odSph, osSph) - from cart prescription data
  const hasFlatOdValues = (
    isValidValue(rxValues.odSph) || isValidValue(rxValues.odCyl)
  );
  
  const hasFlatOsValues = (
    isValidValue(rxValues.osSph) || isValidValue(rxValues.osCyl)
  );
  
  // Combined check for OD/OS values
  const hasOdValues = hasNestedOdValues || hasFlatOdValues;
  const hasOsValues = hasNestedOsValues || hasFlatOsValues;
  
  // Also check if there's a lens configuration (some prescriptions may have plano but still need lenses)
  const hasLensConfig = prescriptionData.rxConfig && (
    prescriptionData.rxConfig.lensType ||
    prescriptionData.rxConfig.lensIndex ||
    prescriptionData.rxConfig.coating
  );
  
  // Check for prescription image URL (indicates user uploaded a prescription)
  const hasUploadedPrescription = !!(
    rxValues.prescriptionImageUrl || 
    prescriptionData.prescriptionImageUrl
  );

  // Item is a valid prescription item if it has:
  // 1. Actual OD/OS values (nested or flat format), OR
  // 2. Lens configuration (even for plano lenses), OR
  // 3. Uploaded prescription image
  const isValidPrescription = hasOdValues || hasOsValues || hasLensConfig || hasUploadedPrescription;
  
  console.log('[PrescriptionPDF] hasValidPrescriptionValues check:', {
    hasNestedOdValues,
    hasNestedOsValues,
    hasFlatOdValues,
    hasFlatOsValues,
    hasLensConfig,
    hasUploadedPrescription,
    isValid: isValidPrescription,
  });
  
  return isValidPrescription;
}

// Types for prescription data
export interface PrescriptionPDFData {
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  productName: string;
  // Prescription values
  od: {
    sph: string;
    cyl: string;
    axis: string;
    prismHorizontal?: string;
    prismHorizontalBase?: string;
    prismVertical?: string;
    prismVerticalBase?: string;
  };
  os: {
    sph: string;
    cyl: string;
    axis: string;
    prismHorizontal?: string;
    prismHorizontalBase?: string;
    prismVertical?: string;
    prismVerticalBase?: string;
  };
  pd: string;
  pdOd?: string;
  pdOs?: string;
  hasTwoPDs: boolean;
  hasPrism: boolean;
  // Lens configuration
  lensType: string;
  lensIndex: string;
  coating: string;
  tintType?: string;
  tintColor?: string;
  tintShadePercent?: number;
  tintRecipe?: string;
  photochromicColor?: string;
  polarizedColor?: string;
  frameType: string;
  // Price breakdown
  lensesPair?: number;
  edgingFee?: number;
  rxRetailNet?: number;
  totalNet?: number;
  // Prescription image URL (if uploaded)
  prescriptionImageUrl?: string;
  // Shipping address
  shippingAddress?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

/**
 * Format lens type for display
 */
function formatLensType(lensType: string): string {
  const types: Record<string, string> = {
    'CLEAR': 'Clear Lenses',
    'TINTED': 'Tinted Lenses',
    'PHOTOCHROMIC_SOLIS': 'Photochromic (Solis)',
    'POLARIZED_NUPOLAR': 'Polarized (NuPolar)',
  };
  return types[lensType] || lensType;
}

/**
 * Format coating for display
 */
function formatCoating(coating: string): string {
  const coatings: Record<string, string> = {
    'UC': 'Uncoated',
    'BLUE_PRO': 'Blue Light Protection',
    'SERICUM_UV': 'Sericum UV Protection',
  };
  return coatings[coating] || coating;
}

/**
 * Format frame type for display
 */
function formatFrameType(frameType: string): string {
  const types: Record<string, string> = {
    'FULL_FRAME': 'Full Frame',
    'NYLON_FRAME': 'Nylon Frame',
    'RIMLESS_PRESSING': 'Rimless (Pressing)',
    'RIMLESS_DRILLING': 'Rimless (Drilling)',
    'SEMI_RIMLESS': 'Semi-Rimless',
  };
  return types[frameType] || frameType;
}

/**
 * Generate a professional prescription PDF
 */
export async function generatePrescriptionPDF(data: PrescriptionPDFData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Colors - Professional medical look
  const primaryColor = rgb(0.16, 0.62, 0.60); // Teal #2A9D9A
  const headerBg = rgb(0.95, 0.97, 0.98); // Light gray-blue
  const tableHeaderBg = rgb(0.16, 0.62, 0.60); // Teal for table headers
  const blackColor = rgb(0, 0, 0);
  const grayColor = rgb(0.4, 0.4, 0.4);
  const whiteColor = rgb(1, 1, 1);
  const lightGrayBg = rgb(0.96, 0.96, 0.96);
  
  // Create page (A4 size)
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  
  // === HEADER SECTION ===
  // Draw header background
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: headerBg,
  });
  
  // Company logo - load and embed actual FocusRobin logo (same as invoice)
  const logoX = 30;
  const logoY = height - 50;
  
  try {
    // Load the SVG logo and convert to PNG (keep original colors)
    const logoPath = join(process.cwd(), 'public', 'logo', 'Horizontal Primary dark (Color).svg');
    const svgBuffer = readFileSync(logoPath);
    
    // Convert SVG to PNG (keep original colors, no greyscale or tint)
    const pngBuffer = await sharp(svgBuffer)
      .resize(280, null, { fit: 'contain' }) // Same size as invoice
      .png()
      .toBuffer();
    
    // Embed the logo image in the PDF
    const logoImage = await pdfDoc.embedPng(pngBuffer);
    const logoDims = logoImage.scale(0.75); // Same scale as invoice
    
    // Draw the logo (original colors, no background)
    page.drawImage(logoImage, {
      x: logoX,
      y: logoY - 20,
      width: logoDims.width,
      height: logoDims.height,
    });
  } catch (error) {
    console.warn('[Prescription PDF] Could not load logo, using text fallback:', error);
    // Fallback to text if logo loading fails
  page.drawText('FocusRobin', {
      x: logoX + 10,
      y: logoY - 5,
    size: 28,
    font: helveticaBold,
    color: primaryColor,
  });
  
  page.drawText('Prescription Eyewear', {
      x: logoX + 10,
      y: logoY - 25,
    size: 12,
    font: helvetica,
    color: grayColor,
  });
  }
  
  // Document title (right side)
  page.drawText('PRESCRIPTION DETAILS', {
    x: 380,
    y: height - 45,
    size: 16,
    font: helveticaBold,
    color: primaryColor,
  });
  
  // Order info
  const dateStr = data.orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  page.drawText(`Order: ${data.orderNumber}`, {
    x: 380,
    y: height - 65,
    size: 10,
    font: helvetica,
    color: grayColor,
  });
  
  page.drawText(`Date: ${dateStr}`, {
    x: 380,
    y: height - 80,
    size: 10,
    font: helvetica,
    color: grayColor,
  });
  
  // === CUSTOMER & PRODUCT INFO ===
  let yPos = height - 130;
  
  // Customer info box
  page.drawRectangle({
    x: 50,
    y: yPos - 50,
    width: 240,
    height: 50,
    color: lightGrayBg,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });
  
  page.drawText('Customer', {
    x: 60,
    y: yPos - 15,
    size: 10,
    font: helveticaBold,
    color: grayColor,
  });
  
  page.drawText(data.customerName, {
    x: 60,
    y: yPos - 32,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  page.drawText(data.customerEmail, {
    x: 60,
    y: yPos - 45,
    size: 9,
    font: helvetica,
    color: grayColor,
  });
  
  // Product info box
  page.drawRectangle({
    x: 305,
    y: yPos - 50,
    width: 240,
    height: 50,
    color: lightGrayBg,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });
  
  page.drawText('Product', {
    x: 315,
    y: yPos - 15,
    size: 10,
    font: helveticaBold,
    color: grayColor,
  });
  
  // Truncate product name if too long
  const productName = data.productName.length > 35 
    ? data.productName.substring(0, 35) + '...' 
    : data.productName;
  
  page.drawText(productName, {
    x: 315,
    y: yPos - 32,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  page.drawText(formatFrameType(data.frameType), {
    x: 315,
    y: yPos - 45,
    size: 9,
    font: helvetica,
    color: grayColor,
  });
  
  // === PRESCRIPTION VALUES TABLE ===
  yPos -= 90;
  
  page.drawText('PRESCRIPTION VALUES', {
    x: 50,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: primaryColor,
  });
  
  yPos -= 25;
  
  // Table dimensions
  const tableX = 50;
  const tableWidth = 495;
  const colWidths = [80, 85, 85, 85, 80, 80]; // Eye, SPH, CYL, AXIS, ADD, PD
  const rowHeight = 28;
  
  // Table header
  page.drawRectangle({
    x: tableX,
    y: yPos - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: tableHeaderBg,
  });
  
  // Header text
  const headers = ['EYE', 'SPHERE (SPH)', 'CYLINDER (CYL)', 'AXIS', 'ADD', 'PD'];
  let headerX = tableX + 10;
  headers.forEach((header, i) => {
    page.drawText(header, {
      x: headerX,
      y: yPos - 18,
      size: 9,
      font: helveticaBold,
      color: whiteColor,
    });
    headerX += colWidths[i];
  });
  
  yPos -= rowHeight;
  
  // Right Eye (OD) row
  page.drawRectangle({
    x: tableX,
    y: yPos - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: lightGrayBg,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 0.5,
  });
  
  let cellX = tableX + 10;
  const odValues = [
    'OD (Right)',
    data.od.sph,
    data.od.cyl,
    data.od.axis + '°',
    '-', // ADD (not typically used for single vision)
    data.hasTwoPDs && data.pdOd ? data.pdOd + ' mm' : '-',
  ];
  
  odValues.forEach((val, i) => {
    page.drawText(val, {
      x: cellX,
      y: yPos - 18,
      size: 10,
      font: i === 0 ? helveticaBold : helvetica,
      color: blackColor,
    });
    cellX += colWidths[i];
  });
  
  yPos -= rowHeight;
  
  // Left Eye (OS) row
  page.drawRectangle({
    x: tableX,
    y: yPos - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: whiteColor,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 0.5,
  });
  
  cellX = tableX + 10;
  const osValues = [
    'OS (Left)',
    data.os.sph,
    data.os.cyl,
    data.os.axis + '°',
    '-',
    data.hasTwoPDs && data.pdOs ? data.pdOs + ' mm' : '-',
  ];
  
  osValues.forEach((val, i) => {
    page.drawText(val, {
      x: cellX,
      y: yPos - 18,
      size: 10,
      font: i === 0 ? helveticaBold : helvetica,
      color: blackColor,
    });
    cellX += colWidths[i];
  });
  
  yPos -= rowHeight;
  
  // Single PD row (if not using two PDs)
  if (!data.hasTwoPDs) {
    page.drawRectangle({
      x: tableX,
      y: yPos - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: lightGrayBg,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });
    
    page.drawText('Pupillary Distance (PD):', {
      x: tableX + 10,
      y: yPos - 18,
      size: 10,
      font: helveticaBold,
      color: blackColor,
    });
    
    page.drawText(data.pd + ' mm', {
      x: tableX + 200,
      y: yPos - 18,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
    
    yPos -= rowHeight;
  }
  
  // === PRISM VALUES (if applicable) ===
  if (data.hasPrism) {
    yPos -= 20;
    
    page.drawText('PRISM VALUES', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });
    
    yPos -= 25;
    
    // Prism table header
    page.drawRectangle({
      x: tableX,
      y: yPos - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: tableHeaderBg,
    });
    
    const prismHeaders = ['EYE', 'HORIZONTAL', 'BASE H', 'VERTICAL', 'BASE V'];
    const prismColWidths = [100, 100, 100, 100, 95];
    headerX = tableX + 10;
    prismHeaders.forEach((header, i) => {
      page.drawText(header, {
        x: headerX,
        y: yPos - 18,
        size: 9,
        font: helveticaBold,
        color: whiteColor,
      });
      headerX += prismColWidths[i];
    });
    
    yPos -= rowHeight;
    
    // OD Prism row
    page.drawRectangle({
      x: tableX,
      y: yPos - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: lightGrayBg,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });
    
    cellX = tableX + 10;
    const odPrismValues = [
      'OD (Right)',
      data.od.prismHorizontal || '-',
      data.od.prismHorizontalBase || '-',
      data.od.prismVertical || '-',
      data.od.prismVerticalBase || '-',
    ];
    
    odPrismValues.forEach((val, i) => {
      page.drawText(val, {
        x: cellX,
        y: yPos - 18,
        size: 10,
        font: i === 0 ? helveticaBold : helvetica,
        color: blackColor,
      });
      cellX += prismColWidths[i];
    });
    
    yPos -= rowHeight;
    
    // OS Prism row
    page.drawRectangle({
      x: tableX,
      y: yPos - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: whiteColor,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });
    
    cellX = tableX + 10;
    const osPrismValues = [
      'OS (Left)',
      data.os.prismHorizontal || '-',
      data.os.prismHorizontalBase || '-',
      data.os.prismVertical || '-',
      data.os.prismVerticalBase || '-',
    ];
    
    osPrismValues.forEach((val, i) => {
      page.drawText(val, {
        x: cellX,
        y: yPos - 18,
        size: 10,
        font: i === 0 ? helveticaBold : helvetica,
        color: blackColor,
      });
      cellX += prismColWidths[i];
    });
    
    yPos -= rowHeight;
  }
  
  // === LENS CONFIGURATION ===
  yPos -= 30;
  
  page.drawText('LENS CONFIGURATION', {
    x: 50,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: primaryColor,
  });
  
  yPos -= 25;
  
  // Configuration grid
  const configItems: [string, string][] = [
    ['Lens Type', formatLensType(data.lensType)],
    ['Lens Index', data.lensIndex],
    ['Coating', formatCoating(data.coating)],
    ['Frame Type', formatFrameType(data.frameType)],
  ];
  
  // Add tint info if applicable
  if (data.lensType === 'TINTED' && data.tintType) {
    if (data.tintType === 'FULL_TINT_CATALOG' && data.tintColor && data.tintShadePercent) {
      configItems.push(['Tint', `${data.tintColor} - ${data.tintShadePercent}%`]);
    } else if (data.tintType === 'GRADIENT' && data.tintRecipe) {
      configItems.push(['Tint', `Gradient ${data.tintRecipe}`]);
    }
  }
  
  // Add photochromic color if applicable
  if (data.lensType === 'PHOTOCHROMIC_SOLIS' && data.photochromicColor) {
    configItems.push(['Photochromic Color', data.photochromicColor]);
  }
  
  // Add polarized color if applicable
  if (data.lensType === 'POLARIZED_NUPOLAR' && data.polarizedColor) {
    configItems.push(['Polarized Color', data.polarizedColor]);
  }
  
  // Draw config items in 2 columns
  const configColWidth = 245;
  let configRow = 0;
  
  configItems.forEach((item, i) => {
    const col = i % 2;
    if (i > 0 && col === 0) configRow++;
    
    const boxX = 50 + col * (configColWidth + 5);
    const boxY = yPos - (configRow * 35);
    
    page.drawRectangle({
      x: boxX,
      y: boxY - 30,
      width: configColWidth,
      height: 30,
      color: lightGrayBg,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });
    
    page.drawText(item[0] + ':', {
      x: boxX + 10,
      y: boxY - 12,
      size: 9,
      font: helveticaBold,
      color: grayColor,
    });
    
    page.drawText(item[1], {
      x: boxX + 10,
      y: boxY - 24,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
  });
  
  yPos -= (Math.ceil(configItems.length / 2) * 35) + 20;
  
  // === PRICE BREAKDOWN (if available) ===
  if (data.lensesPair || data.rxRetailNet || data.totalNet) {
    yPos -= 20;
    
    page.drawText('LENS PRICING', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });
    
    yPos -= 25;
    
    // Price box
    page.drawRectangle({
      x: 50,
      y: yPos - 80,
      width: 250,
      height: 80,
      color: lightGrayBg,
      borderColor: primaryColor,
      borderWidth: 1,
    });
    
    let priceY = yPos - 20;
    
    if (data.lensesPair) {
      page.drawText('Lenses (pair):', {
        x: 60,
        y: priceY,
        size: 10,
        font: helvetica,
        color: grayColor,
      });
      page.drawText(`€${data.lensesPair.toFixed(2)}`, {
        x: 200,
        y: priceY,
        size: 10,
        font: helvetica,
        color: blackColor,
      });
      priceY -= 18;
    }
    
    if (data.edgingFee && data.edgingFee > 0) {
      page.drawText('Edging Fee:', {
        x: 60,
        y: priceY,
        size: 10,
        font: helvetica,
        color: grayColor,
      });
      page.drawText(`€${data.edgingFee.toFixed(2)}`, {
        x: 200,
        y: priceY,
        size: 10,
        font: helvetica,
        color: blackColor,
      });
      priceY -= 18;
    }
    
    // Total
    page.drawLine({
      start: { x: 60, y: priceY + 5 },
      end: { x: 280, y: priceY + 5 },
      thickness: 1,
      color: primaryColor,
    });
    
    priceY -= 10;
    
    const totalPrice = data.rxRetailNet || data.totalNet || 0;
    page.drawText('Rx Add-On Total:', {
      x: 60,
      y: priceY,
      size: 11,
      font: helveticaBold,
      color: blackColor,
    });
    page.drawText(`€${totalPrice.toFixed(2)}`, {
      x: 200,
      y: priceY,
      size: 12,
      font: helveticaBold,
      color: primaryColor,
    });
  }
  
  // === FOOTER ===
  // Shipping address section removed - not needed in prescription PDF
  // Draw footer line
  page.drawLine({
    start: { x: 50, y: 80 },
    end: { x: 545, y: 80 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  
  page.drawText('This prescription document is for reference only.', {
    x: 50,
    y: 60,
    size: 8,
    font: helvetica,
    color: grayColor,
  });
  
  page.drawText('Please consult with your eye care professional for any questions.', {
    x: 50,
    y: 48,
    size: 8,
    font: helvetica,
    color: grayColor,
  });
  
  page.drawText(`Generated by FocusRobin | ${new Date().toLocaleDateString()}`, {
    x: 380,
    y: 48,
    size: 8,
    font: helvetica,
    color: grayColor,
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Extract prescription data from OrderItem's prescriptionData JSON field
 * This function is async to comply with Next.js server action requirements
 * 
 * IMPORTANT: Handles both data formats:
 * - Nested format: { od: { sph, cyl, axis }, os: { sph, cyl, axis } }
 * - Flat format: { odSph, odCyl, odAxis, osSph, osCyl, osAxis } (from cart)
 */
export async function extractPrescriptionFromOrderItem(
  orderItem: {
    productName: string;
    variantName?: string;
    sku?: string;
    prescriptionData: any;
  },
  orderNumber: string,
  orderDate: Date,
  customerName: string,
  customerEmail: string
): Promise<PrescriptionPDFData | null> {
  const prescriptionData = orderItem.prescriptionData;
  
  if (!prescriptionData) {
    console.log(`[PrescriptionPDF] No prescription data for item: ${orderItem.productName}`);
    return null;
  }
  
  // Handle rxValues structure (from cart or prescription flow)
  const rxValues = prescriptionData.rxValues || prescriptionData;
  
  // Extract OD (Right Eye) values - handle both nested and flat formats
  const od = {
    sph: rxValues.od?.sph || rxValues.odSph || '0.00',
    cyl: rxValues.od?.cyl || rxValues.odCyl || '0.00',
    axis: rxValues.od?.axis || rxValues.odAxis || '0',
    prismHorizontal: rxValues.od?.prismHorizontal || rxValues.odPrismHorizontal,
    prismHorizontalBase: rxValues.od?.prismHorizontalBase || rxValues.odPrismHorizontalBase,
    prismVertical: rxValues.od?.prismVertical || rxValues.odPrismVertical,
    prismVerticalBase: rxValues.od?.prismVerticalBase || rxValues.odPrismVerticalBase,
  };
  
  // Extract OS (Left Eye) values - handle both nested and flat formats
  const os = {
    sph: rxValues.os?.sph || rxValues.osSph || '0.00',
    cyl: rxValues.os?.cyl || rxValues.osCyl || '0.00',
    axis: rxValues.os?.axis || rxValues.osAxis || '0',
    prismHorizontal: rxValues.os?.prismHorizontal || rxValues.osPrismHorizontal,
    prismHorizontalBase: rxValues.os?.prismHorizontalBase || rxValues.osPrismHorizontalBase,
    prismVertical: rxValues.os?.prismVertical || rxValues.osPrismVertical,
    prismVerticalBase: rxValues.os?.prismVerticalBase || rxValues.osPrismVerticalBase,
  };
  
  // Extract PD values
  const pd = rxValues.pd || prescriptionData.pd || '62';
  const pdOd = rxValues.pdOd || prescriptionData.pdOd;
  const pdOs = rxValues.pdOs || prescriptionData.pdOs;
  const hasTwoPDs = rxValues.hasTwoPDs || prescriptionData.hasTwoPDs || false;
  
  // Extract prism flag
  const hasPrism = rxValues.hasPrism || prescriptionData.hasPrism || 
    !!(od.prismHorizontal && od.prismHorizontal !== '0.00') ||
    !!(od.prismVertical && od.prismVertical !== '0.00') ||
    !!(os.prismHorizontal && os.prismHorizontal !== '0.00') ||
    !!(os.prismVertical && os.prismVertical !== '0.00');
  
  // Build product name with variant info for better tracking
  let fullProductName = orderItem.productName;
  if (orderItem.variantName) {
    fullProductName += ` (${orderItem.variantName})`;
  }
  if (orderItem.sku) {
    fullProductName += ` - SKU: ${orderItem.sku}`;
  }
  
  console.log(`[PrescriptionPDF] Extracted prescription data for: ${fullProductName}`, {
    od: { sph: od.sph, cyl: od.cyl, axis: od.axis },
    os: { sph: os.sph, cyl: os.cyl, axis: os.axis },
    pd,
    hasTwoPDs,
    hasPrism,
    hasRxConfig: !!prescriptionData.rxConfig,
  });
  
  return {
    orderNumber,
    orderDate,
    customerName,
    customerEmail,
    productName: fullProductName,
    od,
    os,
    pd,
    pdOd,
    pdOs,
    hasTwoPDs,
    hasPrism,
    lensType: prescriptionData.rxConfig?.lensType || 'CLEAR',
    lensIndex: prescriptionData.rxConfig?.lensIndex || '1.56',
    coating: prescriptionData.rxConfig?.coating || 'UC',
    tintType: prescriptionData.rxConfig?.tintType,
    tintColor: prescriptionData.rxConfig?.tintColor,
    tintShadePercent: prescriptionData.rxConfig?.tintShadePercent,
    tintRecipe: prescriptionData.rxConfig?.tintRecipe,
    photochromicColor: prescriptionData.rxConfig?.photochromicColor,
    polarizedColor: prescriptionData.rxConfig?.polarizedColor,
    frameType: prescriptionData.rxConfig?.frameType || 'FULL_FRAME',
    lensesPair: prescriptionData.rxPriceBreakdown?.lensesPair,
    edgingFee: prescriptionData.rxPriceBreakdown?.edgingFee,
    rxRetailNet: prescriptionData.rxPriceBreakdown?.rxRetailNet,
    totalNet: prescriptionData.rxPriceBreakdown?.totalNet,
    prescriptionImageUrl: rxValues.prescriptionImageUrl || prescriptionData.prescriptionImageUrl,
  };
}

