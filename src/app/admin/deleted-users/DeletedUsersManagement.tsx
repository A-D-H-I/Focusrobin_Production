"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, ChevronDown, ChevronRight, Trash2, Mail, Calendar, Shield, ShoppingCart, Heart, Star, Wallet, MapPin, AlertTriangle, Package } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/normalize-image-url';
import { permanentlyDeleteUser } from '@/app/actions/users';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DeletedUserData {
  id: string;
  originalUserId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
  deletedAt: Date;
  userData: any;
  accountsData: any;
  sessionsData: any;
  cartData: any;
  wishlistData: any;
  walletData: any;
  reviewsData: any;
  addressesData: any;
}

interface DeletedUsersManagementProps {
  deletedUsers: DeletedUserData[];
  error?: string;
  currentUserId?: string;
}

export default function DeletedUsersManagement({ deletedUsers, error, currentUserId }: DeletedUsersManagementProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleUser = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const handlePermanentDelete = async (deletedUserId: string, userEmail: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete the archived data for ${userEmail}? This action cannot be undone and all archived data will be lost forever.`)) {
      return;
    }

    // Double confirmation
    if (!confirm('This is your final warning. The archived user data will be permanently deleted. This cannot be undone. Continue?')) {
      return;
    }

    setDeletingUserId(deletedUserId);
    try {
      const result = await permanentlyDeleteUser(deletedUserId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Archived user data permanently deleted",
        });
        window.location.reload();
      }
    } catch (error) {
      console.error("Error permanently deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to permanently delete user",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const parseJsonData = (data: any) => {
    if (!data) return null;
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      return data;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Deleted Users Archive</h1>
          <p className="mt-2 text-muted-foreground">
            View archived user data and permanently delete if needed
          </p>
        </div>

        {error ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <p className="text-destructive font-semibold mb-2">Error Loading Deleted Users</p>
                <p className="text-muted-foreground mb-4">{error}</p>
                <p className="text-sm text-muted-foreground">
                  If you see this error, it likely means the Prisma client needs to be regenerated.
                  <br />
                  Please run: <code className="bg-muted px-2 py-1 rounded">npx prisma generate</code>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : deletedUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trash2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No deleted users found</p>
              <p className="text-sm text-muted-foreground mt-2">
                When users delete their accounts, their data will be archived here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Archived Users ({deletedUsers.length})</CardTitle>
              <CardDescription>
                Click on a user to view their archived data. Use the permanent delete button to remove archived data forever.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deletedUsers.map((deletedUser) => {
                  const isExpanded = expandedUsers.has(deletedUser.id);
                  const userData = parseJsonData(deletedUser.userData);
                  const accountsData = parseJsonData(deletedUser.accountsData) || [];
                  const sessionsData = parseJsonData(deletedUser.sessionsData) || [];
                  const cartData = parseJsonData(deletedUser.cartData);
                  const wishlistData = parseJsonData(deletedUser.wishlistData) || [];
                  const walletData = parseJsonData(deletedUser.walletData);
                  const reviewsData = parseJsonData(deletedUser.reviewsData) || [];
                  const addressesData = parseJsonData(deletedUser.addressesData) || [];

                  const cartItemCount = cartData?.items?.length || 0;
                  const wishlistCount = wishlistData?.length || 0;
                  const reviewCount = reviewsData?.length || 0;
                  const walletBalance = walletData?.balance ? Number(walletData.balance) : 0;

                  return (
                    <div key={deletedUser.id} className="border rounded-lg">
                      <Collapsible open={isExpanded} onOpenChange={() => toggleUser(deletedUser.id)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              {deletedUser.image ? (
                                <Image
                                  src={normalizeImageUrl(deletedUser.image)}
                                  alt={deletedUser.name || deletedUser.email}
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
                                  <span className="font-semibold">{deletedUser.name || deletedUser.email}</span>
                                  <Badge variant="destructive">DELETED</Badge>
                                  <Badge variant={deletedUser.role === "ADMIN" ? "default" : "secondary"}>
                                    {deletedUser.role}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{deletedUser.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="h-4 w-4" /> {cartItemCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-4 w-4" /> {wishlistCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4" /> {reviewCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Wallet className="h-4 w-4" /> €{walletBalance.toFixed(2)}
                              </span>
                              <span className="text-xs">
                                Deleted: {format(new Date(deletedUser.deletedAt), 'PPp')}
                              </span>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 pt-0 space-y-6 border-t">
                            {/* Summary Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm text-muted-foreground">Cart Items</p>
                                <p className="text-2xl font-bold">{cartItemCount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Wishlist Items</p>
                                <p className="text-2xl font-bold">{wishlistCount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Reviews</p>
                                <p className="text-2xl font-bold">{reviewCount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                                <p className="text-2xl font-bold">€{walletBalance.toFixed(2)}</p>
                              </div>
                            </div>

                            {/* User Information */}
                            <div>
                              <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <User className="h-4 w-4" /> User Information
                              </h3>
                              <div className="flex items-start gap-4 mb-4">
                                {deletedUser.image && (
                                  <Image
                                    src={normalizeImageUrl(deletedUser.image)}
                                    alt={deletedUser.name || deletedUser.email}
                                    width={80}
                                    height={80}
                                    className="rounded-full"
                                  />
                                )}
                                <div className="grid grid-cols-2 gap-4 text-sm flex-1">
                                  <div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <p className="font-medium">{deletedUser.email}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Name:</span>
                                    <p className="font-medium">{deletedUser.name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Role:</span>
                                    <p className="font-medium">{deletedUser.role}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Email Verified:</span>
                                    <p className="font-medium">
                                      {deletedUser.emailVerified 
                                        ? format(new Date(deletedUser.emailVerified), 'PPp')
                                        : 'Not verified'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Original User ID:</span>
                                    <p className="font-medium font-mono text-xs break-all">{deletedUser.originalUserId}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Account Created:</span>
                                    <p className="font-medium">{format(new Date(deletedUser.createdAt), 'PPp')}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Account Deleted:</span>
                                    <p className="font-medium">{format(new Date(deletedUser.deletedAt), 'PPp')}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Account Age:</span>
                                    <p className="font-medium">
                                      {Math.floor((new Date(deletedUser.deletedAt).getTime() - new Date(deletedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* OAuth Accounts */}
                            {Array.isArray(accountsData) && accountsData.length > 0 && (
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                  <Mail className="h-4 w-4" /> OAuth Accounts ({accountsData.length})
                                </h3>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Provider</TableHead>
                                      <TableHead>Provider Account ID</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {accountsData.map((account: any, idx: number) => (
                                      <TableRow key={idx}>
                                        <TableCell>{account.provider}</TableCell>
                                        <TableCell className="font-mono text-xs">{account.providerAccountId}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}

                            {/* Sessions */}
                            {Array.isArray(sessionsData) && sessionsData.length > 0 && (
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" /> Sessions ({sessionsData.length})
                                </h3>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Session Token</TableHead>
                                      <TableHead>Expires</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sessionsData.map((session: any, idx: number) => (
                                      <TableRow key={idx}>
                                        <TableCell className="font-mono text-xs">{session.sessionToken?.substring(0, 20)}...</TableCell>
                                        <TableCell>{format(new Date(session.expires), 'PPp')}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}

                            {/* Cart */}
                            {cartData && cartData.items && Array.isArray(cartData.items) && cartData.items.length > 0 && (
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                  <ShoppingCart className="h-4 w-4" /> Shopping Cart ({cartItemCount} items)
                                </h3>
                                <div className="space-y-4">
                                  {cartData.items.map((item: any, idx: number) => {
                                    const product = item.Product;
                                    const variant = product?.ProductVariant?.[0];
                                    const asset = variant?.ProductAsset?.find((a: any) => a.type === 'GALLERY') || variant?.ProductAsset?.[0];
                                    const price = variant?.price ? Number(variant.price) : (product?.basePrice ? Number(product.basePrice) : 0);
                                    const totalPrice = price * item.quantity;
                                    
                                    return (
                                      <div key={idx} className="border rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                          {asset && (
                                            <Image
                                              src={normalizeImageUrl(asset.url)}
                                              alt={product?.name || 'Product'}
                                              width={80}
                                              height={80}
                                              className="rounded object-cover"
                                            />
                                          )}
                                          <div className="flex-1">
                                            <h4 className="font-semibold">{product?.name || 'N/A'}</h4>
                                            {variant && (
                                              <p className="text-sm text-muted-foreground">
                                                Variant: {variant.name} ({variant.colorName}) - SKU: {variant.sku}
                                              </p>
                                            )}
                                            <div className="mt-2 flex items-center gap-4 text-sm">
                                              <span className="text-muted-foreground">Quantity: <span className="font-medium">{item.quantity}</span></span>
                                              <span className="text-muted-foreground">Price: <span className="font-medium">€{price.toFixed(2)}</span></span>
                                              <span className="text-muted-foreground">Total: <span className="font-medium">€{totalPrice.toFixed(2)}</span></span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Wishlist */}
                            {Array.isArray(wishlistData) && wishlistData.length > 0 && (
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                  <Heart className="h-4 w-4" /> Wishlist ({wishlistCount} items)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {wishlistData.map((item: any, idx: number) => {
                                    const product = item.Product;
                                    const variant = product?.ProductVariant?.[0];
                                    const asset = variant?.ProductAsset?.find((a: any) => a.type === 'GALLERY') || variant?.ProductAsset?.[0];
                                    const price = variant?.price ? Number(variant.price) : (product?.basePrice ? Number(product.basePrice) : 0);
                                    
                                    return (
                                      <div key={idx} className="border rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                          {asset && (
                                            <Image
                                              src={normalizeImageUrl(asset.url)}
                                              alt={product?.name || 'Product'}
                                              width={60}
                                              height={60}
                                              className="rounded object-cover"
                                            />
                                          )}
                                          <div className="flex-1">
                                            <p className="font-medium text-sm">{product?.name || 'N/A'}</p>
                                            {variant && (
                                              <p className="text-xs text-muted-foreground">
                                                {variant.name} ({variant.colorName})
                                              </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                              €{price.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Added: {format(new Date(item.createdAt), 'PP')}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Wallet */}
                            {walletData && (
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                  <Wallet className="h-4 w-4" /> Robin Wallet (Balance: €{walletBalance.toFixed(2)})
                                </h3>
                                {walletData.transactions && Array.isArray(walletData.transactions) && walletData.transactions.length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {walletData.transactions.map((transaction: any, idx: number) => (
                                        <TableRow key={idx}>
                                          <TableCell className={cn("font-medium", transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600')}>
                                            {transaction.type === 'CREDIT' ? '+' : '-'}€{Number(transaction.amount).toFixed(2)}
                                          </TableCell>
                                          <TableCell>{transaction.type}</TableCell>
                                          <TableCell>{transaction.description}</TableCell>
                                          <TableCell>{format(new Date(transaction.createdAt), 'PPp')}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <p className="text-muted-foreground text-sm">No transactions.</p>
                                )}
                              </div>
                            )}

                            {/* Reviews */}
                            {Array.isArray(reviewsData) && reviewsData.length > 0 && (
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                  <Star className="h-4 w-4" /> Reviews ({reviewCount})
                                </h3>
                                <div className="space-y-4">
                                  {reviewsData.map((review: any, idx: number) => (
                                    <div key={idx} className="border rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{review.Product?.name || 'N/A'}</span>
                                            <div className="flex">
                                              {[...Array(5)].map((_, i) => (
                                                <Star
                                                  key={i}
                                                  className={cn("h-4 w-4", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
                                                />
                                              ))}
                                            </div>
                                          </div>
                                          <p className="font-semibold text-sm mb-1">{review.title}</p>
                                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(review.createdAt), 'PP')}
                                        </span>
                                      </div>
                                      {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                                        <div className="flex gap-2 mt-3 flex-wrap">
                                          {review.images.map((imageUrl: string, imgIdx: number) => (
                                            <Image
                                              key={imgIdx}
                                              src={normalizeImageUrl(imageUrl)}
                                              alt={`Review image ${imgIdx + 1}`}
                                              width={80}
                                              height={80}
                                              className="rounded object-cover"
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Addresses */}
                            {Array.isArray(addressesData) && addressesData.length > 0 && (
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                  <MapPin className="h-4 w-4" /> Addresses ({addressesData.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {addressesData.map((address: any, idx: number) => (
                                    <div 
                                      key={idx} 
                                      className={cn(
                                        "border rounded-lg p-4",
                                        address.isDefault && "border-brand-teal border-2"
                                      )}
                                    >
                                      {address.isDefault && (
                                        <Badge variant="secondary" className="mb-2">
                                          <Star className="h-3 w-3 mr-1" />
                                          Default Address
                                        </Badge>
                                      )}
                                      <div className="mb-3">
                                        <h4 className="font-semibold text-brand-blue">{address.fullName}</h4>
                                        <p className="text-sm text-muted-foreground">{address.phone}</p>
                                      </div>
                                      <div className="text-sm text-muted-foreground space-y-1">
                                        <p className="font-medium">{address.addressLine1}</p>
                                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                                        <p>
                                          {address.city}
                                          {address.state && `, ${address.state}`}
                                          {address.postalCode && ` ${address.postalCode}`}
                                        </p>
                                        <p className="font-medium">{address.country}</p>
                                      </div>
                                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                        <p>Created: {format(new Date(address.createdAt), 'PP')}</p>
                                        <p>Updated: {format(new Date(address.updatedAt), 'PP')}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Permanent Delete Button */}
                            <div className="pt-4 border-t">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" className="w-full">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Permanently Delete Archived Data
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-destructive" />
                                      Permanently Delete Archived Data
                                    </DialogTitle>
                                    <DialogDescription>
                                      This will permanently delete all archived data for this user. This action cannot be undone.
                                      <br /><br />
                                      <strong>User:</strong> {deletedUser.name || deletedUser.email}
                                      <br />
                                      <strong>Deleted on:</strong> {format(new Date(deletedUser.deletedAt), 'PPp')}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handlePermanentDelete(deletedUser.id, deletedUser.email)}
                                      disabled={deletingUserId === deletedUser.id || currentUserId === deletedUser.originalUserId}
                                      title={currentUserId === deletedUser.originalUserId ? "You cannot permanently delete your own archived account" : "Permanently Delete"}
                                    >
                                      {deletingUserId === deletedUser.id ? 'Deleting...' : 'Permanently Delete'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

