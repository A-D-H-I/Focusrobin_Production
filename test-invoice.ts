import { getInvoiceDataFromOrder, generateInvoicePDF } from './src/lib/invoice';
import { prisma } from './src/lib/prisma';
import { extractPrescriptionFromOrderItem, hasValidPrescriptionValues, generatePrescriptionPDF } from './src/lib/prescription-pdf';

async function main() {
  const orderId = 'cmo8nng0o002r115pb4gzq6tm';
  console.log(`Testing invoice generation for order: ${orderId}`);
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        User: true,
      },
    });

    if (!order) {
      console.error('Order not found!');
      return;
    }

    console.log('Order found:', order.orderNumber);

    const data = await getInvoiceDataFromOrder(orderId);
    if (!data) {
      console.error('Failed to get invoice data from order');
      return;
    }
    console.log('Invoice data fetched successfully.');
    
    console.log('Generating main invoice PDF...');
    const pdfBytes = await generateInvoicePDF(data);
    console.log('Main PDF generated successfully, length:', pdfBytes.length);

    console.log('Checking for prescriptions...');
    const prescriptionItems = order.items.filter(item => 
      item.prescriptionData && hasValidPrescriptionValues(item.prescriptionData)
    );
    console.log('Prescription items found:', prescriptionItems.length);

    for (const item of prescriptionItems) {
      console.log(`Processing prescription for: ${item.productName}`);
      const prescriptionPdfData = await extractPrescriptionFromOrderItem(
        {
          productName: item.productName,
          prescriptionData: item.prescriptionData,
        },
        order.orderNumber,
        order.createdAt,
        order.User?.name || order.shippingName,
        order.User?.email || 'customer@example.com'
      );
      
      if (prescriptionPdfData) {
        console.log(`Generating prescription PDF for: ${item.productName}`);
        const prescriptionPdfBuffer = await generatePrescriptionPDF(prescriptionPdfData);
        console.log('Prescription PDF generated successfully, length:', prescriptionPdfBuffer.length);
      }
    }

    console.log('All PDF generations passed!');

  } catch (error: any) {
    console.error('Error during generation:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
