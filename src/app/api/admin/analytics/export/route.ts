import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

// Use Node.js runtime
export const runtime = 'nodejs';

// Helper function to determine if an order item is prescription glasses
function isPrescriptionGlasses(item: any): boolean {
  if (item.prescriptionData) {
    return true;
  }
  if (item.Product?.slug && item.Product.slug.includes('prescription-glasses')) {
    return true;
  }
  return false;
}

// Helper function to escape CSV values
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateFilter: { gte?: Date; lte?: Date } = {};
    const now = new Date();

    if (startDate && endDate) {
      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Please use YYYY-MM-DD format.' },
          { status: 400 }
        );
      }
      
      if (start > end) {
        return NextResponse.json(
          { error: 'Start date must be before or equal to end date.' },
          { status: 400 }
        );
      }
      
      // Use startOfDay for start date and endOfDay for end date to capture all orders
      dateFilter = {
        gte: startOfDay(start),
        lte: endOfDay(end),
      };
    } else {
      switch (period) {
        case '7d':
          dateFilter = { gte: subDays(now, 7) };
          break;
        case '30d':
          dateFilter = { gte: subDays(now, 30) };
          break;
        case '90d':
          dateFilter = { gte: subDays(now, 90) };
          break;
        case '1y':
          dateFilter = { gte: subMonths(now, 12) };
          break;
        case 'all':
          // No date filter
          break;
        default:
          dateFilter = { gte: subDays(now, 30) };
      }
    }

    // Fetch orders with completed payment status
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: 'COMPLETED',
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      include: {
        items: {
          include: {
            Product: {
              select: {
                id: true,
                slug: true,
                gender: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Prepare CSV data
    const csvRows: string[] = [];
    
    // CSV Header
    csvRows.push([
      'Order Number',
      'Order Date',
      'Customer Email',
      'Customer Name',
      'Order Status',
      'Payment Status',
      'Payment Method',
      'Subtotal (EUR)',
      'Shipping (EUR)',
      'Promo Discount (EUR)',
      'Wallet Used (EUR)',
      'Total (EUR)',
      'Currency',
      'Shipping Country',
      'Shipping City',
      'Item Product Name',
      'Item Variant Name',
      'Item SKU',
      'Item Quantity',
      'Item Price (EUR)',
      'Item Total (EUR)',
      'Product Type',
      'Product Category',
      'Has Prescription',
    ].join(','));

    // CSV Rows - One row per order item
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const isPrescription = isPrescriptionGlasses(item);
        const productType = isPrescription ? 'Prescription Glasses' : 'Sunglasses';
        const categories = item.Product?.gender || ['Uncategorized'];
        const category = categories.join(', ');

        csvRows.push([
          escapeCSV(order.orderNumber),
          escapeCSV(order.createdAt.toISOString().split('T')[0]),
          escapeCSV(order.User?.email || ''),
          escapeCSV(order.User?.name || ''),
          escapeCSV(order.status),
          escapeCSV(order.paymentStatus),
          escapeCSV(order.paymentMethod),
          escapeCSV(Number(order.subtotal).toFixed(2)),
          escapeCSV(Number(order.shipping).toFixed(2)),
          escapeCSV(Number(order.promoDiscount).toFixed(2)),
          escapeCSV(Number(order.walletAmountUsed).toFixed(2)),
          escapeCSV(Number(order.total).toFixed(2)),
          escapeCSV(order.currency),
          escapeCSV(order.shippingCountry),
          escapeCSV(order.shippingCity),
          escapeCSV(item.productName),
          escapeCSV(item.variantName),
          escapeCSV(item.sku),
          escapeCSV(item.quantity),
          escapeCSV(Number(item.price).toFixed(2)),
          escapeCSV(Number(item.total).toFixed(2)),
          escapeCSV(productType),
          escapeCSV(category),
          escapeCSV(isPrescription ? 'Yes' : 'No'),
        ].join(','));
      });
    });

    const csvContent = csvRows.join('\n');
    
    // Generate filename based on date range or period
    let filename = 'sales-data';
    if (startDate && endDate) {
      filename = `sales-data-${startDate}_to_${endDate}.csv`;
    } else {
      filename = `sales-data-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('CSV Export error:', error);
    const errorMessage = error?.message || 'Failed to export CSV data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

