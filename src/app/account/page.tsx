"use client";

import { useState } from "react";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  Wallet, 
  LogOut,
  CheckCircle2,
  Clock,
  XCircle,
  Settings,
  Star,
  Upload,
  X as XIcon
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type TabType = 'dashboard' | 'orders' | 'addresses' | 'wallet' | 'reviews' | 'account-details' | 'logout';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  // Review form state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState<{ productName: string; productId: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoveredRating, setReviewHoveredRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewUploadedImages, setReviewUploadedImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Original data for cancel functionality
  const [originalData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    email: 'john.doe@example.com',
  });

  // Dummy user data
  const userName = "John Doe";
  const walletBalance = 12.50;

  // Dummy orders with product items
  const recentOrders = [
    {
      id: "ORD-2024-001",
      date: "2024-01-15",
      status: "Delivered",
      total: 89.99,
      items: [
        { productId: "agnes-dame-wood", productName: "Agnes - Dame Wood", variant: "Dame Wood", quantity: 1, price: 89.99 },
      ],
    },
    {
      id: "ORD-2024-002",
      date: "2024-01-10",
      status: "Delivered",
      total: 129.99,
      items: [
        { productId: "alfie-piano-black", productName: "Alfie - Piano Black", variant: "Piano Black", quantity: 1, price: 129.99 },
      ],
    },
  ];

  const allOrders = [
    {
      id: "ORD-2024-001",
      date: "2024-01-15",
      status: "Delivered",
      total: 89.99,
      items: [
        { productId: "agnes-dame-wood", productName: "Agnes - Dame Wood", variant: "Dame Wood", quantity: 1, price: 89.99 },
      ],
    },
    {
      id: "ORD-2024-002",
      date: "2024-01-10",
      status: "Delivered",
      total: 129.99,
      items: [
        { productId: "alfie-piano-black", productName: "Alfie - Piano Black", variant: "Piano Black", quantity: 1, price: 129.99 },
      ],
    },
    {
      id: "ORD-2024-003",
      date: "2024-01-05",
      status: "Delivered",
      total: 159.98,
      items: [
        { productId: "astrid-ivory", productName: "Astrid - Ivory", variant: "Ivory", quantity: 1, price: 139.99 },
        { productId: "clara-black-temple-milk-rose-ebony", productName: "Clara - Black Temple Milk & Rose Ebony", variant: "Black Temple Milk & Rose Ebony", quantity: 1, price: 19.99 },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Here you would typically make an API call to save the changes
    console.log('Saving changes:', formData);
    setIsEditing(false);
    // Show success message
    alert('Account details updated successfully!');
  };

  const handleCancel = () => {
    setFormData((prev) => ({
      ...prev,
      firstName: originalData.firstName,
      lastName: originalData.lastName,
      displayName: originalData.displayName,
      email: originalData.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
    );
    if (confirmed) {
      console.log('Account Deleted');
      // Here you would typically make an API call to delete the account
      alert('Account deletion initiated. This is a demo - no actual account was deleted.');
    }
  };

  // Review form handlers
  const openReviewDialog = (productName: string, productId: string) => {
    setReviewingProduct({ productName, productId });
    setReviewDialogOpen(true);
  };

  const closeReviewDialog = () => {
    setReviewDialogOpen(false);
    setReviewingProduct(null);
    setReviewRating(0);
    setReviewTitle("");
    setReviewContent("");
    setReviewUploadedImages([]);
    setReviewImagePreviews([]);
  };

  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = reviewUploadedImages.length + newFiles.length;
    
    if (totalFiles > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images.",
        variant: "destructive",
      });
      return;
    }

    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setReviewUploadedImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReviewImage = (index: number) => {
    setReviewUploadedImages(prev => prev.filter((_, i) => i !== index));
    setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reviewRating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating.",
        variant: "destructive",
      });
      return;
    }

    if (!reviewTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a review title.",
        variant: "destructive",
      });
      return;
    }

    if (!reviewContent.trim()) {
      toast({
        title: "Review content required",
        description: "Please write your review.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically send the data to your backend
    toast({
      title: "Review submitted!",
      description: "Thank you for your review. It will be published after moderation.",
    });

    closeReviewDialog();
  };

  const sidebarTabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders' as TabType, label: 'Orders', icon: Package },
    { id: 'addresses' as TabType, label: 'Addresses', icon: MapPin },
    { id: 'wallet' as TabType, label: 'Robin Wallet', icon: Wallet },
    { id: 'reviews' as TabType, label: 'My Reviews', icon: Star },
    { id: 'account-details' as TabType, label: 'Account Details', icon: Settings },
    { id: 'logout' as TabType, label: 'Logout', icon: LogOut },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-brand-blue mb-8">
            My Account
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <nav className="bg-white border border-border rounded-lg p-2 space-y-1">
                {sidebarTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'logout') {
                          // Handle logout
                          alert('Logout functionality to be implemented');
                        } else {
                          setActiveTab(tab.id);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors",
                        activeTab === tab.id
                          ? "bg-brand-teal/10 text-brand-blue font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-brand-blue"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Welcome Message */}
                  <div className="bg-white border border-border rounded-lg p-6">
                    <h2 className="text-2xl font-headline font-bold text-brand-blue mb-2">
                      Hello, {userName}
                    </h2>
                    <p className="text-muted-foreground">
                      Welcome back! Here's an overview of your account.
                    </p>
                  </div>

                  {/* Robin Wallet Card */}
                  <div className="bg-gradient-to-br from-brand-teal to-brand-teal/80 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-6 w-6" />
                        <h3 className="text-xl font-headline font-bold">Robin Wallet</h3>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm opacity-90 mb-1">Current Balance</p>
                      <p className="text-4xl font-headline font-bold">€{walletBalance.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="secondary"
                      className="bg-white text-brand-teal hover:bg-white/90"
                      onClick={() => setActiveTab('wallet')}
                    >
                      View Wallet Details
                    </Button>
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-white border border-border rounded-lg p-6">
                    <h3 className="text-xl font-headline font-bold text-brand-blue mb-4">
                      Recent Orders
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-brand-blue">
                              Order ID
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-brand-blue">
                              Date
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-brand-blue">
                              Status
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-brand-blue">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order.id} className="border-b border-border last:border-0">
                              <td className="py-3 px-4 text-sm text-brand-blue font-medium">
                                {order.id}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {order.date}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(order.status)}
                                  <span className="text-muted-foreground">{order.status}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-right font-semibold text-brand-blue">
                                €{order.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-4 w-full sm:w-auto"
                      onClick={() => setActiveTab('orders')}
                    >
                      View All Orders
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-headline font-bold text-brand-blue mb-4">
                    Orders
                  </h2>
                  {allOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-border rounded-lg p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-border">
                        <div>
                          <h3 className="text-lg font-semibold text-brand-blue">Order {order.id}</h3>
                          <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <span className="text-sm text-muted-foreground">{order.status}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-lg font-semibold text-brand-blue">€{order.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
                            <div className="flex-grow">
                              <h4 className="font-semibold text-brand-blue">{item.productName}</h4>
                              <p className="text-sm text-muted-foreground">Variant: {item.variant}</p>
                              <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                              <p className="text-sm font-semibold text-brand-blue mt-1">€{item.price.toFixed(2)}</p>
                            </div>
                            {order.status === "Delivered" && (
                              <Button
                                onClick={() => openReviewDialog(item.productName, item.productId)}
                                className="bg-brand-teal text-white hover:bg-brand-teal/90 text-xs py-1 px-2 whitespace-nowrap"
                              >
                                Write a Review
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-headline font-bold text-brand-blue mb-4">
                    Addresses
                  </h2>
                  <p className="text-muted-foreground">Manage your shipping addresses here.</p>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-headline font-bold text-brand-blue mb-4">
                    Robin Wallet
                  </h2>
                  <div className="bg-gradient-to-br from-brand-teal to-brand-teal/80 rounded-lg p-6 text-white mb-6">
                    <p className="text-sm opacity-90 mb-1">Current Balance</p>
                    <p className="text-4xl font-headline font-bold">€{walletBalance.toFixed(2)}</p>
                  </div>
                  <p className="text-muted-foreground">
                    Your cashback earnings and transaction history will be displayed here.
                  </p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-headline font-bold text-brand-blue mb-4">
                    My Reviews
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    View all your product reviews here. Reviews for deleted products will show as "Product no longer available".
                  </p>
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet. Write a review from your orders page!</p>
                  </div>
                </div>
              )}

              {activeTab === 'account-details' && (
                <div className="space-y-6">
                  {/* Section 1: Personal Information */}
                  <div className="bg-white border border-border rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-headline font-bold text-brand-blue">
                        Personal Information
                      </h2>
                      {!isEditing && (
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5"
                        >
                          Edit Details
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div>
                        <Label htmlFor="firstName" className="text-brand-blue font-semibold mb-2 block">
                          First Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="border-brand-blue/20 focus:ring-brand-teal focus:border-brand-teal"
                          />
                        ) : (
                          <p className="text-muted-foreground py-2">{formData.firstName}</p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <Label htmlFor="lastName" className="text-brand-blue font-semibold mb-2 block">
                          Last Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="border-brand-blue/20 focus:ring-brand-teal focus:border-brand-teal"
                          />
                        ) : (
                          <p className="text-muted-foreground py-2">{formData.lastName}</p>
                        )}
                      </div>

                      {/* Display Name */}
                      <div>
                        <Label htmlFor="displayName" className="text-brand-blue font-semibold mb-2 block">
                          Display Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="displayName"
                            value={formData.displayName}
                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                            className="border-brand-blue/20 focus:ring-brand-teal focus:border-brand-teal"
                          />
                        ) : (
                          <p className="text-muted-foreground py-2">{formData.displayName}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <Label htmlFor="email" className="text-brand-blue font-semibold mb-2 block">
                          Email
                        </Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="border-brand-blue/20 focus:ring-brand-teal focus:border-brand-teal"
                          />
                        ) : (
                          <p className="text-muted-foreground py-2">{formData.email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Password Change (Only in Edit Mode) */}
                  {isEditing && (
                    <div className="bg-white border border-border rounded-lg p-6">
                      <h2 className="text-2xl font-headline font-bold text-brand-blue mb-6">
                        Change Password
                      </h2>

                      <div className="space-y-6">
                        {/* Current Password */}
                        <div>
                          <Label htmlFor="currentPassword" className="text-brand-blue font-semibold mb-2 block">
                            Current Password
                          </Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                            className="border-brand-blue/20 focus:ring-brand-teal focus:border-brand-teal"
                            placeholder="Enter your current password"
                          />
                        </div>

                        {/* New Password */}
                        <div>
                          <Label htmlFor="newPassword" className="text-brand-blue font-semibold mb-2 block">
                            New Password
                          </Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            className="border-brand-blue/20 focus:ring-brand-teal focus:border-brand-teal"
                            placeholder="Enter your new password"
                          />
                        </div>

                        {/* Confirm New Password */}
                        <div>
                          <Label htmlFor="confirmPassword" className="text-brand-blue font-semibold mb-2 block">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className="border-brand-blue/20 focus:ring-brand-teal focus:border-brand-teal"
                            placeholder="Confirm your new password"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons (Only in Edit Mode) */}
                  {isEditing && (
                    <div className="flex gap-4">
                      <Button
                        onClick={handleSave}
                        className="bg-brand-teal text-white hover:bg-brand-teal/90 font-semibold px-8"
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Section 3: Danger Zone */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-2xl font-headline font-bold text-brand-blue mb-2">
                      Delete Account
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Permanently delete your account and all data. This action cannot be undone.
                    </p>
                    <Button
                      onClick={handleDeleteAccount}
                      className="bg-[#F56278] text-white hover:bg-[#F56278]/90 font-semibold"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Review Form Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {reviewingProduct?.productName}. Your review will help other customers make informed decisions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReviewSubmit} className="space-y-6">
            {/* Rating Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Rating *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setReviewHoveredRating(star)}
                    onMouseLeave={() => setReviewHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        (reviewHoveredRating >= star || reviewRating >= star)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
                {reviewRating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {reviewRating === 5 && "Excellent"}
                    {reviewRating === 4 && "Very Good"}
                    {reviewRating === 3 && "Good"}
                    {reviewRating === 2 && "Fair"}
                    {reviewRating === 1 && "Poor"}
                  </span>
                )}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <Label htmlFor="review-title" className="text-base font-semibold mb-2 block">
                Review Title *
              </Label>
              <Input
                id="review-title"
                placeholder="Give your review a title"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">{reviewTitle.length}/100 characters</p>
            </div>

            {/* Review Content */}
            <div>
              <Label htmlFor="review-content" className="text-base font-semibold mb-2 block">
                Your Review *
              </Label>
              <Textarea
                id="review-content"
                placeholder="Share your experience with this product..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                rows={6}
                maxLength={1000}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{reviewContent.length}/1000 characters</p>
            </div>

            {/* Image Upload */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Photos (Optional)
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Upload up to 5 images. Max 5MB per image.
              </p>
              
              {/* Image Previews */}
              {reviewImagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {reviewImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-border">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReviewImage(index)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {reviewImagePreviews.length < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleReviewImageUpload}
                    disabled={reviewImagePreviews.length >= 5}
                  />
                </label>
              )}
              {reviewImagePreviews.length >= 5 && (
                <p className="text-sm text-muted-foreground">
                  Maximum of 5 images reached.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeReviewDialog}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-teal text-white hover:bg-brand-teal/90">
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

