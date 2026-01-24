import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

// Use Node.js runtime (not Edge) to avoid crypto module issues
export const runtime = 'nodejs';

// Helper function to determine if an order item is prescription glasses
function isPrescriptionGlasses(item: any): boolean {
  // Check if item has prescription data
  if (item.prescriptionData) {
    return true;
  }
  // Check if product slug contains "prescription-glasses"
  if (item.Product?.slug && item.Product.slug.includes('prescription-glasses')) {
    return true;
  }
  return false;
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
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y, all
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format'); // 'json' or 'csv'

    // Calculate date range
    let dateFilter: { gte?: Date; lte?: Date } = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalItems = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    // Product type classification (Sunglasses vs Prescription Glasses)
    let sunglassesRevenue = 0;
    let prescriptionRevenue = 0;
    let sunglassesOrders = 0;
    let prescriptionOrders = 0;
    let sunglassesItems = 0;
    let prescriptionItems = 0;

    orders.forEach((order) => {
      const hasPrescriptionItems = order.items.some((item) => isPrescriptionGlasses(item));
      
      if (hasPrescriptionItems) {
        prescriptionOrders += 1;
        prescriptionRevenue += Number(order.total);
        order.items.forEach((item) => {
          if (isPrescriptionGlasses(item)) {
            prescriptionItems += item.quantity;
          } else {
            sunglassesItems += item.quantity;
          }
        });
      } else {
        sunglassesOrders += 1;
        sunglassesRevenue += Number(order.total);
        order.items.forEach((item) => {
          sunglassesItems += item.quantity;
        });
      }
    });

    // Revenue by day (last 30 days) with product type breakdown
    const revenueByDay: { date: string; revenue: number; orders: number; sunglasses: number; prescription: number }[] = [];
    const daysToShow = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayOrders = orders.filter(
        (order) => order.createdAt >= dayStart && order.createdAt <= dayEnd
      );
      
      let daySunglassesRevenue = 0;
      let dayPrescriptionRevenue = 0;
      
      dayOrders.forEach((order) => {
        const hasPrescriptionItems = order.items.some((item) => isPrescriptionGlasses(item));
        if (hasPrescriptionItems) {
          dayPrescriptionRevenue += Number(order.total);
        } else {
          daySunglassesRevenue += Number(order.total);
        }
      });
      
      revenueByDay.push({
        date: date.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
        orders: dayOrders.length,
        sunglasses: daySunglassesRevenue,
        prescription: dayPrescriptionRevenue,
      });
    }

    // Top products
    const productSales: Record<string, { name: string; quantity: number; revenue: number; orders: number }> = {};
    
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productName;
        if (!productSales[key]) {
          productSales[key] = {
            name: key,
            quantity: 0,
            revenue: 0,
            orders: 0,
          };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += Number(item.total);
        productSales[key].orders += 1;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales by category (gender)
    const categorySales: Record<string, { name: string; revenue: number; orders: number; quantity: number }> = {};
    
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categories = item.Product?.gender || ['Uncategorized'];
        categories.forEach((category) => {
          if (!categorySales[category]) {
            categorySales[category] = {
              name: category,
              revenue: 0,
              orders: 0,
              quantity: 0,
            };
          }
          categorySales[category].revenue += Number(item.total);
          categorySales[category].quantity += item.quantity;
          categorySales[category].orders += 1;
        });
      });
    });

    const salesByCategory = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);

    // Payment method breakdown
    const paymentMethods: Record<string, { method: string; count: number; revenue: number }> = {};
    
    orders.forEach((order) => {
      const method = order.paymentMethod || 'unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          method,
          count: 0,
          revenue: 0,
        };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].revenue += Number(order.total);
    });

    const paymentMethodBreakdown = Object.values(paymentMethods).sort((a, b) => b.revenue - a.revenue);

    // Geographic breakdown (by country)
    const countrySales: Record<string, { country: string; revenue: number; orders: number }> = {};
    
    orders.forEach((order) => {
      const country = order.shippingCountry || 'Unknown';
      if (!countrySales[country]) {
        countrySales[country] = {
          country,
          revenue: 0,
          orders: 0,
        };
      }
      countrySales[country].revenue += Number(order.total);
      countrySales[country].orders += 1;
    });

    const salesByCountry = Object.values(countrySales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Revenue by month (for longer periods)
    const revenueByMonth: { month: string; revenue: number; orders: number }[] = [];
    if (period === '1y' || period === 'all') {
      const monthsToShow = period === 'all' ? 12 : 12;
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthOrders = orders.filter(
          (order) => order.createdAt >= monthStart && order.createdAt <= monthEnd
        );
        
        revenueByMonth.push({
          month: monthDate.toISOString().slice(0, 7), // YYYY-MM
          revenue: monthOrders.reduce((sum, order) => sum + Number(order.total), 0),
          orders: monthOrders.length,
        });
      }
    }

    // Customer metrics
    const uniqueCustomers = new Set(orders.map((order) => order.userId)).size;
    const repeatCustomers = orders.filter((order, index, self) => 
      self.findIndex((o) => o.userId === order.userId) !== index
    ).length;

    // Growth metrics (compare with previous period)
    const previousPeriodStart = period === '7d' 
      ? subDays(now, 14) 
      : period === '30d'
      ? subDays(now, 60)
      : period === '90d'
      ? subDays(now, 180)
      : subMonths(now, 24);
    
    const previousPeriodEnd = period === '7d'
      ? subDays(now, 7)
      : period === '30d'
      ? subDays(now, 30)
      : period === '90d'
      ? subDays(now, 90)
      : subMonths(now, 12);

    const previousOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
    });

    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const previousOrderCount = previousOrders.length;
    
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const ordersGrowth = previousOrderCount > 0
      ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          totalItems,
          uniqueCustomers,
          repeatCustomers,
          revenueGrowth,
          ordersGrowth,
          // Product type breakdown
          sunglassesRevenue,
          prescriptionRevenue,
          sunglassesOrders,
          prescriptionOrders,
          sunglassesItems,
          prescriptionItems,
        },
        revenueByDay,
        revenueByMonth: revenueByMonth.length > 0 ? revenueByMonth : undefined,
        topProducts,
        salesByCategory,
        paymentMethodBreakdown,
        salesByCountry,
        productTypeBreakdown: [
          {
            type: 'Sunglasses',
            revenue: sunglassesRevenue,
            orders: sunglassesOrders,
            items: sunglassesItems,
          },
          {
            type: 'Prescription Glasses',
            revenue: prescriptionRevenue,
            orders: prescriptionOrders,
            items: prescriptionItems,
          },
        ],
        period,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

