"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  updateTracking,
} from "@/app/actions/orders";
import {
  Package,
  Search,
  Filter,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { LENS_TYPE_LABELS, COATING_LABELS } from "@/lib/lensPricing";
import { FRAME_TYPE_LABELS } from "@/lib/pricing/rx167";
import { getDeliveryTime } from "@/lib/delivery-time";

// Helper function to convert Google Drive links
function convertGoogleDriveLink(url: string): string {
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }
  if (url.includes('googleusercontent.com')) {
    return url;
  }
  return url;
}

// Helper function to normalize image URLs
function normalizeImageUrl(url: string | null): string | null {
  if (!url) return null;

  // If it's already a relative path starting with /, return as is
  if (url.startsWith('/')) return url;

  // Check for Google Drive links and convert them
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('drive.google.com')) {
      return convertGoogleDriveLink(url);
    }
    return url;
  }

  // Handle Windows absolute paths
  const publicPathMatch = url.match(/[\\/]public[\\/](.+)$/i);
  if (publicPathMatch) {
    return '/' + publicPathMatch[1].replace(/\\/g, '/');
  }

  // Extract filename if it's a full path
  const filenameMatch = url.match(/[\\/]([^\\/]+\.(jpg|jpeg|png|gif|webp|svg|glb))$/i);
  if (filenameMatch) {
    return '/' + filenameMatch[1];
  }

  // Fallback
  return url.startsWith('./') ? url.slice(1) : '/' + url;
}

interface OrderItem {
  id: string;
  productId: string | null;
  productSlug: string | null;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl: string | null;
  prescriptionData?: any; // Prescription data for lens manufacturer
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingProvider: string;
  trackingNumber: string | null;
  trackingMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  items: OrderItem[];
  // Business purchase fields
  isBusinessPurchase?: boolean;
  businessName?: string | null;
  businessNumber?: string | null;
  vatNumber?: string | null;
}

interface OrdersManagementProps {
  initialOrders: Order[];
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-purple-100 text-purple-800",
    SHIPPED: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getPaymentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return <CheckCircle className="h-4 w-4" />;
    case "SHIPPED":
      return <Truck className="h-4 w-4" />;
    case "CANCELLED":
    case "REFUNDED":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

// Helper function to extract prescription data (handles both flat and nested formats)
const extractPrescriptionData = (prescriptionData: any) => {
  if (!prescriptionData) return null;

  const rxValues = prescriptionData.rxValues || prescriptionData;

  // Extract OD (Right Eye) - handle both formats
  const od = {
    sph: rxValues.od?.sph || rxValues.odSph || '0.00',
    cyl: rxValues.od?.cyl || rxValues.odCyl || '0.00',
    axis: rxValues.od?.axis || rxValues.odAxis || '0',
    prismHorizontal: rxValues.od?.prismHorizontal || rxValues.odPrismHorizontal,
    prismHorizontalBase: rxValues.od?.prismHorizontalBase || rxValues.odPrismHorizontalBase,
    prismVertical: rxValues.od?.prismVertical || rxValues.odPrismVertical,
    prismVerticalBase: rxValues.od?.prismVerticalBase || rxValues.odPrismVerticalBase,
  };

  // Extract OS (Left Eye) - handle both formats
  const os = {
    sph: rxValues.os?.sph || rxValues.osSph || '0.00',
    cyl: rxValues.os?.cyl || rxValues.osCyl || '0.00',
    axis: rxValues.os?.axis || rxValues.osAxis || '0',
    prismHorizontal: rxValues.os?.prismHorizontal || rxValues.osPrismHorizontal,
    prismHorizontalBase: rxValues.os?.prismHorizontalBase || rxValues.osPrismHorizontalBase,
    prismVertical: rxValues.os?.prismVertical || rxValues.osPrismVertical,
    prismVerticalBase: rxValues.os?.prismVerticalBase || rxValues.osPrismVerticalBase,
  };

  // Extract PD
  const pd = rxValues.pd || prescriptionData.pd || '';
  const pdOd = rxValues.pdOd || prescriptionData.pdOd;
  const pdOs = rxValues.pdOs || prescriptionData.pdOs;
  const hasTwoPDs = rxValues.hasTwoPDs || prescriptionData.hasTwoPDs || false;

  // Extract prism flag
  const hasPrism = rxValues.hasPrism || prescriptionData.hasPrism ||
    !!(od.prismHorizontal && od.prismHorizontal !== '0.00') ||
    !!(od.prismVertical && od.prismVertical !== '0.00') ||
    !!(os.prismHorizontal && os.prismHorizontal !== '0.00') ||
    !!(os.prismVertical && os.prismVertical !== '0.00');

  // Extract lens configuration
  const rxConfig = prescriptionData.rxConfig;

  // Extract PDF mode fields
  const isPdfMode = rxValues.isPdfMode || prescriptionData.isPdfMode || false;
  const prescriptionPdfUrl = rxValues.prescriptionPdfUrl || prescriptionData.prescriptionPdfUrl || rxValues.prescriptionImageUrl || prescriptionData.prescriptionImageUrl;

  return {
    od,
    os,
    pd,
    pdOd,
    pdOs,
    hasTwoPDs,
    hasPrism,
    rxConfig,
    isPdfMode,
    prescriptionPdfUrl,
    prescriptionImageUrl: rxValues.prescriptionImageUrl || prescriptionData.prescriptionImageUrl,
  };
};

export default function OrdersManagement({
  initialOrders,
}: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const result = await getAllOrders();
      if (result.success && result.orders) {
        setOrders(result.orders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(
      orderId,
      newStatus as any
    );
    if (result.success) {
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find((o) => o.id === orderId);
        if (updatedOrder) {
          setSelectedOrder({ ...updatedOrder, status: newStatus });
        }
      }
    } else {
      alert(result.error || "Failed to update order status");
    }
  };

  const handlePaymentStatusUpdate = async (
    orderId: string,
    newPaymentStatus: string
  ) => {
    const result = await updatePaymentStatus(
      orderId,
      newPaymentStatus as any
    );
    if (result.success) {
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find((o) => o.id === orderId);
        if (updatedOrder) {
          setSelectedOrder({ ...updatedOrder, paymentStatus: newPaymentStatus });
        }
      }
    } else {
      alert(result.error || "Failed to update payment status");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleDownloadInvoices = async (orderId: string) => {
    setDownloadingOrderId(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/invoices`);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to download invoices';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        // If not PDF, try to get error message
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid response format');
      }

      // Get the blob and create download link
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoices-${orders.find(o => o.id === orderId)?.orderNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading invoices:', error);
      alert(`Failed to download invoices: ${error.message || 'Unknown error'}. Please check the console for details.`);
    } finally {
      setDownloadingOrderId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPaymentStatus =
      paymentStatusFilter === "all" ||
      order.paymentStatus === paymentStatusFilter;
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const formatPrice = (amount: number, currency: string = "EUR") => {
    const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "£";
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-brand-h1 font-headline text-foreground">Orders</h1>
              <p className="mt-2 text-muted-foreground">
                Manage and track all customer orders
              </p>
            </div>
            <Button onClick={loadOrders} variant="outline" disabled={isLoading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={paymentStatusFilter}
              onValueChange={setPaymentStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {orders.length === 0
                  ? "No orders yet."
                  : "No orders match your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-brand-h3 font-headline">
                          <span className="break-words">{order.orderNumber}</span>
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </Badge>
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="break-words">
                          <span className="font-medium">Customer:</span>{" "}
                          {order.userName} ({order.userEmail})
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>{" "}
                          {formatDate(order.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span>{" "}
                          <span className="font-semibold text-foreground">
                            {formatPrice(order.total, order.currency)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Items:</span>{" "}
                        {order.items.length} item(s) •{" "}
                        <span className="font-medium">Payment:</span>{" "}
                        {order.paymentMethod}
                        {order.shippingCountry && (() => {
                          const deliveryTime = getDeliveryTime(
                            order.items.map((item: any) => ({
                              prescriptionData: item.prescriptionData,
                              productSlug: item.productSlug,
                            })),
                            order.shippingCountry
                          );
                          return (
                            <> • <span className="font-medium">Delivery:</span> {deliveryTime}</>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoices(order.id)}
                        disabled={downloadingOrderId === order.id}
                      >
                        <Download className={`h-4 w-4 mr-2 ${downloadingOrderId === order.id ? 'animate-spin' : ''}`} />
                        {downloadingOrderId === order.id ? 'Downloading...' : 'Download Invoices'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Order Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
              <DialogDescription>
                Placed {selectedOrder && formatDistanceToNow(new Date(selectedOrder.createdAt), { addSuffix: true })}
              </DialogDescription>
              {selectedOrder && (
                <div className="mt-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleDownloadInvoices(selectedOrder.id)}
                    disabled={downloadingOrderId === selectedOrder.id}
                  >
                    <Download className={`h-4 w-4 mr-2 ${downloadingOrderId === selectedOrder.id ? 'animate-spin' : ''}`} />
                    {downloadingOrderId === selectedOrder.id ? 'Downloading...' : 'Download Invoices (PDF)'}
                  </Button>
                </div>
              )}
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Status Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">
                      Order Status
                    </Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) =>
                        handleStatusUpdate(selectedOrder.id, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">
                      Payment Status
                    </Label>
                    <Select
                      value={selectedOrder.paymentStatus}
                      onValueChange={(value) =>
                        handlePaymentStatusUpdate(selectedOrder.id, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="text-brand-h3 font-headline mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Name</Label>
                      <p>{selectedOrder.userName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
                      <p className="break-words">{selectedOrder.userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Business Details (if applicable) */}
                {selectedOrder.isBusinessPurchase && (
                  <div>
                    <h3 className="text-brand-h3 font-headline mb-3">Business Details</h3>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedOrder.businessName && (
                          <div>
                            <Label className="text-sm font-semibold text-blue-900">Business Name</Label>
                            <p className="font-medium">{selectedOrder.businessName}</p>
                          </div>
                        )}
                        {selectedOrder.businessNumber && (
                          <div>
                            <Label className="text-sm font-semibold text-blue-900">Registration Number</Label>
                            <p>{selectedOrder.businessNumber}</p>
                          </div>
                        )}
                        {selectedOrder.vatNumber && (
                          <div>
                            <Label className="text-sm font-semibold text-blue-900">VAT Number</Label>
                            <p>{selectedOrder.vatNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                <div>
                  <h3 className="text-brand-h3 font-headline mb-3">Shipping Address</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">{selectedOrder.shippingName}</p>
                    <p>{selectedOrder.shippingPhone}</p>
                    <p>{selectedOrder.shippingAddressLine1}</p>
                    {selectedOrder.shippingAddressLine2 && (
                      <p>{selectedOrder.shippingAddressLine2}</p>
                    )}
                    <p>
                      {selectedOrder.shippingCity}
                      {selectedOrder.shippingState && `, ${selectedOrder.shippingState}`}
                      {` ${selectedOrder.shippingPostalCode}`}
                    </p>
                    <p>{selectedOrder.shippingCountry}</p>
                    {selectedOrder.shippingCountry && (() => {
                      const deliveryTime = getDeliveryTime(
                        selectedOrder.items.map((item: any) => ({
                          prescriptionData: item.prescriptionData,
                          productSlug: item.productSlug,
                        })),
                        selectedOrder.shippingCountry
                      );
                      return (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm font-semibold text-blue-900">
                            📦 Expected Delivery: {deliveryTime}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Tracking Information */}
                <div>
                  <h3 className="text-brand-h3 font-headline mb-3">Tracking Information</h3>
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Shipping Provider
                      </Label>
                      <p className="text-sm">{selectedOrder.shippingProvider || 'Not set'}</p>
                    </div>
                    <div>
                      <Label htmlFor="tracking-number" className="text-sm font-semibold mb-2 block">
                        Tracking Number
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="tracking-number"
                          value={selectedOrder.trackingNumber || ''}
                          onChange={(e) => {
                            setSelectedOrder({
                              ...selectedOrder,
                              trackingNumber: e.target.value,
                            });
                          }}
                          placeholder="Enter tracking number"
                        />
                        <Button
                          onClick={async () => {
                            const result = await updateTracking(
                              selectedOrder.id,
                              selectedOrder.trackingNumber || undefined,
                              undefined
                            );
                            if (result.success) {
                              await loadOrders();
                              const updatedOrder = orders.find((o) => o.id === selectedOrder.id);
                              if (updatedOrder) {
                                setSelectedOrder(updatedOrder);
                              }
                              alert('Tracking number updated successfully');
                            } else {
                              alert(result.error || 'Failed to update tracking number');
                            }
                          }}
                          variant="outline"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tracking-message" className="text-sm font-semibold mb-2 block">
                        Tracking Message/Update
                      </Label>
                      <div className="flex gap-2">
                        <Textarea
                          id="tracking-message"
                          value={selectedOrder.trackingMessage || ''}
                          onChange={(e) => {
                            setSelectedOrder({
                              ...selectedOrder,
                              trackingMessage: e.target.value,
                            });
                          }}
                          placeholder="Enter tracking update message for customer"
                          rows={3}
                        />
                        <Button
                          onClick={async () => {
                            const result = await updateTracking(
                              selectedOrder.id,
                              undefined,
                              selectedOrder.trackingMessage || undefined
                            );
                            if (result.success) {
                              await loadOrders();
                              const updatedOrder = orders.find((o) => o.id === selectedOrder.id);
                              if (updatedOrder) {
                                setSelectedOrder(updatedOrder);
                              }
                              alert('Tracking message updated successfully');
                            } else {
                              alert(result.error || 'Failed to update tracking message');
                            }
                          }}
                          variant="outline"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-brand-h3 font-headline mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => {
                      const prescription = extractPrescriptionData(item.prescriptionData);
                      const hasPrescription = !!prescription && (
                        prescription.isPdfMode ||
                        (prescription.od.sph !== '0.00' && prescription.od.sph !== '0') ||
                        (prescription.od.cyl !== '0.00' && prescription.od.cyl !== '0') ||
                        (prescription.os.sph !== '0.00' && prescription.os.sph !== '0') ||
                        (prescription.os.cyl !== '0.00' && prescription.os.cyl !== '0') ||
                        !!prescription.rxConfig
                      );

                      return (
                        <div key={item.id} className="space-y-3">
                          <div className="flex items-center gap-4 p-4 border rounded-lg">
                            {item.imageUrl && (() => {
                              const normalizedUrl = normalizeImageUrl(item.imageUrl);
                              return normalizedUrl ? (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                  <Image
                                    src={normalizedUrl}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                    unoptimized={!normalizedUrl.startsWith('http')}
                                  />
                                </div>
                              ) : null;
                            })()}
                            <div className="flex-1">
                              {item.productSlug ? (
                                <Link
                                  href={`/shop/${item.productSlug}`}
                                  className="font-semibold hover:underline"
                                >
                                  {item.productName}
                                </Link>
                              ) : (
                                <span className="font-semibold text-muted-foreground">
                                  {item.productName} <span className="text-xs">(Product Deleted)</span>
                                </span>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {item.variantName} • SKU: {item.sku}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} × {formatPrice(item.price, selectedOrder.currency)} = {formatPrice(item.total, selectedOrder.currency)}
                              </p>
                              {hasPrescription && (
                                <Badge className="mt-2 bg-blue-100 text-blue-800">
                                  {prescription?.isPdfMode ? '📄 Prescription PDF' : '📋 Prescription Lenses'}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatPrice(item.total, selectedOrder.currency)}
                              </p>
                            </div>
                          </div>

                          {/* Prescription Details for Lens Manufacturer */}
                          {hasPrescription && prescription && (
                            <div className="ml-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <span>🔬 Prescription Details for Lens Manufacturer</span>
                              </h4>

                              {/* PDF Mode - Show download button */}
                              {prescription.isPdfMode && prescription.prescriptionPdfUrl ? (
                                <div className="mb-4">
                                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-blue-200">
                                    <div className="p-3 bg-blue-100 rounded-full">
                                      <Download className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-semibold text-blue-900">Prescription PDF Uploaded</p>
                                      <p className="text-sm text-blue-700">Customer uploaded a prescription document</p>
                                    </div>
                                    <a
                                      href={prescription.prescriptionPdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download PDF
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                /* Manual Entry Mode - Show prescription values table */
                                <div className="mb-4">
                                  <h5 className="text-sm font-semibold text-blue-800 mb-2">Prescription Values</h5>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                      <thead>
                                        <tr className="bg-blue-100">
                                          <th className="border border-blue-300 px-2 py-1 text-left">Eye</th>
                                          <th className="border border-blue-300 px-2 py-1 text-center">SPH</th>
                                          <th className="border border-blue-300 px-2 py-1 text-center">CYL</th>
                                          <th className="border border-blue-300 px-2 py-1 text-center">AXIS</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="border border-blue-300 px-2 py-1 font-medium">OD (Right)</td>
                                          <td className="border border-blue-300 px-2 py-1 text-center">{prescription.od.sph}</td>
                                          <td className="border border-blue-300 px-2 py-1 text-center">{prescription.od.cyl}</td>
                                          <td className="border border-blue-300 px-2 py-1 text-center">{prescription.od.axis}°</td>
                                        </tr>
                                        <tr>
                                          <td className="border border-blue-300 px-2 py-1 font-medium">OS (Left)</td>
                                          <td className="border border-blue-300 px-2 py-1 text-center">{prescription.os.sph}</td>
                                          <td className="border border-blue-300 px-2 py-1 text-center">{prescription.os.cyl}</td>
                                          <td className="border border-blue-300 px-2 py-1 text-center">{prescription.os.axis}°</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* PD Values */}
                                  <div className="mt-3 text-sm">
                                    <span className="font-semibold text-blue-800">PD (Pupillary Distance):</span>{' '}
                                    {prescription.hasTwoPDs ? (
                                      <span>OD: {prescription.pdOd || 'N/A'} mm | OS: {prescription.pdOs || 'N/A'} mm</span>
                                    ) : (
                                      <span>{prescription.pd || 'N/A'} mm</span>
                                    )}
                                  </div>

                                  {/* Prism Values */}
                                  {prescription.hasPrism && (
                                    <div className="mt-3">
                                      <h6 className="text-sm font-semibold text-blue-800 mb-1">Prism Correction</h6>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse">
                                          <thead>
                                            <tr className="bg-blue-100">
                                              <th className="border border-blue-300 px-1 py-1 text-left">Eye</th>
                                              <th className="border border-blue-300 px-1 py-1 text-center">H. Prism</th>
                                              <th className="border border-blue-300 px-1 py-1 text-center">Base H</th>
                                              <th className="border border-blue-300 px-1 py-1 text-center">V. Prism</th>
                                              <th className="border border-blue-300 px-1 py-1 text-center">Base V</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr>
                                              <td className="border border-blue-300 px-1 py-1 font-medium">OD</td>
                                              <td className="border border-blue-300 px-1 py-1 text-center">{prescription.od.prismHorizontal || '-'}</td>
                                              <td className="border border-blue-300 px-1 py-1 text-center">{prescription.od.prismHorizontalBase || '-'}</td>
                                              <td className="border border-blue-300 px-1 py-1 text-center">{prescription.od.prismVertical || '-'}</td>
                                              <td className="border border-blue-300 px-1 py-1 text-center">{prescription.od.prismVerticalBase || '-'}</td>
                                            </tr>
                                            <tr>
                                              <td className="border border-blue-300 px-1 py-1 font-medium">OS</td>
                                              <td className="border border-blue-300 px-1 py-1 text-center">{prescription.os.prismHorizontal || '-'}</td>
                                              <td className="border border-blue-300 px-1 py-1 text-center">{prescription.os.prismHorizontalBase || '-'}</td>
                                              <td className="border border-blue-300 px-1 py-1 text-center">{prescription.os.prismVertical || '-'}</td>
                                              <td className="border border-blue-300 px-1 py-1 text-center">{prescription.os.prismVerticalBase || '-'}</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Lens Configuration */}
                              {prescription.rxConfig && (
                                <div className="mt-4 pt-4 border-t border-blue-300">
                                  <h5 className="text-sm font-semibold text-blue-800 mb-2">Lens Configuration</h5>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium text-blue-700">Lens Type:</span>{' '}
                                      <span>{LENS_TYPE_LABELS[prescription.rxConfig.lensType as keyof typeof LENS_TYPE_LABELS] || prescription.rxConfig.lensType}</span>
                                    </div>
                                    {prescription.rxConfig.lensIndex && (
                                      <div>
                                        <span className="font-medium text-blue-700">Lens Index:</span>{' '}
                                        <span>{prescription.rxConfig.lensIndex}</span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-medium text-blue-700">Coating:</span>{' '}
                                      <span>{COATING_LABELS[prescription.rxConfig.coating as keyof typeof COATING_LABELS] || prescription.rxConfig.coating}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-blue-700">Frame Type:</span>{' '}
                                      <span>{FRAME_TYPE_LABELS[prescription.rxConfig.frameType as keyof typeof FRAME_TYPE_LABELS] || prescription.rxConfig.frameType}</span>
                                    </div>
                                    {prescription.rxConfig.lensType === "TINTED" && prescription.rxConfig.tintType && (
                                      <>
                                        <div>
                                          <span className="font-medium text-blue-700">Tint Type:</span>{' '}
                                          <span>{prescription.rxConfig.tintType === "FULL_TINT_CATALOG" ? "Full Tint (Catalog)" : "Gradient Tint"}</span>
                                        </div>
                                        {prescription.rxConfig.tintColor && (
                                          <div>
                                            <span className="font-medium text-blue-700">Tint Color:</span>{' '}
                                            <span>
                                              {prescription.rxConfig.tintColor}
                                              {prescription.rxConfig.tintType === "FULL_TINT_CATALOG" && prescription.rxConfig.tintShadePercent && ` ${prescription.rxConfig.tintShadePercent}%`}
                                              {prescription.rxConfig.tintType === "GRADIENT" && prescription.rxConfig.tintRecipe && ` (${prescription.rxConfig.tintRecipe})`}
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {prescription.rxConfig.photochromicColor && (
                                      <div>
                                        <span className="font-medium text-blue-700">Photochromic Color:</span>{' '}
                                        <span>{prescription.rxConfig.photochromicColor}</span>
                                      </div>
                                    )}
                                    {prescription.rxConfig.polarizedColor && (
                                      <div>
                                        <span className="font-medium text-blue-700">Polarized Color:</span>{' '}
                                        <span>{prescription.rxConfig.polarizedColor}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Prescription Image */}
                              {prescription.prescriptionImageUrl && (
                                <div className="mt-3 pt-3 border-t border-blue-300">
                                  <span className="text-sm font-semibold text-blue-800">Prescription Image:</span>{' '}
                                  <a
                                    href={prescription.prescriptionImageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm"
                                  >
                                    View Uploaded Prescription
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(selectedOrder.subtotal, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{formatPrice(selectedOrder.shipping, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span>{formatPrice(selectedOrder.total, selectedOrder.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                {(selectedOrder.shippedAt || selectedOrder.deliveredAt) && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {selectedOrder.shippedAt && (
                      <p>
                        Shipped: {formatDate(selectedOrder.shippedAt)}
                      </p>
                    )}
                    {selectedOrder.deliveredAt && (
                      <p>
                        Delivered: {formatDate(selectedOrder.deliveredAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

