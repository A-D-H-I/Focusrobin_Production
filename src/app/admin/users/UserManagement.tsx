"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  User, 
  ChevronDown, 
  ChevronRight, 
  ShoppingCart, 
  Heart, 
  Star, 
  Mail, 
  Calendar,
  Shield,
  Edit,
  Trash2,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/normalize-image-url';
import { 
  updateUserRole, 
  deleteUser, 
  updateUserDetails,
  updateCartItemQuantity,
  deleteCartItem,
  deleteWishlistItem,
  updateReview,
  deleteReview,
  deleteSession,
  deleteAccount,
  updateWalletBalance,
  revokeWalletTransaction,
  setWalletBalance,
  updateWalletTransaction
} from '@/app/actions/users';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  accounts: any[];
  sessions: any[];
  cart: {
    id: string;
    items: Array<{
      id: string;
      quantity: number;
      Product: any;
    }>;
  } | null;
  wishlist: Array<{
    id: string;
    productId: string;
    createdAt: Date;
    Product: any;
  }>;
  Review: Array<{
    id: string;
    rating: number;
    title: string;
    comment: string;
    createdAt: Date;
    Product: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
  wallet: {
    id: string;
    balance: number;
    transactions: Array<{
      id: string;
      amount: number;
      type: string;
      description: string;
      createdAt: Date;
    }>;
  } | null;
}

interface UserManagementProps {
  users: UserData[];
  currentUserId?: string;
}

export default function UserManagement({ users, currentUserId }: UserManagementProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [editingUserDetails, setEditingUserDetails] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [editingCartItem, setEditingCartItem] = useState<string | null>(null);
  const [cartItemQuantity, setCartItemQuantity] = useState<number>(1);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [walletAmount, setWalletAmount] = useState<number>(0);
  const [walletDescription, setWalletDescription] = useState<string>('');
  const [settingWalletBalance, setSettingWalletBalance] = useState<string | null>(null);
  const [newWalletBalance, setNewWalletBalance] = useState<number>(0);
  const [revokingTransaction, setRevokingTransaction] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [transactionAmount, setTransactionAmount] = useState<number>(0);
  const [transactionType, setTransactionType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [transactionDescription, setTransactionDescription] = useState<string>('');
  const { toast } = useToast();

  const toggleUser = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleRoleUpdate = async (userId: string) => {
    if (!newRole) return;
    
    try {
      const result = await updateUserRole(userId, newRole);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User role updated successfully",
        });
        setEditingUser(null);
        setNewRole('');
        // Reload page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteUser(userId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        // Reload page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserDetails = async (userId: string) => {
    try {
      const result = await updateUserDetails(userId, userName, userEmail);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User details updated successfully",
        });
        setEditingUserDetails(null);
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user details",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCartItem = async (cartItemId: string) => {
    try {
      const result = await updateCartItemQuantity(cartItemId, cartItemQuantity);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Cart item updated successfully",
        });
        setEditingCartItem(null);
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCartItem = async (cartItemId: string) => {
    if (!confirm('Are you sure you want to remove this item from the cart?')) {
      return;
    }

    try {
      const result = await deleteCartItem(cartItemId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Cart item removed successfully",
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cart item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWishlistItem = async (wishlistItemId: string) => {
    if (!confirm('Are you sure you want to remove this item from the wishlist?')) {
      return;
    }

    try {
      const result = await deleteWishlistItem(wishlistItemId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Wishlist item removed successfully",
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete wishlist item",
        variant: "destructive",
      });
    }
  };

  const handleUpdateReview = async (reviewId: string) => {
    try {
      const result = await updateReview(reviewId, reviewRating, reviewTitle, reviewComment);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Review updated successfully",
        });
        setEditingReview(null);
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update review",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const result = await deleteReview(reviewId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Review deleted successfully",
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? The user will be logged out.')) {
      return;
    }

    try {
      const result = await deleteSession(sessionId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Session deleted successfully",
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this OAuth account? The user may need to reconnect.')) {
      return;
    }

    try {
      const result = await deleteAccount(accountId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account deleted successfully",
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWallet = async (userId: string) => {
    if (walletAmount === 0) {
      toast({
        title: "Error",
        description: "Amount cannot be zero",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateWalletBalance(userId, walletAmount, walletDescription || 'Admin adjustment');
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Wallet balance updated. New balance: €${result.newBalance?.toFixed(2) || '0.00'}`,
        });
        setEditingWallet(null);
        setWalletAmount(0);
        setWalletDescription('');
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wallet balance",
        variant: "destructive",
      });
    }
  };

  const handleSetWalletBalance = async (userId: string) => {
    if (newWalletBalance < 0) {
      toast({
        title: "Error",
        description: "Balance cannot be negative",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await setWalletBalance(userId, newWalletBalance, walletDescription || `Admin set balance to €${newWalletBalance.toFixed(2)}`);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Wallet balance set to €${result.newBalance?.toFixed(2)}`,
        });
        setSettingWalletBalance(null);
        setNewWalletBalance(0);
        setWalletDescription('');
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set wallet balance",
        variant: "destructive",
      });
    }
  };

  const handleRevokeTransaction = async (transactionId: string, userId: string) => {
    if (!confirm("Are you sure you want to revoke this transaction? This action cannot be undone.")) {
      return;
    }

    setRevokingTransaction(transactionId);
    try {
      const result = await revokeWalletTransaction(transactionId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Transaction revoked. New balance: €${result.newBalance?.toFixed(2)}`,
        });
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke transaction",
        variant: "destructive",
      });
    } finally {
      setRevokingTransaction(null);
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction.id);
    setTransactionAmount(Number(transaction.amount));
    setTransactionType(transaction.type);
    setTransactionDescription(transaction.description);
  };

  const handleUpdateTransaction = async (transactionId: string) => {
    if (transactionAmount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    if (!transactionDescription.trim()) {
      toast({
        title: "Error",
        description: "Description is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateWalletTransaction(
        transactionId,
        transactionAmount,
        transactionType,
        transactionDescription
      );
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Transaction updated. New balance: €${result.newBalance?.toFixed(2)}`,
        });
        setEditingTransaction(null);
        setTransactionAmount(0);
        setTransactionType('CREDIT');
        setTransactionDescription('');
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage all user accounts, permissions, and related data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
            <CardDescription>
              Click on a user to view their cart, wishlist, reviews, and other details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => {
                const isExpanded = expandedUsers.has(user.id);
                const cartItemCount = (user.cart?.items && Array.isArray(user.cart.items)) ? user.cart.items.length : 0;
                const wishlistCount = (user.wishlist && Array.isArray(user.wishlist)) ? user.wishlist.length : 0;
                const reviewCount = (user.Review && Array.isArray(user.Review)) ? user.Review.length : 0;
                const sessionCount = (user.sessions && Array.isArray(user.sessions)) ? user.sessions.length : 0;
                const accountCount = (user.accounts && Array.isArray(user.accounts)) ? user.accounts.length : 0;

                return (
                  <div key={user.id} className="border rounded-lg">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleUser(user.id)}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {user.image ? (
                                <Image
                                  src={normalizeImageUrl(user.image)}
                                  alt={user.name || user.email}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{user.name || 'No name'}</p>
                                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                    {user.role}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="h-4 w-4" />
                              <span>{cartItemCount} items</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              <span>{wishlistCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              <span>{reviewCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{accountCount} accounts</span>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 pt-0 space-y-6 border-t">
                          {/* User Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  User Information
                                </h3>
                                <Dialog open={editingUserDetails === user.id} onOpenChange={(open) => {
                                  if (!open) setEditingUserDetails(null);
                                  else {
                                    setEditingUserDetails(user.id);
                                    setUserName(user.name || '');
                                    setUserEmail(user.email);
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit User Details</DialogTitle>
                                      <DialogDescription>
                                        Update user information for {user.email}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="user-name">Name</Label>
                                        <Input
                                          id="user-name"
                                          value={userName}
                                          onChange={(e) => setUserName(e.target.value)}
                                          placeholder="User name"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="user-email">Email</Label>
                                        <Input
                                          id="user-email"
                                          type="email"
                                          value={userEmail}
                                          onChange={(e) => setUserEmail(e.target.value)}
                                          placeholder="user@example.com"
                                        />
                                      </div>
                                      <Button
                                        onClick={() => handleUpdateUserDetails(user.id)}
                                        disabled={userName === (user.name || '') && userEmail === user.email}
                                      >
                                        Update Details
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">ID:</span> {user.id}</p>
                                <p><span className="font-medium">Email:</span> {user.email}</p>
                                <p><span className="font-medium">Name:</span> {user.name || 'Not set'}</p>
                                <p><span className="font-medium">Role:</span> {user.role}</p>
                                <p><span className="font-medium">Email Verified:</span> {user.emailVerified ? format(new Date(user.emailVerified), 'PPp') : 'Not verified'}</p>
                                <p><span className="font-medium">Created:</span> {format(new Date(user.createdAt), 'PPp')}</p>
                                <p><span className="font-medium">Last Updated:</span> {format(new Date(user.updatedAt), 'PPp')}</p>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Actions
                              </h3>
                              <div className="flex gap-2">
                                <Dialog open={editingUser === user.id} onOpenChange={(open) => {
                                  if (!open) setEditingUser(null);
                                  else {
                                    setEditingUser(user.id);
                                    setNewRole(user.role);
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-4 w-4 mr-2" />
                                      Change Role
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Change User Role</DialogTitle>
                                      <DialogDescription>
                                        Update the role for {user.email}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-sm font-medium">Current Role</label>
                                        <p className="text-sm text-muted-foreground">{user.role}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">New Role</label>
                                        <select
                                          value={newRole}
                                          onChange={(e) => setNewRole(e.target.value)}
                                          className="w-full mt-1 px-3 py-2 border rounded-md"
                                        >
                                          <option value="USER">USER</option>
                                          <option value="ADMIN">ADMIN</option>
                                        </select>
                                      </div>
                                      <Button
                                        onClick={() => handleRoleUpdate(user.id)}
                                        disabled={newRole === user.role}
                                      >
                                        Update Role
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id, user.email)}
                                  disabled={currentUserId === user.id}
                                  title={currentUserId === user.id ? "You cannot delete your own account" : "Delete User"}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Accounts */}
                          {user.accounts && Array.isArray(user.accounts) && user.accounts.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2">OAuth Accounts ({user.accounts.length})</h3>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Provider Account ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {user.accounts.map((account: any) => (
                                    <TableRow key={account.id}>
                                      <TableCell className="font-medium">{account.provider}</TableCell>
                                      <TableCell>{account.providerAccountId}</TableCell>
                                      <TableCell>{account.type}</TableCell>
                                      <TableCell>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleDeleteAccount(account.id)}
                                          disabled={currentUserId === user.id}
                                          title={currentUserId === user.id ? "You cannot delete your own OAuth account" : "Delete OAuth Account"}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Active Sessions */}
                          {user.sessions && Array.isArray(user.sessions) && user.sessions.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2">Active Sessions ({sessionCount})</h3>
                              <div className="space-y-2">
                                {user.sessions.map((session: any) => (
                                  <div key={session.id} className="p-2 bg-muted rounded text-sm flex items-center justify-between">
                                    <div>
                                      <p><span className="font-medium">Session ID:</span> {session.id.substring(0, 20)}...</p>
                                      <p><span className="font-medium">Expires:</span> {format(new Date(session.expires), 'PPp')}</p>
                                    </div>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteSession(session.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Revoke
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cart Items */}
                          {user.cart && user.cart.items && Array.isArray(user.cart.items) && user.cart.items.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Shopping Cart ({cartItemCount} items)
                              </h3>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {user.cart.items.map((item: any) => {
                                    const product = item.Product;
                                    const variant = product.ProductVariant.find((v: any) => v.id === item.Product.ProductVariant[0]?.id);
                                    const price = Number(product.basePrice);
                                    return (
                                      <TableRow key={item.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{variant?.name || variant?.colorName || 'N/A'}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>€{(price * item.quantity).toFixed(2)}</TableCell>
                                        <TableCell>
                                          <div className="flex gap-2">
                                            <Dialog open={editingCartItem === item.id} onOpenChange={(open) => {
                                              if (!open) setEditingCartItem(null);
                                              else {
                                                setEditingCartItem(item.id);
                                                setCartItemQuantity(item.quantity);
                                              }
                                            }}>
                                              <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent>
                                                <DialogHeader>
                                                  <DialogTitle>Edit Cart Item Quantity</DialogTitle>
                                                  <DialogDescription>
                                                    Update quantity for {product.name}
                                                  </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                  <div>
                                                    <Label htmlFor="cart-quantity">Quantity</Label>
                                                    <Input
                                                      id="cart-quantity"
                                                      type="number"
                                                      min="1"
                                                      value={cartItemQuantity}
                                                      onChange={(e) => setCartItemQuantity(parseInt(e.target.value) || 1)}
                                                    />
                                                  </div>
                                                  <Button
                                                    onClick={() => handleUpdateCartItem(item.id)}
                                                    disabled={cartItemQuantity === item.quantity}
                                                  >
                                                    Update Quantity
                                                  </Button>
                                                </div>
                                              </DialogContent>
                                            </Dialog>
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => handleDeleteCartItem(item.id)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Wishlist */}
                          {user.wishlist && Array.isArray(user.wishlist) && user.wishlist.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Heart className="h-4 w-4" />
                                Wishlist ({wishlistCount} items)
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {user.wishlist.map((wishlistItem: any) => {
                                  const product = wishlistItem.Product;
                                  const variant = product.ProductVariant[0];
                                  const asset = variant?.ProductAsset.find((a: any) => a.type === 'GALLERY') || variant?.ProductAsset[0];
                                  return (
                                    <div key={wishlistItem.id} className="border rounded-lg p-3">
                                      <div className="flex items-center gap-3">
                                        {asset && (
                                          <Image
                                            src={normalizeImageUrl(asset.url)}
                                            alt={product.name}
                                            width={60}
                                            height={60}
                                            className="rounded object-cover"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{product.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Added {format(new Date(wishlistItem.createdAt), 'PP')}
                                          </p>
                                        </div>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleDeleteWishlistItem(wishlistItem.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Reviews */}
                          {user.Review && Array.isArray(user.Review) && user.Review.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Star className="h-4 w-4" />
                                Reviews ({reviewCount})
                              </h3>
                              <div className="space-y-3">
                                {user.Review.map((review: any) => (
                                  <div key={review.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                className={`h-4 w-4 ${
                                                  i < review.rating
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-muted-foreground'
                                                }`}
                                              />
                                            ))}
                                          </div>
                                          <span className="font-medium">{review.title}</span>
                                        </div>
                                        {review.Product && (
                                          <p className="text-sm text-muted-foreground">
                                            For: {review.Product.name}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(review.createdAt), 'PP')}
                                        </span>
                                        <Dialog open={editingReview === review.id} onOpenChange={(open) => {
                                          if (!open) setEditingReview(null);
                                          else {
                                            setEditingReview(review.id);
                                            setReviewRating(review.rating);
                                            setReviewTitle(review.title);
                                            setReviewComment(review.comment);
                                          }
                                        }}>
                                          <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                              <DialogTitle>Edit Review</DialogTitle>
                                              <DialogDescription>
                                                Update review for {review.Product?.name || 'product'}
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                              <div>
                                                <Label htmlFor="review-rating">Rating</Label>
                                                <select
                                                  id="review-rating"
                                                  value={reviewRating}
                                                  onChange={(e) => setReviewRating(parseInt(e.target.value))}
                                                  className="w-full mt-1 px-3 py-2 border rounded-md"
                                                >
                                                  <option value={1}>1 Star</option>
                                                  <option value={2}>2 Stars</option>
                                                  <option value={3}>3 Stars</option>
                                                  <option value={4}>4 Stars</option>
                                                  <option value={5}>5 Stars</option>
                                                </select>
                                              </div>
                                              <div>
                                                <Label htmlFor="review-title">Title</Label>
                                                <Input
                                                  id="review-title"
                                                  value={reviewTitle}
                                                  onChange={(e) => setReviewTitle(e.target.value)}
                                                  placeholder="Review title"
                                                />
                                              </div>
                                              <div>
                                                <Label htmlFor="review-comment">Comment</Label>
                                                <Textarea
                                                  id="review-comment"
                                                  value={reviewComment}
                                                  onChange={(e) => setReviewComment(e.target.value)}
                                                  placeholder="Review comment"
                                                  rows={4}
                                                />
                                              </div>
                                              <Button
                                                onClick={() => handleUpdateReview(review.id)}
                                                disabled={
                                                  reviewRating === review.rating &&
                                                  reviewTitle === review.title &&
                                                  reviewComment === review.comment
                                                }
                                              >
                                                Update Review
                                              </Button>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleDeleteReview(review.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-sm">{review.comment}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Wallet Section */}
                          <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                              <Wallet className="h-4 w-4" /> Wallet
                              <div className="flex gap-1 ml-2">
                                <Dialog open={editingWallet === user.id} onOpenChange={(open) => {
                                  if (!open) {
                                    setEditingWallet(null);
                                    setWalletAmount(0);
                                    setWalletDescription('');
                                  } else {
                                    setEditingWallet(user.id);
                                    setWalletAmount(0);
                                    setWalletDescription('');
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Add/Subtract Wallet Balance</DialogTitle>
                                      <DialogDescription>
                                        Enter positive amount to add funds, negative to deduct. Current balance: €{user.wallet ? Number(user.wallet.balance).toFixed(2) : '0.00'}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="wallet-amount">Amount (€)</Label>
                                        <Input
                                          id="wallet-amount"
                                          type="number"
                                          step="0.01"
                                          value={walletAmount}
                                          onChange={(e) => setWalletAmount(parseFloat(e.target.value) || 0)}
                                          placeholder="Enter amount (positive to add, negative to deduct)"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="wallet-description">Description</Label>
                                        <Input
                                          id="wallet-description"
                                          value={walletDescription}
                                          onChange={(e) => setWalletDescription(e.target.value)}
                                          placeholder="Transaction description (optional)"
                                        />
                                      </div>
                                      <Button onClick={() => handleUpdateWallet(user.id)}>
                                        Update Wallet
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Dialog open={settingWalletBalance === user.id} onOpenChange={(open) => {
                                  if (!open) {
                                    setSettingWalletBalance(null);
                                    setNewWalletBalance(user.wallet ? Number(user.wallet.balance) : 0);
                                    setWalletDescription('');
                                  } else {
                                    setSettingWalletBalance(user.id);
                                    setNewWalletBalance(user.wallet ? Number(user.wallet.balance) : 0);
                                    setWalletDescription('');
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Shield className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Set Wallet Balance</DialogTitle>
                                      <DialogDescription>
                                        Set the wallet balance to a specific amount. Current balance: €{user.wallet ? Number(user.wallet.balance).toFixed(2) : '0.00'}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="new-wallet-balance">New Balance (€)</Label>
                                        <Input
                                          id="new-wallet-balance"
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={newWalletBalance}
                                          onChange={(e) => setNewWalletBalance(parseFloat(e.target.value) || 0)}
                                          placeholder="Enter new balance"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="set-balance-description">Description</Label>
                                        <Input
                                          id="set-balance-description"
                                          value={walletDescription}
                                          onChange={(e) => setWalletDescription(e.target.value)}
                                          placeholder="Transaction description (optional)"
                                        />
                                      </div>
                                      <Button onClick={() => handleSetWalletBalance(user.id)}>
                                        Set Balance
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </h3>
                            <div className="bg-gradient-to-br from-brand-teal to-brand-teal/80 rounded-lg p-4 text-white mb-4">
                              <p className="text-sm opacity-90 mb-1">Current Balance</p>
                              <p className="text-2xl font-headline font-bold">
                                €{user.wallet ? Number(user.wallet.balance).toFixed(2) : '0.00'}
                              </p>
                            </div>
                            {user.wallet && user.wallet.transactions && user.wallet.transactions.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-2">Recent Transactions</h4>
                                <div className="space-y-2">
                                  {user.wallet.transactions.slice(0, 10).map((transaction) => (
                                    <div key={transaction.id}>
                                      {editingTransaction === transaction.id ? (
                                        <Dialog open={true} onOpenChange={(open) => {
                                          if (!open) {
                                            setEditingTransaction(null);
                                            setTransactionAmount(0);
                                            setTransactionType('CREDIT');
                                            setTransactionDescription('');
                                          }
                                        }}>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Edit Transaction</DialogTitle>
                                              <DialogDescription>
                                                Update transaction details. The wallet balance will be recalculated automatically.
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                              <div>
                                                <Label htmlFor="edit-transaction-amount">Amount (€)</Label>
                                                <Input
                                                  id="edit-transaction-amount"
                                                  type="number"
                                                  step="0.01"
                                                  min="0.01"
                                                  value={transactionAmount}
                                                  onChange={(e) => setTransactionAmount(parseFloat(e.target.value) || 0)}
                                                  placeholder="Enter amount"
                                                />
                                              </div>
                                              <div>
                                                <Label htmlFor="edit-transaction-type">Type</Label>
                                                <Select value={transactionType} onValueChange={(value: 'CREDIT' | 'DEBIT') => setTransactionType(value)}>
                                                  <SelectTrigger>
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="CREDIT">Credit (Add Money)</SelectItem>
                                                    <SelectItem value="DEBIT">Debit (Deduct Money)</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label htmlFor="edit-transaction-description">Description</Label>
                                                <Input
                                                  id="edit-transaction-description"
                                                  value={transactionDescription}
                                                  onChange={(e) => setTransactionDescription(e.target.value)}
                                                  placeholder="Transaction description"
                                                />
                                              </div>
                                              <div className="flex gap-2">
                                                <Button onClick={() => handleUpdateTransaction(transaction.id)}>
                                                  Save Changes
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  onClick={() => {
                                                    setEditingTransaction(null);
                                                    setTransactionAmount(0);
                                                    setTransactionType('CREDIT');
                                                    setTransactionDescription('');
                                                  }}
                                                >
                                                  Cancel
                                                </Button>
                                              </div>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      ) : (
                                        <div className="flex items-center justify-between p-2 border rounded text-sm">
                                          <div className="flex-1">
                                            <p className="font-medium">{transaction.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {format(new Date(transaction.createdAt), 'PPp')}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className={cn(
                                              "font-semibold",
                                              transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                                            )}>
                                              {transaction.type === 'CREDIT' ? '+' : '-'}€{Number(transaction.amount).toFixed(2)}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditTransaction(transaction)}
                                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleRevokeTransaction(transaction.id, user.id)}
                                              disabled={revokingTransaction === transaction.id}
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                              {revokingTransaction === transaction.id ? (
                                                "Revoking..."
                                              ) : (
                                                <Trash2 className="h-3 w-3" />
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Empty States */}
                          {cartItemCount === 0 && wishlistCount === 0 && reviewCount === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No cart items, wishlist items, or reviews for this user.</p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

