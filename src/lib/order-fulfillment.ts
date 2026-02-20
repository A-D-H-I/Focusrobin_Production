import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { getFriendlyLensDescription } from '@/lib/lensPricing';
import { uploadInvoiceToDropbox, getOrCreateInvoicesFolder } from '@/lib/dropbox';
import { sendOrderConfirmationWithDocuments } from '@/lib/invoice-email';
import { generatePrescriptionPDF, extractPrescriptionFromOrderItem, hasValidPrescriptionValues, PrescriptionPDFData } from '@/lib/prescription-pdf';
import { getInvoiceDataFromOrder, InvoiceData } from '@/lib/invoice';

/**
 * Generate combined PDF with Payment Receipt + Invoice using pdf-lib
 * Same as the one used in admin panel
 */
export async function generateCombinedPDF(invoiceData: InvoiceData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Colors matching the template
    const darkBlue = rgb(0.1, 0.2, 0.4);
    const yellow = rgb(1.0, 0.84, 0.0);
    const blackColor = rgb(0, 0, 0);
    const whiteColor = rgb(1.0, 1.0, 1.0);
    const lightGray = rgb(0.9, 0.9, 0.9);

    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Header: Dark blue rounded rectangle
    // Logo area - load and embed actual FocusRobin logo (no background)
    const logoX = 30;
    const logoY = height - 50;

    try {
        const logoPath = join(process.cwd(), 'public', 'logo', 'Horizontal Primary dark (Color).svg');
        const svgBuffer = readFileSync(logoPath);
        // Convert SVG to PNG (keep original colors, no greyscale or tint)
        const pngBuffer = await sharp(svgBuffer)
            .resize(280, null, { fit: 'contain' }) // Larger size for bigger logo
            .png()
            .toBuffer();
        const logoImage = await pdfDoc.embedPng(pngBuffer);
        const logoDims = logoImage.scale(0.75); // Larger scale for bigger logo
        // Draw the logo (original colors, no background)
        page.drawImage(logoImage, {
            x: logoX,
            y: logoY - 20,
            width: logoDims.width,
            height: logoDims.height,
        });
    } catch (error) {
        console.warn('[Invoice] Could not load logo, using text fallback:', error);
        page.drawText('FOCUSROBIN', {
            x: logoX + 10,
            y: logoY - 5,
            size: 18,
            font: helveticaBold,
            color: blackColor,
        });
    }

    // INVOICE text on top right
    page.drawText('INVOICE', {
        x: 400,
        y: height - 50,
        size: 36,
        font: helveticaBold,
        color: blackColor,
    });

    // Invoice Details
    let yPos = height - 150;
    const invoiceDateStr = invoiceData.orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    page.drawText('INVOICE #', {
        x: 50,
        y: yPos,
        size: 11,
        font: helveticaBold,
        color: blackColor,
    });
    page.drawText(invoiceData.orderNumber, {
        x: 150,
        y: yPos,
        size: 11,
        font: helvetica,
        color: blackColor,
    });

    yPos -= 20;
    page.drawText('INVOICE DATE :', {
        x: 50,
        y: yPos,
        size: 11,
        font: helvetica,
        color: blackColor,
    });
    page.drawText(invoiceDateStr, {
        x: 180,
        y: yPos,
        size: 11,
        font: helvetica,
        color: blackColor,
    });

    // BILL TO section
    let billToY = height - 150;
    page.drawText('BILL TO', {
        x: 400,
        y: billToY,
        size: 12,
        font: helveticaBold,
        color: blackColor,
    });

    billToY -= 20;
    const billingAddress = [
        invoiceData.customerName,
        invoiceData.shippingAddress.addressLine1,
        invoiceData.shippingAddress.addressLine2,
        `${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.postalCode}`,
        invoiceData.shippingAddress.state,
        invoiceData.shippingAddress.country,
    ].filter(Boolean);

    billingAddress.forEach((line) => {
        page.drawText(line!, {
            x: 400,
            y: billToY,
            size: 10,
            font: helvetica,
            color: blackColor,
        });
        billToY -= 15;
    });

    // Table Header: Yellow bar
    yPos = height - 320;
    const tableHeaderY = yPos;
    const tableHeaderHeight = 30;

    page.drawRectangle({
        x: 50,
        y: tableHeaderY - tableHeaderHeight,
        width: width - 100,
        height: tableHeaderHeight,
        color: yellow,
    });

    const headerTextY = tableHeaderY - 20;
    page.drawText('NO', { x: 60, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });
    page.drawText('DESCRIPTION', { x: 120, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });
    page.drawText('PRICE', { x: 350, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });
    page.drawText('QTY', { x: 420, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });
    page.drawText('TOTAL', { x: 480, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });

    // Items rows
    yPos = tableHeaderY - tableHeaderHeight - 25;
    invoiceData.items.forEach((item: any, index: number) => {
        const isEven = index % 2 === 0;
        const rowColor = isEven ? lightGray : whiteColor;
        const rowHeight = 35;

        page.drawRectangle({
            x: 50,
            y: yPos - rowHeight,
            width: width - 100,
            height: rowHeight,
            color: rowColor,
        });

        page.drawText((index + 1).toString(), { x: 60, y: yPos - 20, size: 10, font: helvetica, color: blackColor });

        const colorText = item.variant ? ` - ${item.variant}` : '';
        const skuText = item.sku ? ` (${item.sku})` : '';

        // Line 1: Product Name + Variant + SKU
        const mainDescription = `${item.name}${colorText}${skuText}`;
        const displayMain = mainDescription.length > 45 ? mainDescription.substring(0, 45) + '...' : mainDescription;

        page.drawText(displayMain, {
            x: 120,
            y: yPos - 14,
            size: 10,
            font: helveticaBold,
            color: blackColor
        });

        // Line 2: Lens Info (if applicable)
        if (item.hasPrescription && item.prescriptionData?.rxConfig?.lensBundle) {
            const lensDesc = getFriendlyLensDescription(item.prescriptionData.rxConfig);
            if (lensDesc) {
                // Prepend "Prescription: "
                const fullLensDesc = `Prescription: ${lensDesc}`;
                // Shorten lens desc if needed
                const displayLens = fullLensDesc.length > 65 ? fullLensDesc.substring(0, 65) + '...' : fullLensDesc;
                page.drawText(displayLens, {
                    x: 120,
                    y: yPos - 26,
                    size: 9, // Smaller font for detail
                    font: helvetica,
                    color: rgb(0.3, 0.3, 0.3), // Dark gray
                });
            }
        }

        page.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, { x: 350, y: yPos - 20, size: 10, font: helvetica, color: blackColor });
        page.drawText(item.quantity.toString(), { x: 420, y: yPos - 20, size: 10, font: helvetica, color: blackColor });
        page.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, { x: 480, y: yPos - 20, size: 10, font: helvetica, color: blackColor });

        yPos -= rowHeight;
    });

    // Totals Section
    yPos -= 30;
    const originalSubtotal = (invoiceData.subtotal || 0) + (invoiceData.shipping || 0);
    const totalDiscount = (invoiceData.discount || 0) + (invoiceData.walletAmount || 0);
    const finalTotal = invoiceData.total;

    page.drawText('SUB-TOTAL', { x: 400, y: yPos, size: 11, font: helvetica, color: blackColor });
    page.drawText(`${invoiceData.currency} ${originalSubtotal.toFixed(2)}`, { x: 480, y: yPos, size: 11, font: helvetica, color: blackColor });

    // DISCOUNT - Show discount amount if there's any discount
    if (totalDiscount > 0) {
        yPos -= 25; // Add spacing between subtotal and discount
        page.drawText('DISCOUNT', { x: 400, y: yPos, size: 11, font: helvetica, color: blackColor });
        page.drawText(`-${invoiceData.currency} ${totalDiscount.toFixed(2)}`, { x: 480, y: yPos, size: 11, font: helvetica, color: blackColor });
    }

    // Total Due bar
    yPos -= 30;
    const totalBarHeight = 35;
    page.drawRectangle({
        x: 400,
        y: yPos - totalBarHeight,
        width: 145,
        height: totalBarHeight,
        color: yellow,
    });

    page.drawText('Total', { x: 410, y: yPos - 22, size: 12, font: helveticaBold, color: blackColor });
    page.drawText(`${invoiceData.currency} ${finalTotal.toFixed(2)}`, { x: 480, y: yPos - 22, size: 12, font: helveticaBold, color: blackColor });

    // Payment Method
    yPos = yPos - totalBarHeight - 40;
    page.drawText('PAYMENT METHOD', { x: 50, y: yPos, size: 11, font: helveticaBold, color: blackColor });
    yPos -= 20;
    page.drawText('Online Payment', { x: 50, y: yPos, size: 10, font: helvetica, color: blackColor });

    // Footer
    page.drawText('THANK YOU FOR YOUR PURCHASE', {
        x: width / 2 - 120,
        y: 50,
        size: 14,
        font: helveticaBold,
        color: blackColor,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

/**
 * Process invoice generation, email sending, and Dropbox upload
 * This runs asynchronously to not block the webhook response
 */
export async function processSuccessfulOrder(orderId: string, orderNumber: string) {
    console.log(`[Order Fulfillment] Starting invoice processing for order ${orderNumber}...`);

    try {
        // Get order with items (including prescription data)
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                User: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!order) {
            console.error(`[Order Fulfillment] Order not found: ${orderId}`);
            return;
        }

        // Get invoice data
        console.log(`[Order Fulfillment] Fetching invoice data for order ${orderId}...`);
        const invoiceData = await getInvoiceDataFromOrder(orderId);
        if (!invoiceData) {
            console.error(`[Order Fulfillment] Could not get invoice data for order ${orderId}`);
            return;
        }
        console.log(`[Order Fulfillment] Invoice data retrieved for customer: ${invoiceData.customerEmail}`);

        // Extract prescription data from order items
        // IMPORTANT: Only generate prescription PDF for items with ACTUAL prescription values
        // Not just items that have prescriptionData field (which might be empty or just have pricing)
        const prescriptionDataList: PrescriptionPDFData[] = [];
        for (const item of order.items) {
            // Use the validation helper to check if this item has actual prescription values
            console.log(`[Order Fulfillment] Checking item "${item.productName}" (SKU: ${item.sku}, ID: ${item.id}):`, {
                hasPrescriptionData: !!item.prescriptionData,
                prescriptionDataKeys: item.prescriptionData ? Object.keys(item.prescriptionData as object) : [],
            });

            if (item.prescriptionData && hasValidPrescriptionValues(item.prescriptionData)) {
                console.log(`[Order Fulfillment] Item "${item.productName}" (SKU: ${item.sku}) has valid prescription data, generating PDF...`);
                const prescriptionPdfData = await extractPrescriptionFromOrderItem(
                    {
                        productName: item.productName,
                        variantName: item.variantName,
                        sku: item.sku,
                        prescriptionData: item.prescriptionData,
                    },
                    order.orderNumber,
                    order.createdAt,
                    order.User?.name || order.shippingName,
                    order.User?.email || 'customer@example.com'
                );

                if (prescriptionPdfData) {
                    prescriptionDataList.push(prescriptionPdfData);
                    console.log(`[Order Fulfillment] Successfully extracted prescription data for: ${item.productName} (SKU: ${item.sku})`);
                }
            } else if (item.prescriptionData) {
                console.log(`[Order Fulfillment] Item "${item.productName}" (SKU: ${item.sku}) has prescriptionData but NO valid prescription values - skipping PDF`);
                console.log(`[Order Fulfillment] Prescription data structure:`, JSON.stringify(item.prescriptionData, null, 2));
            } else {
                console.log(`[Order Fulfillment] Item "${item.productName}" (SKU: ${item.sku}) is a non-prescription item`);
            }
        }

        console.log(`[Order Fulfillment] Total prescription items found: ${prescriptionDataList.length}`);

        // Generate combined PDF (Payment Receipt + Invoice)
        console.log(`[Order Fulfillment] Generating combined PDF (Payment Receipt + Invoice)...`);
        let pdfBuffer = await generateCombinedPDF(invoiceData);
        console.log(`[Order Fulfillment] Combined PDF generated successfully (${pdfBuffer.length} bytes)`);

        // If there are prescription items, generate and append prescription PDFs
        if (prescriptionDataList.length > 0) {
            console.log(`[Order Fulfillment] Appending ${prescriptionDataList.length} prescription PDF(s) to combined document...`);

            // Load the combined PDF
            const mergedPdf = await PDFDocument.load(pdfBuffer);

            // Generate and append prescription PDFs
            for (const prescriptionData of prescriptionDataList) {
                console.log(`[Order Fulfillment] Generating prescription PDF for: ${prescriptionData.productName}`);
                const prescriptionPdfBuffer = await generatePrescriptionPDF(prescriptionData);
                const prescriptionPdf = await PDFDocument.load(prescriptionPdfBuffer);
                const pages = await mergedPdf.copyPages(prescriptionPdf, prescriptionPdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }

            // Save the merged PDF
            const mergedPdfBytes = await mergedPdf.save();
            pdfBuffer = Buffer.from(mergedPdfBytes);
            console.log(`[Order Fulfillment] Merged PDF with prescriptions generated (${pdfBuffer.length} bytes)`);
        }

        // Upload to Dropbox
        console.log(`[Order Fulfillment] Attempting Dropbox upload...`);
        let dropboxResult = null;
        let dropboxError: any = null;
        try {
            // Check if Dropbox is configured
            if (!process.env.DROPBOX_ACCESS_TOKEN) {
                console.warn(`[Order Fulfillment] ⚠️ DROPBOX_ACCESS_TOKEN not set - skipping Dropbox upload`);
                console.warn(`[Order Fulfillment] To enable Dropbox upload, set DROPBOX_ACCESS_TOKEN in your environment variables`);
                console.warn(`[Order Fulfillment] See DROPBOX_SETUP.md for instructions`);
                dropboxError = new Error('DROPBOX_ACCESS_TOKEN not configured');
            } else {
                console.log(`[Order Fulfillment] Dropbox token found, proceeding with upload...`);
                const folderPath = await getOrCreateInvoicesFolder();
                if (!folderPath) {
                    console.error(`[Order Fulfillment] ✗ Failed to get or create Dropbox folder`);
                    dropboxError = new Error('Failed to get or create Dropbox folder');
                } else {
                    const fileName = `FocusRobin-Order-${invoiceData.orderNumber}-Documents-${new Date().toISOString().split('T')[0]}.pdf`;
                    dropboxResult = await uploadInvoiceToDropbox(pdfBuffer, fileName, folderPath);

                    if (dropboxResult) {
                        console.log(`[Order Fulfillment] ✓ Uploaded to Dropbox: ${dropboxResult.sharedLink}`);
                        console.log(`[Order Fulfillment] ✓ File ID: ${dropboxResult.fileId}`);
                    } else {
                        console.error(`[Order Fulfillment] ✗ Dropbox upload returned null - upload may have failed`);
                        dropboxError = new Error('Dropbox upload returned null');
                    }
                }
            }
        } catch (err: any) {
            dropboxError = err;
            console.error(`[Order Fulfillment] ✗ Dropbox upload error:`, err.message);
            console.error(`[Order Fulfillment] ✗ Dropbox error stack:`, err.stack);
            if (err.status) {
                console.error(`[Order Fulfillment] ✗ Dropbox error status: ${err.status}`);
            }
            if (err.error) {
                console.error(`[Order Fulfillment] ✗ Dropbox error details:`, JSON.stringify(err.error, null, 2));
            }
            // Log helpful troubleshooting information
            if (err.message?.includes('DROPBOX_ACCESS_TOKEN')) {
                console.error(`[Order Fulfillment] 💡 Troubleshooting: Check your .env.local file and ensure DROPBOX_ACCESS_TOKEN is set`);
                console.error(`[Order Fulfillment] 💡 Run: node scripts/test-dropbox.js to test your Dropbox configuration`);
            }
        }

        // Send email with documents (including prescription PDFs if any)
        console.log(`[Order Fulfillment] Sending order confirmation email with documents...`);
        try {
            const emailResult = await sendOrderConfirmationWithDocuments(invoiceData, prescriptionDataList.length > 0 ? prescriptionDataList : undefined);
            if (emailResult.success) {
                console.log(`[Order Fulfillment] ✓ Order confirmation email sent successfully`);
                if (prescriptionDataList.length > 0) {
                    console.log(`[Order Fulfillment] ✓ Email includes ${prescriptionDataList.length} prescription PDF(s)`);
                }
            } else {
                console.error(`[Order Fulfillment] ✗ Order confirmation email failed:`, emailResult.error);
            }
        } catch (emailError: any) {
            console.error(`[Order Fulfillment] ✗ Order confirmation email error:`, emailError.message);
        }

        // Log final status
        if (dropboxError) {
            console.error(`[Order Fulfillment] ⚠️ Invoice processing completed for order ${orderNumber}, but Dropbox upload failed`);
            console.error(`[Order Fulfillment] ⚠️ Error: ${dropboxError.message}`);
        } else if (dropboxResult) {
            console.log(`[Order Fulfillment] ✓ Invoice processing completed successfully for order ${orderNumber}`);
            console.log(`[Order Fulfillment] ✓ PDF uploaded to Dropbox at: ${dropboxResult.sharedLink}`);
        } else {
            console.warn(`[Order Fulfillment] ⚠️ Invoice processing completed for order ${orderNumber}, but Dropbox upload was skipped`);
        }
    } catch (error: any) {
        console.error(`[Order Fulfillment] ✗ Invoice processing failed for order ${orderNumber}:`, error.message);
        console.error(`[Order Fulfillment] ✗ Error stack:`, error.stack);
    }
}

/**
 * Finalize order fulfillment:
 * 1. Update stock
 * 2. Clear cart
 * 3. Calculate and award cashback
 * 4. Generate invoice and send email
 */
/**
 * Deducts wallet balance for an order if used.
 * Optimized to be idempotent (safe to call multiple times).
 */
async function deductWalletBalance(userId: string, amount: number, orderId: string, orderNumber: string) {
    if (amount <= 0) return;

    try {
        console.log(`[Order Fulfillment] Processing wallet deduction of €${amount} for order ${orderNumber}...`);

        const wallet = await prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            console.error(`[Order Fulfillment] Wallet not found for user ${userId}`);
            return;
        }

        // Check if transaction already exists (idempotency)
        const existingTx = await prisma.walletTransaction.findFirst({
            where: {
                walletId: wallet.id,
                description: {
                    contains: `Order ${orderNumber}`,
                },
                type: 'DEBIT',
                amount: amount // Ensure amount matches
            }
        });

        if (existingTx) {
            console.log(`[Order Fulfillment] Wallet deduction for order ${orderNumber} already processed. Skipping.`);
            return;
        }

        // Deduct from wallet
        // Allow negative balance if race condition occurred (better than failing a paid order)
        await prisma.wallet.update({
            where: { userId },
            data: {
                balance: {
                    decrement: amount,
                },
            },
        });

        // Create transaction record
        await prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: amount,
                type: 'DEBIT',
                description: `Order ${orderNumber} - Payment`,
            },
        });

        console.log(`[Order Fulfillment] ✓ Deducted €${amount} from wallet for order ${orderNumber}`);

    } catch (error) {
        console.error(`[Order Fulfillment] Failed to deduct wallet balance for order ${orderNumber}:`, error);
        // We log but don't throw, as the order is already paid. 
        // Admin intervention might be needed if this fails.
    }
}

/**
 * Finalize order fulfillment:
 * 1. Deduct wallet balance (NEW)
 * 2. Update stock
 * 3. Clear cart
 * 4. Calculate and award cashback
 * 5. Generate invoice and send email
 */
export async function finalizeOrder(orderId: string) {
    console.log(`[Order Fulfillment] Finalizing order ${orderId}...`);
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        Product: {
                            select: {
                                cashbackAmount: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            console.error(`[Order Fulfillment] Order not found for finalization: ${orderId}`);
            return;
        }

        // 1. Deduct wallet balance (moved from checkout)
        if (order.userId && order.walletAmountUsed && Number(order.walletAmountUsed) > 0) {
            await deductWalletBalance(order.userId, Number(order.walletAmountUsed), order.id, order.orderNumber);
        }

        // 2. Update stock for each item
        console.log(`[Order Fulfillment] Updating stock for order ${order.orderNumber}...`);
        for (const item of order.items) {
            await prisma.productVariant.update({
                where: { id: item.variantId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        // 3. Clear the user's cart if userId exists
        if (order.userId) {
            console.log(`[Order Fulfillment] Clearing cart for user ${order.userId}...`);
            await prisma.cartItem.deleteMany({
                where: {
                    Cart: {
                        userId: order.userId,
                    },
                },
            });
        }

        // 4. Add cashback to user's wallet if applicable
        if (order.userId) {
            let totalCashback = 0;
            // Add product cashback
            for (const item of order.items) {
                if (item.Product?.cashbackAmount) {
                    totalCashback += Number(item.Product.cashbackAmount) * item.quantity;
                }
            }
            // Add promo code cashback
            if (order.promoCashback) {
                totalCashback += Number(order.promoCashback);
            }

            if (totalCashback > 0) {
                console.log(`[Order Fulfillment] Adding ${totalCashback} EUR cashback to wallet...`);
                // Get or create wallet
                let wallet = await prisma.wallet.findUnique({
                    where: { userId: order.userId },
                });

                if (!wallet) {
                    wallet = await prisma.wallet.create({
                        data: {
                            userId: order.userId,
                            balance: 0,
                        },
                    });
                }

                // Add cashback
                await prisma.wallet.update({
                    where: { userId: order.userId },
                    data: {
                        balance: {
                            increment: totalCashback,
                        },
                    },
                });

                // Create transaction record uses "Cashback from order..." description
                // Check if transaction already exists to avoid duplicates (idempotency)
                const existingTx = await prisma.walletTransaction.findFirst({
                    where: {
                        walletId: wallet.id,
                        description: `Cashback from order ${order.orderNumber}`,
                        type: 'CREDIT'
                    }
                });

                if (!existingTx) {
                    await prisma.walletTransaction.create({
                        data: {
                            walletId: wallet.id,
                            amount: totalCashback,
                            type: 'CREDIT',
                            description: `Cashback from order ${order.orderNumber}`,
                        },
                    });
                    console.log(`[Order Fulfillment] Added ${totalCashback} EUR cashback to wallet`);
                } else {
                    console.log(`[Order Fulfillment] Cashback transaction already exists, skipping creation`);
                }
            }
        }

        // 5. Generate and send invoices (async)
        // This runs in the background
        processSuccessfulOrder(orderId, order.orderNumber).catch((err) => {
            console.error(`[Order Fulfillment] Invoice processing failed:`, err);
        });

    } catch (error: any) {
        console.error(`[Order Fulfillment] Error finalizing order ${orderId}:`, error);
    }
}
