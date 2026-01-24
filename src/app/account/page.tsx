"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
  X as XIcon,
  User,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Truck,
  Glasses
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { usePrice } from "@/hooks/usePrice";
import { useCurrency } from "@/context/CurrencyContext";
import { getWalletBalance, getWalletTransactions, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, deleteMyAccount } from "@/app/actions/user";
import { getUserOrders } from "@/app/actions/orders";
import { getReviewableOrders, createReview, getUserReviews } from "@/app/actions/reviews";
import { refundPendingOrders } from "@/app/actions/checkout";
import { signOut } from "next-auth/react";
import { format } from "date-fns";
import { getDeliveryTime } from "@/lib/delivery-time";

type TabType = 'dashboard' | 'orders' | 'addresses' | 'wallet' | 'reviews' | 'account-details' | 'logout';

// Schengen countries list
const SCHENGEN_COUNTRIES = [
  'Austria',
  'Belgium',
  'Croatia',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Italy',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
];

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { formatPrice, currency } = usePrice();
  const isNonEurCurrency = currency !== 'EUR';
  
  // Review form state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState<{ productName: string; productId: string; orderId: string } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoveredRating, setReviewHoveredRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewUploadedImages, setReviewUploadedImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  
  // Get user name from session
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || "User";
  
  // Form state - initialize with session data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Check for and refund pending orders with wallet deductions when page loads
  // This handles cases where user navigated back from payment page
  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      // Check for pending orders that need wallet refund (only once on page load)
      refundPendingOrders()
        .then((result) => {
          if (result.success && result.ordersProcessed && result.ordersProcessed > 0) {
            console.log(`[Account] Refunded wallet for ${result.ordersProcessed} pending order(s), total: €${result.refunded?.toFixed(2) || '0.00'}`);
            if (result.refunded && result.refunded > 0) {
              toast({
                title: "Wallet Refunded",
                description: `€${result.refunded.toFixed(2)} has been returned to your wallet from previous checkout attempts.`,
              });
              // Reload wallet balance if wallet tab is active
              if (activeTab === 'wallet') {
                getWalletBalance().then((balanceResult) => {
                  if (balanceResult.balance !== undefined) {
                    setWalletBalance(balanceResult.balance);
                  }
                });
              }
            }
          }
        })
        .catch((error) => {
          console.error('[Account] Error checking pending orders:', error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, status]); // Only run once when session is authenticated

  // Update form data when session loads
  useEffect(() => {
    if (session?.user) {
      const nameParts = session.user.name?.split(' ') || [];
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        displayName: session.user.name || '',
        email: session.user.email || '',
      }));
    }
  }, [session]);

  // Original data for cancel functionality
  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
  });

  // Update original data when session loads
  useEffect(() => {
    if (session?.user) {
      const nameParts = session.user.name?.split(' ') || [];
      setOriginalData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        displayName: session.user.name || '',
        email: session.user.email || '',
      });
    }
  }, [session]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Ireland',
    isDefault: false,
  });

  // Fetch wallet data
  useEffect(() => {
    const loadWalletData = async () => {
      setIsLoadingWallet(true);
      try {
        const [balanceResult, transactionsResult] = await Promise.all([
          getWalletBalance(),
          getWalletTransactions(),
        ]);
        if (balanceResult.balance !== undefined) {
          setWalletBalance(balanceResult.balance);
        }
        if (transactionsResult.transactions) {
          setWalletTransactions(transactionsResult.transactions);
        }
      } catch (error) {
        console.error("Error loading wallet data:", error);
      } finally {
        setIsLoadingWallet(false);
      }
    };
    loadWalletData();
  }, [activeTab === 'wallet']);

  // Fetch addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (status === 'authenticated' && session?.user) {
        setIsLoadingAddresses(true);
        try {
          const result = await getAddresses();
          if (result.addresses) {
            setAddresses(result.addresses);
          }
        } catch (error) {
          console.error("Error loading addresses:", error);
        } finally {
          setIsLoadingAddresses(false);
        }
      }
    };
    loadAddresses();
  }, [status, session, activeTab === 'addresses']);

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [reviewableItems, setReviewableItems] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const ordersLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Fetch orders (for both dashboard and orders tab)
  useEffect(() => {
    const loadOrders = async () => {
      // Only load if authenticated and on orders/dashboard tab
      if (status !== 'authenticated' || !session?.user?.id) {
        ordersLoadedRef.current = false;
        lastUserIdRef.current = null;
        return;
      }
      
      if (activeTab !== 'orders' && activeTab !== 'dashboard') {
        return;
      }

      // Prevent loading if already loading
      if (isLoadingOrders) {
        return;
      }

      // Check if we've already loaded orders for this user and tab
      const currentUserId = session.user.id;
      const isNewUser = lastUserIdRef.current !== currentUserId;
      const shouldLoad = isNewUser || !ordersLoadedRef.current || activeTab === 'orders';

      if (!shouldLoad) {
        return;
      }

      setIsLoadingOrders(true);
      try {
        const result = await getUserOrders();
        if (result.orders) {
          setOrders(result.orders);
        } else {
          setOrders([]);
        }
        ordersLoadedRef.current = true;
        lastUserIdRef.current = currentUserId;
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
        ordersLoadedRef.current = false;
      } finally {
        setIsLoadingOrders(false);
      }
    };
    loadOrders();
    // Use session?.user?.id instead of session to prevent unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id, activeTab]);

  // Fetch reviewable items and user reviews
  const reviewsLoadedRef = useRef(false);
  useEffect(() => {
    const loadReviewData = async () => {
      if (status !== 'authenticated' || !session?.user?.id) {
        reviewsLoadedRef.current = false;
        return;
      }
      
      if (activeTab !== 'reviews' && activeTab !== 'orders') {
        return;
      }

      // Only load reviews once per session or when switching to reviews tab
      if (reviewsLoadedRef.current && activeTab !== 'reviews') {
        return;
      }

      try {
        const [reviewableResult, reviewsResult] = await Promise.all([
          getReviewableOrders(),
          getUserReviews(),
        ]);
        if (reviewableResult && !reviewableResult.error && reviewableResult.items) {
          setReviewableItems(reviewableResult.items);
        }
        if (reviewsResult && !reviewsResult.error && reviewsResult.reviews) {
          setUserReviews(reviewsResult.reviews);
          reviewsLoadedRef.current = true;
        } else if (reviewsResult?.error) {
          console.error("Error loading reviews:", reviewsResult.error);
          setUserReviews([]);
        }
      } catch (error) {
        console.error("Error loading review data:", error);
        setUserReviews([]);
      }
    };
    loadReviewData();
    // Use session?.user?.id instead of session to prevent unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id, activeTab]);

  const recentOrders = orders.slice(0, 2);
  const allOrders = orders;

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'PAID':
      case 'CONFIRMED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'SHIPPED':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'PROCESSING':
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'CANCELLED':
      case 'REFUNDED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'Delivered';
      case 'PAID':
        return 'Paid';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'SHIPPED':
        return 'Shipped';
      case 'PROCESSING':
        return 'Processing';
      case 'PENDING':
        return 'Pending';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REFUNDED':
        return 'Refunded';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'PAID':
      case 'CONFIRMED':
        return 'text-green-600';
      case 'SHIPPED':
        return 'text-blue-600';
      case 'PROCESSING':
      case 'PENDING':
        return 'text-yellow-600';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be archived and then permanently deleted.'
    );
    
    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirm = window.confirm(
      'This is your final warning. Your account and all associated data will be permanently deleted. This cannot be undone. Are you absolutely sure?'
    );

    if (!doubleConfirm) {
      return;
    }

    try {
      const result = await deleteMyAccount();
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully deleted. You will be signed out.",
        });
        
        // Sign out and redirect after a short delay
        setTimeout(async () => {
          // Use current origin to ensure redirect works with ngrok
          const callbackUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}/`
            : "/";
          await signOut({ callbackUrl });
        }, 2000);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Review form handlers
  const openReviewDialog = (productName: string, productId: string, orderId: string) => {
    setReviewingProduct({ productName, productId, orderId });
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewingProduct) return;

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

    setIsSubmittingReview(true);

    try {
      // Upload images first (for now, we'll store as base64 URLs - in production, upload to cloud storage)
      const imageUrls: string[] = [];
      for (const file of reviewUploadedImages) {
        // Convert to base64 for now (in production, upload to S3/Cloudinary/etc)
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imageUrls.push(base64);
      }

      const result = await createReview(
        reviewingProduct.orderId,
        reviewingProduct.productId,
        reviewRating,
        reviewTitle,
        reviewContent,
        imageUrls
      );

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Review submitted!",
          description: "Thank you for your review.",
        });
        closeReviewDialog();
        // Reload review data
        const [reviewableResult, reviewsResult] = await Promise.all([
          getReviewableOrders(),
          getUserReviews(),
        ]);
        if (reviewableResult && !reviewableResult.error && reviewableResult.items) {
          setReviewableItems(reviewableResult.items);
        }
        if (reviewsResult && !reviewsResult.error && reviewsResult.reviews) {
          setUserReviews(reviewsResult.reviews);
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReview(false);
    }
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

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex flex-col min-h-screen bg-brand-white">
        <Header />
        <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-white">
        <Header />
        <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-md mx-auto mt-12">
              <div className="bg-white border border-border rounded-lg p-8 text-center">
                <div className="mb-6">
                  <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-brand-h2 font-headline text-brand-blue mb-2">
                    Sign In Required
                  </h2>
                  <p className="text-muted-foreground">
                    Please sign in to access your account
                  </p>
                </div>
                <Button
                  onClick={() => {
                    // Use current origin to ensure redirect works with both ngrok and localhost
                    const callbackUrl = typeof window !== 'undefined' 
                      ? `${window.location.origin}/account`
                      : "/account";
                    signIn("google", { callbackUrl });
                  }}
                  className="w-full"
                  size="lg"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In with Google
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="text-brand-h1 font-headline text-brand-blue mb-8">
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
                      onClick={async () => {
                        if (tab.id === 'logout') {
                          // Handle logout with proper callback URL for ngrok
                          const callbackUrl = typeof window !== 'undefined' 
                            ? `${window.location.origin}/`
                            : "/";
                          await signOut({ callbackUrl });
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
                    <h2 className="text-brand-h2 font-headline text-brand-blue mb-2">
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
                        <h3 className="text-brand-h3 font-headline">Robin Wallet</h3>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm opacity-90 mb-1">Current Balance</p>
                      <p className="text-4xl font-headline font-bold">{formatPrice(walletBalance)}</p>
                      {isNonEurCurrency && (
                        <p className="text-sm opacity-75 mt-1">€{walletBalance.toFixed(2)} (stored in EUR)</p>
                      )}
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
                    <h3 className="text-brand-h3 font-headline text-brand-blue mb-4">
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
                          {isLoadingOrders ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-muted-foreground">
                                Loading orders...
                              </td>
                            </tr>
                          ) : recentOrders.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-muted-foreground">
                                No orders yet
                              </td>
                            </tr>
                          ) : (
                            recentOrders.map((order) => (
                              <tr key={order.id} className="border-b border-border last:border-0">
                                <td className="py-3 px-4 text-sm text-brand-blue font-medium">
                                  {order.orderNumber}
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                  {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                </td>
                                <td className="py-3 px-4 text-sm">
                                                  <div className="flex items-center gap-2">
                                                    {getStatusIcon(order.status)}
                                                    <span className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</span>
                                                  </div>
                                                </td>
                                <td className="py-3 px-4 text-sm text-right font-semibold text-brand-blue">
                                  {order.currency === 'EUR' ? '€' : order.currency === 'USD' ? '$' : '£'}{order.total.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
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
                  <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                    Orders
                  </h2>
                  {isLoadingOrders ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Loading orders...
                    </div>
                  ) : allOrders.length === 0 ? (
                    <div className="bg-white border border-border rounded-lg p-12 text-center">
                      <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-4">No orders yet</p>
                      <Link href="/shop">
                        <Button>Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    allOrders.map((order) => {
                      const isExpanded = expandedOrders.has(order.id);
                      const toggleExpanded = () => {
                        setExpandedOrders(prev => {
                          const next = new Set(prev);
                          if (next.has(order.id)) {
                            next.delete(order.id);
                          } else {
                            next.add(order.id);
                          }
                          return next;
                        });
                      };
                      
                      return (
                      <div key={order.id} className="bg-white border border-border rounded-lg overflow-hidden">
                        {/* Order Header - Clickable */}
                        <div 
                          className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={toggleExpanded}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                            <h3 className="text-brand-h3 font-headline text-brand-blue">Order {order.orderNumber}</h3>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpanded();
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                            <p className="text-sm text-muted-foreground">Placed on {format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-lg font-semibold text-brand-blue">
                                {order.currency === 'EUR' ? '€' : order.currency === 'USD' ? '$' : '£'}{order.total.toFixed(2)}
                              </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Order Details */}
                        {isExpanded && (
                          <div className="border-t border-border p-6 space-y-6">
                            {/* Order Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Order Information */}
                              <div className="space-y-4">
                                <h4 className="text-brand-h4 font-headline text-brand-blue flex items-center gap-2">
                                  <Package className="h-5 w-5" />
                                  Order Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Order Number:</span>
                                    <span className="font-medium">{order.orderNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Order Date:</span>
                                    <span className="font-medium">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className={`font-medium ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment Status:</span>
                                    <span className="font-medium">{order.paymentStatus}</span>
                                  </div>
                                  {order.paymentMethod && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Payment Method:</span>
                                      <span className="font-medium capitalize">{order.paymentMethod}</span>
                                    </div>
                                  )}
                                  {order.shippedAt && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Shipped On:</span>
                                      <span className="font-medium">{format(new Date(order.shippedAt), 'MMM dd, yyyy')}</span>
                                    </div>
                                  )}
                                  {order.deliveredAt && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Delivered On:</span>
                                      <span className="font-medium">{format(new Date(order.deliveredAt), 'MMM dd, yyyy')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Price Breakdown */}
                              <div className="space-y-4">
                                <h4 className="text-brand-h4 font-headline text-brand-blue flex items-center gap-2">
                                  <CreditCard className="h-5 w-5" />
                                  Price Breakdown
                                </h4>
                                <div className="space-y-2 text-sm">
                                  {order.subtotal !== null && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Subtotal:</span>
                                      <span className="font-medium">
                                        {order.currency === 'EUR' ? '€' : order.currency === 'USD' ? '$' : '£'}{order.subtotal.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  {order.shippingCost !== null && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Shipping:</span>
                                      <span className="font-medium">
                                        {order.currency === 'EUR' ? '€' : order.currency === 'USD' ? '$' : '£'}{order.shippingCost.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  {order.tax !== null && order.tax > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Tax:</span>
                                      <span className="font-medium">
                                        {order.currency === 'EUR' ? '€' : order.currency === 'USD' ? '$' : '£'}{order.tax.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-2 border-t border-border">
                                    <span className="font-semibold text-brand-blue">Total:</span>
                                    <span className="font-bold text-lg text-brand-blue">
                                      {order.currency === 'EUR' ? '€' : order.currency === 'USD' ? '$' : '£'}{order.total.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Shipping Address */}
                            {order.shippingAddressLine1 && (
                              <div className="space-y-2">
                                <h4 className="text-brand-h4 font-headline text-brand-blue flex items-center gap-2">
                                  <Truck className="h-5 w-5" />
                                  Shipping Address
                                </h4>
                                <div className="bg-muted/30 rounded-lg p-4 text-sm">
                                  <p className="font-medium">{order.shippingName}</p>
                                  {order.shippingPhone && <p className="text-muted-foreground">{order.shippingPhone}</p>}
                                  <p className="text-muted-foreground mt-2">{order.shippingAddressLine1}</p>
                                  {order.shippingAddressLine2 && (
                                    <p className="text-muted-foreground">{order.shippingAddressLine2}</p>
                                  )}
                                  <p className="text-muted-foreground">
                                    {order.shippingCity}
                                    {order.shippingState && `, ${order.shippingState}`}
                                    {order.shippingPostalCode && ` ${order.shippingPostalCode}`}
                                  </p>
                                  <p className="text-muted-foreground">{order.shippingCountry}</p>
                                </div>
                              </div>
                            )}

                            {/* Billing Address (if different from shipping) */}
                            {order.billingAddressLine1 && 
                             (order.billingAddressLine1 !== order.shippingAddressLine1 || 
                              order.billingCity !== order.shippingCity) && (
                              <div className="space-y-2">
                                <h4 className="text-brand-h4 font-headline text-brand-blue flex items-center gap-2">
                                  <CreditCard className="h-5 w-5" />
                                  Billing Address
                                </h4>
                                <div className="bg-muted/30 rounded-lg p-4 text-sm">
                                  <p className="font-medium">{order.billingName}</p>
                                  {order.billingPhone && <p className="text-muted-foreground">{order.billingPhone}</p>}
                                  <p className="text-muted-foreground mt-2">{order.billingAddressLine1}</p>
                                  {order.billingAddressLine2 && (
                                    <p className="text-muted-foreground">{order.billingAddressLine2}</p>
                                  )}
                                  <p className="text-muted-foreground">
                                    {order.billingCity}
                                    {order.billingState && `, ${order.billingState}`}
                                    {order.billingPostalCode && ` ${order.billingPostalCode}`}
                                  </p>
                                  <p className="text-muted-foreground">{order.billingCountry}</p>
                                </div>
                              </div>
                            )}
                        
                        {/* Delivery Time */}
                        {order.shippingCountry && (() => {
                          const deliveryTime = getDeliveryTime(
                            order.items.map((item: any) => ({
                              prescriptionData: item.prescriptionData,
                              productSlug: item.productSlug,
                            })),
                            order.shippingCountry
                          );
                          return (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-900">
                                <span className="font-medium">📦 Expected Delivery:</span> {deliveryTime}
                              </p>
                            </div>
                          );
                        })()}

                        {/* Tracking Information */}
                        {(order.trackingNumber || order.trackingMessage) && (
                              <div className="p-4 bg-brand-teal/10 border border-brand-teal/20 rounded-lg">
                            <h4 className="text-brand-h4 font-headline text-brand-blue mb-2">Tracking Information</h4>
                            {order.shippingProvider && (
                              <p className="text-sm text-muted-foreground mb-1">
                                <span className="font-medium">Shipping Provider:</span> {order.shippingProvider}
                              </p>
                            )}
                            {order.trackingNumber && (
                              <p className="text-sm text-muted-foreground mb-1">
                                <span className="font-medium">Tracking Number:</span> {order.trackingNumber}
                              </p>
                            )}
                            {order.trackingMessage && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <span className="font-medium">Update:</span> {order.trackingMessage}
                              </p>
                            )}
                          </div>
                        )}

                            {/* Order Items */}
                        <div className="space-y-4">
                              <h4 className="text-brand-h4 font-headline text-brand-blue">Order Items</h4>
                          {order.items.map((item: any, itemIndex: number) => (
                            <div key={itemIndex} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
                                  {item.imageUrl && (
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                                      <Image
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                      />
                                    </div>
                                  )}
                              <div className="flex-grow">
                                    {item.productSlug ? (
                                      <Link href={`/shop/${item.productSlug}`}>
                                        <h4 className="text-brand-h4 font-headline text-brand-blue hover:text-brand-teal transition-colors">
                                          {item.productName}
                                        </h4>
                                      </Link>
                                    ) : (
                                <h4 className="text-brand-h4 font-headline text-brand-blue">{item.productName}</h4>
                                    )}
                                <p className="text-sm text-muted-foreground">Variant: {item.variantName}</p>
                                    {item.sku && (
                                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                                    )}
                                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                    {item.prescriptionData && (() => {
                                      // Handle both nested and flat prescription data formats
                                      // Flat format: { rxValues: { odSph, odCyl, odAxis, osSph, ... } }
                                      // Nested format: { od: { sph, cyl, axis }, os: { sph, cyl, axis } }
                                      const rxValues = item.prescriptionData.rxValues || item.prescriptionData;
                                      
                                      // Extract OD (Right Eye) values - handle both formats
                                      const od = {
                                        sph: rxValues.od?.sph || rxValues.odSph || '0.00',
                                        cyl: rxValues.od?.cyl || rxValues.odCyl || '0.00',
                                        axis: rxValues.od?.axis || rxValues.odAxis || '0',
                                        prismHorizontal: rxValues.od?.prismHorizontal || rxValues.odPrismHorizontal,
                                        prismHorizontalBase: rxValues.od?.prismHorizontalBase || rxValues.odPrismHorizontalBase,
                                        prismVertical: rxValues.od?.prismVertical || rxValues.odPrismVertical,
                                        prismVerticalBase: rxValues.od?.prismVerticalBase || rxValues.odPrismVerticalBase,
                                      };
                                      
                                      // Extract OS (Left Eye) values - handle both formats
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
                                      const pd = rxValues.pd || '';
                                      const pdOd = rxValues.pdOd || '';
                                      const pdOs = rxValues.pdOs || '';
                                      const hasTwoPDs = rxValues.hasTwoPDs || false;
                                      const hasPrism = rxValues.hasPrism || 
                                        (od.prismHorizontal && od.prismHorizontal !== "0.00") ||
                                        (od.prismVertical && od.prismVertical !== "0.00") ||
                                        (os.prismHorizontal && os.prismHorizontal !== "0.00") ||
                                        (os.prismVertical && os.prismVertical !== "0.00");
                                      
                                      // Extract prescription image URL
                                      const prescriptionImageUrl = rxValues.prescriptionImageUrl || item.prescriptionData.prescriptionImageUrl;
                                      
                                      // Extract lens configuration
                                      const rxConfig = item.prescriptionData.rxConfig || {};
                                      
                                      return (
                                        <div className="mt-3 space-y-3">
                                          {/* Prescription Values Section */}
                                          <div className="border rounded-lg bg-muted/30 overflow-hidden">
                                            <div className="p-3 border-b bg-muted">
                                              <h5 className="font-semibold text-sm flex items-center gap-2 text-brand-blue">
                                                <Glasses className="h-4 w-4" />
                                                Prescription Details
                                              </h5>
                                            </div>
                                            
                                            {/* Main Prescription Table */}
                                            <table className="w-full">
                                              <thead>
                                                <tr className="bg-muted/50 border-b">
                                                  <th className="p-2 text-left text-xs font-medium">Eye</th>
                                                  <th className="p-2 text-center text-xs font-medium">SPH</th>
                                                  <th className="p-2 text-center text-xs font-medium">CYL</th>
                                                  <th className="p-2 text-center text-xs font-medium">AXIS</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                <tr className="border-b">
                                                  <td className="p-2 font-medium text-xs">OD (Right)</td>
                                                  <td className="p-2 text-center text-xs">{od.sph !== '0.00' ? od.sph : "-"}</td>
                                                  <td className="p-2 text-center text-xs">{od.cyl !== '0.00' ? od.cyl : "-"}</td>
                                                  <td className="p-2 text-center text-xs">{od.axis !== '0' ? od.axis : "-"}</td>
                                                </tr>
                                                <tr>
                                                  <td className="p-2 font-medium text-xs">OS (Left)</td>
                                                  <td className="p-2 text-center text-xs">{os.sph !== '0.00' ? os.sph : "-"}</td>
                                                  <td className="p-2 text-center text-xs">{os.cyl !== '0.00' ? os.cyl : "-"}</td>
                                                  <td className="p-2 text-center text-xs">{os.axis !== '0' ? os.axis : "-"}</td>
                                                </tr>
                                              </tbody>
                                            </table>

                                            {/* PD Section */}
                                            <div className="p-3 border-t">
                                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <span className="text-xs font-medium text-muted-foreground">PD (Pupillary Distance)</span>
                                                <span className="text-xs font-medium break-words">
                                                  {hasTwoPDs ? (
                                                    <>
                                                      OD: {pdOd && pdOd !== "" ? `${pdOd} mm` : "N/A"} | 
                                                      OS: {pdOs && pdOs !== "" ? `${pdOs} mm` : "N/A"}
                                                    </>
                                                  ) : (
                                                    <>
                                                      {pd && pd !== "" ? `${pd} mm` : "Not set"}
                                                    </>
                                                  )}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Prism Section - Show if hasPrism is true */}
                                            {hasPrism && (
                                              <div className="p-3 border-t">
                                                <h6 className="text-xs font-semibold mb-2">Prism Correction</h6>
                                                <table className="w-full text-xs">
                                                  <thead>
                                                    <tr className="bg-muted/50 border-b">
                                                      <th className="p-1.5 text-left text-[10px] font-medium">Eye</th>
                                                      <th className="p-1.5 text-center text-[10px] font-medium">H. Prism</th>
                                                      <th className="p-1.5 text-center text-[10px] font-medium">Base</th>
                                                      <th className="p-1.5 text-center text-[10px] font-medium">V. Prism</th>
                                                      <th className="p-1.5 text-center text-[10px] font-medium">Base</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    <tr className="border-b">
                                                      <td className="p-1.5 font-medium text-[10px]">OD (Right)</td>
                                                      <td className="p-1.5 text-center text-[10px]">
                                                        {od.prismHorizontal && od.prismHorizontal !== "0.00" 
                                                          ? od.prismHorizontal 
                                                          : "-"}
                                                      </td>
                                                      <td className="p-1.5 text-center text-[10px]">
                                                        {od.prismHorizontalBase && od.prismHorizontalBase !== "" 
                                                          ? od.prismHorizontalBase 
                                                          : "-"}
                                                      </td>
                                                      <td className="p-1.5 text-center text-[10px]">
                                                        {od.prismVertical && od.prismVertical !== "0.00" 
                                                          ? od.prismVertical 
                                                          : "-"}
                                                      </td>
                                                      <td className="p-1.5 text-center text-[10px]">
                                                        {od.prismVerticalBase && od.prismVerticalBase !== "" 
                                                          ? od.prismVerticalBase 
                                                          : "-"}
                                                      </td>
                                                    </tr>
                                                    <tr>
                                                      <td className="p-1.5 font-medium text-[10px]">OS (Left)</td>
                                                      <td className="p-1.5 text-center text-[10px]">
                                                        {os.prismHorizontal && os.prismHorizontal !== "0.00" 
                                                          ? os.prismHorizontal 
                                                          : "-"}
                                                      </td>
                                                      <td className="p-1.5 text-center text-[10px]">
                                                        {os.prismHorizontalBase && os.prismHorizontalBase !== "" 
                                                          ? os.prismHorizontalBase 
                                                          : "-"}
                                                      </td>
                                                      <td className="p-1.5 text-center text-[10px]">
                                                        {os.prismVertical && os.prismVertical !== "0.00" 
                                                          ? os.prismVertical 
                                                          : "-"}
                                                      </td>
                                                      <td className="p-1.5 text-center text-[10px]">
                                                        {os.prismVerticalBase && os.prismVerticalBase !== "" 
                                                          ? os.prismVerticalBase 
                                                          : "-"}
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}

                                            {/* Prescription Image (if uploaded) */}
                                            {prescriptionImageUrl && (
                                              <div className="p-3 border-t">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">Prescription Image</p>
                                                <div className="relative w-full h-32 bg-muted rounded overflow-hidden">
                                                  <Image
                                                    src={prescriptionImageUrl}
                                                    alt="Prescription"
                                                    fill
                                                    className="object-contain"
                                                    sizes="100%"
                                                  />
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Lens Configuration Section */}
                                          {rxConfig && Object.keys(rxConfig).length > 0 && (
                                            <div className="border rounded-lg bg-blue-50 border-blue-200 p-3">
                                              <p className="font-medium text-blue-900 mb-2 text-sm">Lens Configuration</p>
                                              <div className="text-blue-700 space-y-1 text-xs">
                                                {rxConfig.lensType && (
                                                  <p>
                                                    <span className="font-medium">Lens Type:</span> {
                                                      rxConfig.lensType === "CLEAR" ? "Clear" : 
                                                      rxConfig.lensType === "TINTED" ? "Tinted" :
                                                      rxConfig.lensType === "PHOTOCHROMIC_SOLIS" ? "Photochromic" :
                                                      rxConfig.lensType === "POLARIZED_NUPOLAR" ? "Polarized" : 
                                                      rxConfig.lensType
                                                    }
                                                  </p>
                                                )}
                                                {rxConfig.lensIndex && (
                                                  <p><span className="font-medium">Index:</span> {rxConfig.lensIndex}</p>
                                                )}
                                                {rxConfig.coating && (
                                                  <p><span className="font-medium">Coating:</span> {rxConfig.coating}</p>
                                                )}
                                                {rxConfig.frameType && (
                                                  <p><span className="font-medium">Frame Type:</span> {
                                                    rxConfig.frameType === "FULL_FRAME" ? "Full Frame" :
                                                    rxConfig.frameType === "SEMI_RIMLESS" ? "Semi-Rimless" :
                                                    rxConfig.frameType === "RIMLESS" ? "Rimless" :
                                                    rxConfig.frameType
                                                  }</p>
                                                )}
                                                {rxConfig.tintType && (
                                                  <p><span className="font-medium">Tint Type:</span> {
                                                    rxConfig.tintType === "FULL_TINT_CATALOG" ? "Full Tint (Catalog)" :
                                                    rxConfig.tintType === "GRADIENT" ? "Gradient" :
                                                    rxConfig.tintType
                                                  }</p>
                                                )}
                                                {rxConfig.tintColor && (
                                                  <p><span className="font-medium">Tint Color:</span> {rxConfig.tintColor}</p>
                                                )}
                                                {rxConfig.tintShadePercent && (
                                                  <p><span className="font-medium">Tint Shade:</span> {rxConfig.tintShadePercent}%</p>
                                                )}
                                                {rxConfig.photochromicColor && (
                                                  <p><span className="font-medium">Photochromic Color:</span> {rxConfig.photochromicColor}</p>
                                                )}
                                                {rxConfig.polarizedColor && (
                                                  <p><span className="font-medium">Polarized Color:</span> {rxConfig.polarizedColor}</p>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    <p className="text-sm font-semibold text-brand-blue mt-2">
                                  {order.currency === 'EUR' ? '€' : order.currency === 'USD' ? '$' : '£'}{item.price.toFixed(2)} each
                                      <span className="text-muted-foreground font-normal ml-2">
                                        (Total: {order.currency === 'EUR' ? '€' : order.currency === 'USD' ? '$' : '£'}{item.total.toFixed(2)})
                                      </span>
                                </p>
                              </div>
                              {order.status === "DELIVERED" && (() => {
                                // Check if this product has already been reviewed for this order
                                const hasReview = userReviews.some(
                                  (review) => review.Product?.id === item.productId && review.Order?.id === order.id
                                );
                                const canReview = !hasReview;
                                
                                return canReview ? (
                                  <Button
                                    onClick={() => openReviewDialog(item.productName, item.productId, order.id)}
                                    className="bg-brand-teal text-white hover:bg-brand-teal/90 text-xs py-1 px-2 whitespace-nowrap"
                                  >
                                    Write a Review
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Already reviewed</span>
                                );
                              })()}
                            </div>
                          ))}
                        </div>
                      </div>
                        )}
                      </div>
                    );
                    })
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-brand-h2 font-headline text-brand-blue mb-2">
                        Addresses
                      </h2>
                      <p className="text-muted-foreground">Manage your shipping addresses here.</p>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingAddress(null);
                        setAddressForm({
                          fullName: '',
                          phone: '',
                          addressLine1: '',
                          addressLine2: '',
                          city: '',
                          state: '',
                          postalCode: '',
                          country: 'Ireland',
                          isDefault: false,
                        });
                        setIsAddressDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Address
                    </Button>
                  </div>

                  {isLoadingAddresses ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Loading addresses...</p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-4">No addresses saved yet</p>
                      <Button
                        onClick={() => {
                          setEditingAddress(null);
                          setAddressForm({
                            fullName: '',
                            phone: '',
                            addressLine1: '',
                            addressLine2: '',
                            city: '',
                            state: '',
                            postalCode: '',
                            country: 'Ireland',
                            isDefault: false,
                          });
                          setIsAddressDialogOpen(true);
                        }}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Address
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={cn(
                            "border rounded-lg p-4 relative",
                            address.isDefault && "border-brand-teal border-2"
                          )}
                        >
                          {address.isDefault && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-brand-teal text-white">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            </div>
                          )}
                          <div className="mb-4">
                            <h3 className="text-brand-h3 font-headline text-brand-blue mb-1">{address.fullName}</h3>
                            <p className="text-sm text-muted-foreground">{address.phone}</p>
                          </div>
                          <div className="text-sm text-muted-foreground mb-4 space-y-1">
                            <p>{address.addressLine1}</p>
                            {address.addressLine2 && <p>{address.addressLine2}</p>}
                            <p>
                              {address.city}
                              {address.state && `, ${address.state}`}
                              {address.postalCode && ` ${address.postalCode}`}
                            </p>
                            <p>{address.country}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAddress(address);
                                setAddressForm({
                                  fullName: address.fullName,
                                  phone: address.phone,
                                  addressLine1: address.addressLine1,
                                  addressLine2: address.addressLine2 || '',
                                  city: address.city,
                                  state: address.state || '',
                                  postalCode: address.postalCode,
                                  country: address.country,
                                  isDefault: address.isDefault,
                                });
                                setIsAddressDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            {!address.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const result = await setDefaultAddress(address.id);
                                    if (result.error) {
                                      toast({
                                        title: "Error",
                                        description: result.error,
                                        variant: "destructive",
                                      });
                                    } else {
                                      toast({
                                        title: "Success",
                                        description: "Default address updated",
                                      });
                                      const addressesResult = await getAddresses();
                                      if (addressesResult.addresses) {
                                        setAddresses(addressesResult.addresses);
                                      }
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to set default address",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this address?')) {
                                  return;
                                }
                                try {
                                  const result = await deleteAddress(address.id);
                                  if (result.error) {
                                    toast({
                                      title: "Error",
                                      description: result.error,
                                      variant: "destructive",
                                    });
                                  } else {
                                    toast({
                                      title: "Success",
                                      description: "Address deleted",
                                    });
                                    const addressesResult = await getAddresses();
                                    if (addressesResult.addresses) {
                                      setAddresses(addressesResult.addresses);
                                    }
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete address",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add/Edit Address Dialog */}
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingAddress ? 'Update your shipping address' : 'Add a new shipping address'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            placeholder="+353 123 456 7890"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="addressLine1">Address Line 1 *</Label>
                          <Input
                            id="addressLine1"
                            value={addressForm.addressLine1}
                            onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                            placeholder="Street address, P.O. box"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="addressLine2">Address Line 2</Label>
                          <Input
                            id="addressLine2"
                            value={addressForm.addressLine2}
                            onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                            placeholder="Apartment, suite, unit, building, floor, etc."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City *</Label>
                            <Input
                              id="city"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              placeholder="Dublin"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State/Province</Label>
                            <Input
                              id="state"
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                              placeholder="Leinster"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="postalCode">Postal Code *</Label>
                            <Input
                              id="postalCode"
                              value={addressForm.postalCode}
                              onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                              placeholder="D02 XY12"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country *</Label>
                            <Select
                              value={addressForm.country}
                              onValueChange={(value) => setAddressForm({ ...addressForm, country: value })}
                            >
                              <SelectTrigger id="country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {SCHENGEN_COUNTRIES.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="isDefault" className="cursor-pointer">
                            Set as default address
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddressDialogOpen(false);
                            setEditingAddress(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || !addressForm.city || !addressForm.postalCode) {
                              toast({
                                title: "Error",
                                description: "Please fill in all required fields",
                                variant: "destructive",
                              });
                              return;
                            }

                            try {
                              let result;
                              if (editingAddress) {
                                result = await updateAddress(editingAddress.id, addressForm);
                              } else {
                                result = await addAddress(addressForm);
                              }

                              if (result.error) {
                                toast({
                                  title: "Error",
                                  description: result.error,
                                  variant: "destructive",
                                });
                              } else {
                                toast({
                                  title: "Success",
                                  description: editingAddress ? "Address updated" : "Address added",
                                });
                                setIsAddressDialogOpen(false);
                                setEditingAddress(null);
                                const addressesResult = await getAddresses();
                                if (addressesResult.addresses) {
                                  setAddresses(addressesResult.addresses);
                                }
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to save address",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {editingAddress ? 'Update Address' : 'Add Address'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                    Robin Wallet
                  </h2>
                  <div className="bg-gradient-to-br from-brand-teal to-brand-teal/80 rounded-lg p-6 text-white mb-6">
                    <p className="text-sm opacity-90 mb-1">Current Balance</p>
                    {isLoadingWallet ? (
                      <p className="text-4xl font-headline font-bold">Loading...</p>
                    ) : (
                      <>
                        <p className="text-4xl font-headline font-bold">{formatPrice(walletBalance)}</p>
                        {isNonEurCurrency && (
                          <p className="text-sm opacity-75 mt-1">€{walletBalance.toFixed(2)} (stored in EUR)</p>
                        )}
                      </>
                    )}
                  </div>
                  
                  {walletTransactions.length > 0 ? (
                    <div className="mt-6">
                      <h3 className="text-brand-h3 font-headline mb-4">Transaction History</h3>
                      <div className="space-y-3">
                        {walletTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(transaction.createdAt), 'PPp')}
                              </p>
                            </div>
                            <div className={cn(
                              "text-lg font-semibold",
                              transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                            )}>
                              {transaction.type === 'CREDIT' ? '+' : '-'}{formatPrice(transaction.amount)}
                              {isNonEurCurrency && (
                                <span className="text-xs opacity-70 ml-1">(€{transaction.amount.toFixed(2)})</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {isLoadingWallet ? 'Loading transaction history...' : 'No transactions yet. Your cashback earnings and transaction history will be displayed here.'}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <h2 className="text-brand-h2 font-headline text-brand-blue mb-4">
                    My Reviews {userReviews.length > 0 && `(${userReviews.length})`}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    View all your product reviews here. Reviews for deleted products will show as "Product no longer available".
                  </p>
                  {userReviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reviews yet. Write a review from your orders page!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userReviews.map((review: any) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-brand-h3 font-headline">{review.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {review.rating}/5
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.Product ? (
                                <Link
                                  href={`/shop/${review.Product.slug}`}
                                  className="text-sm text-brand-blue hover:underline"
                                >
                                  Product: {review.Product.name}
                                </Link>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  Product: Product no longer available
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(review.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <p className="text-sm text-foreground/80 mt-2">{review.comment}</p>
                          {review.images && review.images.length > 0 && (
                            <div className="mt-3 flex gap-2 flex-wrap">
                              {review.images.map((image: string, index: number) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Review image ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded border"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'account-details' && (
                <div className="space-y-6">
                  {/* Section 1: Personal Information */}
                  <div className="bg-white border border-border rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-brand-h2 font-headline text-brand-blue">
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
                      <h2 className="text-brand-h2 font-headline text-brand-blue mb-6">
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
                    <h2 className="text-brand-h2 font-headline text-brand-blue mb-2">
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
              <Button type="submit" className="bg-brand-teal text-white hover:bg-brand-teal/90" disabled={isSubmittingReview}>
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

