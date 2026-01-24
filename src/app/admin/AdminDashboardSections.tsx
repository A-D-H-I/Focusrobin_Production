'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Package, Plus, Image as ImageIcon, ShoppingBag, BarChart3, Users, Settings, Trash2, MessageCircle, Mail, ChevronDown, ChevronRight, Layout, Box, Star, Palette, Ticket } from 'lucide-react';
import { useState } from 'react';

export function AdminDashboardSections() {
  const [isLandingOpen, setIsLandingOpen] = useState(true);
  const [isProductsOpen, setIsProductsOpen] = useState(true);

  return (
    <div className="space-y-6">
      {/* Sunglasses Section */}
      <Collapsible open={isProductsOpen} onOpenChange={setIsProductsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-primary" />
                  <CardTitle>Sunglasses Products</CardTitle>
                </div>
                {isProductsOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add Sunglasses Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      <CardTitle>Add Sunglasses</CardTitle>
                    </div>
                    <CardDescription>Create a new sunglasses product</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/add">
                      <Button className="w-full">Add New Sunglasses</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Sunglasses Management Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle>Manage Sunglasses</CardTitle>
                    </div>
                    <CardDescription>View and manage all sunglasses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/products">
                      <Button variant="outline" className="w-full">Manage Sunglasses</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Prescription Glasses Section */}
      <Collapsible open={isProductsOpen} onOpenChange={setIsProductsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-primary" />
                  <CardTitle>Prescription Glasses Products</CardTitle>
                </div>
                {isProductsOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add Prescription Glasses Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      <CardTitle>Add Prescription Glasses</CardTitle>
                    </div>
                    <CardDescription>Create a new prescription glasses product</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/prescription-glasses/add">
                      <Button className="w-full">Add New Prescription Glasses</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Prescription Glasses Management Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle>Manage Prescription Glasses</CardTitle>
                    </div>
                    <CardDescription>View and manage all prescription glasses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/prescription-glasses">
                      <Button variant="outline" className="w-full">Manage Prescription Glasses</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Landing Page Section */}
      <Collapsible open={isLandingOpen} onOpenChange={setIsLandingOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layout className="h-5 w-5 text-primary" />
                  <CardTitle>Landing Page</CardTitle>
                </div>
                {isLandingOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Hero Images Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <CardTitle>Hero Images</CardTitle>
                    </div>
                    <CardDescription>Manage homepage hero images</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/hero">
                      <Button variant="outline" className="w-full">Manage Hero Images</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Instagram Images Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <CardTitle>Instagram Images</CardTitle>
                    </div>
                    <CardDescription>Manage Instagram feed images</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/instagram">
                      <Button variant="outline" className="w-full">Manage Instagram Images</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Category Images Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <CardTitle>Category Images</CardTitle>
                    </div>
                    <CardDescription>Manage category section images</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/category-images">
                      <Button variant="outline" className="w-full">Manage Category Images</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Glass Shapes Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      <CardTitle>Glass Shapes</CardTitle>
                    </div>
                    <CardDescription>Manage glass shapes and images for mega menu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/shapes">
                      <Button variant="outline" className="w-full">Manage Glass Shapes</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Iconic Images Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <CardTitle>Iconic Images</CardTitle>
                    </div>
                    <CardDescription>Manage iconic section background</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/iconic">
                      <Button variant="outline" className="w-full">Manage Iconic Images</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Shop Banners Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <CardTitle>Shop Banners</CardTitle>
                    </div>
                    <CardDescription>Manage banners for shop category pages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/shop-banners">
                      <Button variant="outline" className="w-full">Manage Shop Banners</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Prescription Glasses Landing Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <CardTitle>Prescription Glasses Landing</CardTitle>
                    </div>
                    <CardDescription>Manage prescription glasses page banner</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/prescription-glasses-landing">
                      <Button variant="outline" className="w-full">Manage Landing Image</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Gift for Loved Ones Banner Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <CardTitle>Gift for Loved Ones Banner</CardTitle>
                    </div>
                    <CardDescription>Manage banner below best sellers section</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/gift-for-loved-ones-banner">
                      <Button variant="outline" className="w-full">Manage Banner</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Scrolling Banner Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <CardTitle>Scrolling Banner</CardTitle>
                    </div>
                    <CardDescription>Manage scrolling text banner on homepage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/scrolling-banner">
                      <Button variant="outline" className="w-full">Manage Scrolling Banner</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Custom Shop Pages Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <CardTitle>Custom Shop Pages</CardTitle>
                    </div>
                    <CardDescription>Create custom pages like "Offers", "New Arrivals", etc.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/custom-shop-pages">
                      <Button variant="outline" className="w-full">Manage Custom Shop Pages</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Newly Added Products Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle>Newly Added Products</CardTitle>
                    </div>
                    <CardDescription>Select products to display in the "Newly Added Products" section</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/newly-added-products">
                      <Button variant="outline" className="w-full">Manage Newly Added Products</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Unique Designs Card */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      <CardTitle>Unique Designs</CardTitle>
                    </div>
                    <CardDescription>Select products to display in the "Unique Designs" section (formerly Best Sellers)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/unique-designs">
                      <Button variant="outline" className="w-full">Manage Unique Designs</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Other Sections - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Orders Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <CardTitle>Orders</CardTitle>
            </div>
            <CardDescription>View and manage customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full">Manage Orders</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Analytics Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Analytics</CardTitle>
            </div>
            <CardDescription>View sales and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full">View Analytics</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Users</CardTitle>
            </div>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Promo Codes Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <CardTitle>Promo Codes</CardTitle>
            </div>
            <CardDescription>Create and manage discount and cashback codes</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/promo-codes">
              <Button variant="outline" className="w-full">Manage Promo Codes</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Settings</CardTitle>
            </div>
            <CardDescription>Configure store settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full">Manage Settings</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Deleted Users Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-primary" />
              <CardTitle>Deleted Users</CardTitle>
            </div>
            <CardDescription>View and manage archived deleted user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/deleted-users">
              <Button variant="outline" className="w-full">View Deleted Users</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Chat Management Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle>Chat Management</CardTitle>
            </div>
            <CardDescription>View and reply to customer messages</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/chats">
              <Button variant="outline" className="w-full">Manage Chats</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Contact Submissions Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Contact Submissions</CardTitle>
            </div>
            <CardDescription>View and manage contact form submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/contact-submissions">
              <Button variant="outline" className="w-full">View Submissions</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Reviews Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <CardTitle>Reviews</CardTitle>
            </div>
            <CardDescription>View, edit, and delete product reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/reviews">
              <Button variant="outline" className="w-full">Manage Reviews</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Navbar Settings Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Navbar Settings</CardTitle>
            </div>
            <CardDescription>Configure navbar icon and logo colors</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/navbar-settings">
              <Button variant="outline" className="w-full">Manage Navbar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

