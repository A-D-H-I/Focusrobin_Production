'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  RefreshCw,
  Calendar as CalendarIcon,
  CreditCard,
  Globe,
  Download,
  X
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalItems: number;
    uniqueCustomers: number;
    repeatCustomers: number;
    revenueGrowth: number;
    ordersGrowth: number;
    // Product type breakdown
    sunglassesRevenue: number;
    prescriptionRevenue: number;
    sunglassesOrders: number;
    prescriptionOrders: number;
    sunglassesItems: number;
    prescriptionItems: number;
  };
  revenueByDay: { date: string; revenue: number; orders: number; sunglasses: number; prescription: number }[];
  revenueByMonth?: { month: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number; orders: number }[];
  salesByCategory: { name: string; revenue: number; orders: number; quantity: number }[];
  paymentMethodBreakdown: { method: string; count: number; revenue: number }[];
  salesByCountry: { country: string; revenue: number; orders: number }[];
  productTypeBreakdown: { type: string; revenue: number; orders: number; items: number }[];
  period: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      let url = `/api/admin/analytics/export?`;
      
      if (useCustomRange && dateRange?.from && dateRange?.to) {
        // Use custom date range
        const startDate = format(startOfDay(dateRange.from), 'yyyy-MM-dd');
        const endDate = format(endOfDay(dateRange.to), 'yyyy-MM-dd');
        url += `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      } else {
        // Use period
        url += `period=${encodeURIComponent(period)}`;
      }
      
      const response = await fetch(url);
      
      // Check if response is JSON (error response)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export CSV');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to export CSV');
      }

      const blob = await response.blob();
      
      // Check if blob is actually JSON (error case)
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || 'Failed to export CSV');
      }
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Generate filename based on date range or period
      let filename = 'sales-data';
      if (useCustomRange && dateRange?.from && dateRange?.to) {
        const startDate = format(dateRange.from, 'yyyy-MM-dd');
        const endDate = format(dateRange.to, 'yyyy-MM-dd');
        filename = `sales-data-${startDate}_to_${endDate}.csv`;
      } else {
        filename = `sales-data-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('CSV export error:', err);
      const errorMessage = err?.message || 'Failed to export CSV. Please try again.';
      alert(errorMessage);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IE').format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd');
    } catch {
      return dateString;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Prepare chart data
  const revenueChartData = data.revenueByDay.map((item) => ({
    date: formatDate(item.date),
    revenue: item.revenue,
    orders: item.orders,
    sunglasses: item.sunglasses || 0,
    prescription: item.prescription || 0,
  }));

  const topProductsData = data.topProducts.slice(0, 8).map((product) => ({
    name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
    revenue: product.revenue,
    quantity: product.quantity,
  }));

  const categoryData = data.salesByCategory.map((cat) => ({
    name: cat.name,
    value: cat.revenue,
    orders: cat.orders,
  }));

  const paymentData = data.paymentMethodBreakdown.map((pm) => ({
    name: pm.method.charAt(0).toUpperCase() + pm.method.slice(1),
    value: pm.revenue,
    count: pm.count,
  }));

  return (
    <div className="bg-background p-4 md:p-6 min-h-screen">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-brand-h1 font-headline text-foreground">Sales Analytics</h1>
            <p className="mt-2 text-muted-foreground">Professional sales data analysis and insights</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {!useCustomRange ? (
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                  {dateRange?.from && dateRange?.to && (
                    <div className="p-3 border-t flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDateRange(undefined)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setUseCustomRange(!useCustomRange);
                if (!useCustomRange) {
                  setDateRange(undefined);
                }
              }}
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              {useCustomRange ? 'Use Period' : 'Custom Range'}
            </Button>
            <Button onClick={fetchAnalytics} variant="outline" size="icon" title="Refresh data">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              onClick={downloadCSV} 
              variant="default" 
              className="gap-2"
              disabled={useCustomRange && (!dateRange?.from || !dateRange?.to)}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Product Type Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-2 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sunglasses Revenue</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.summary.sunglassesRevenue)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.summary.sunglassesOrders} orders • {formatNumber(data.summary.sunglassesItems)} items
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.summary.totalRevenue > 0 
                  ? ((data.summary.sunglassesRevenue / data.summary.totalRevenue) * 100).toFixed(1)
                  : '0'
                }% of total revenue
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prescription Glasses Revenue</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.summary.prescriptionRevenue)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.summary.prescriptionOrders} orders • {formatNumber(data.summary.prescriptionItems)} items
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.summary.totalRevenue > 0 
                  ? ((data.summary.prescriptionRevenue / data.summary.totalRevenue) * 100).toFixed(1)
                  : '0'
                }% of total revenue
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {data.summary.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={data.summary.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(data.summary.revenueGrowth).toFixed(1)}% vs previous period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.summary.totalOrders)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {data.summary.ordersGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={data.summary.ordersGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(data.summary.ordersGrowth).toFixed(1)}% vs previous period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.summary.averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Per order average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.summary.uniqueCustomers)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.summary.repeatCustomers} repeat customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Revenue & Orders Trend</CardTitle>
            <CardDescription>Daily revenue and order count over time (by product type)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' || name === 'sunglasses' || name === 'prescription' 
                      ? formatCurrency(value) 
                      : formatNumber(value),
                    name === 'revenue' ? 'Total Revenue' 
                      : name === 'sunglasses' ? 'Sunglasses'
                      : name === 'prescription' ? 'Prescription Glasses'
                      : 'Orders'
                  ]}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  name="Total Revenue"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="sunglasses" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Sunglasses"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="prescription" 
                  stroke="#FF8042" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Prescription Glasses"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Product Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Product Type Breakdown</CardTitle>
              <CardDescription>Revenue distribution: Sunglasses vs Prescription Glasses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.productTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {data.productTypeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#00C49F' : '#FF8042'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {data.productTypeBreakdown.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: index === 0 ? '#00C49F' : '#FF8042' }}
                      />
                      <span className="text-sm font-medium">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{formatCurrency(item.revenue)}</div>
                      <div className="text-xs text-muted-foreground">{item.orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
              <CardDescription>Best performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>Revenue distribution by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Breakdown</CardTitle>
              <CardDescription>Revenue by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales by Country */}
          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Revenue by shipping country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.salesByCountry.slice(0, 8).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(country.revenue)}</div>
                      <div className="text-xs text-muted-foreground">{country.orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Items Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.summary.totalItems)}</div>
              <p className="text-xs text-muted-foreground mt-1">Units sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.uniqueCustomers > 0 
                  ? ((data.summary.totalOrders / data.summary.uniqueCustomers) * 100).toFixed(1)
                  : '0'
                }%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Orders per customer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Repeat Customer Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.uniqueCustomers > 0
                  ? ((data.summary.repeatCustomers / data.summary.uniqueCustomers) * 100).toFixed(1)
                  : '0'
                }%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Returning customers</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

