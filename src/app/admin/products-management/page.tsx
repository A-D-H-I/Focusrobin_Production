import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, Image as ImageIcon } from 'lucide-react';

export default function AdminProductsManagementPage() {
  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Products Management</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Manage all products, variants, assets, and product-related content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add Product Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <CardTitle>Add Product</CardTitle>
              </div>
              <CardDescription>Create a new product with variants and assets</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/add">
                <Button className="w-full">Add New Product</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Products Management Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle>All Products</CardTitle>
              </div>
              <CardDescription>View and manage all products</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full">Manage Products</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Shop Banners Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <CardTitle>Shop Page Banners</CardTitle>
              </div>
              <CardDescription>Manage banners on shop category pages</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/shop-banners">
                <Button variant="outline" className="w-full">Manage Shop Banners</Button>
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
              <CardDescription>Create custom pages like "New Arrivals", "Offers", etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/custom-shop-pages">
                <Button variant="outline" className="w-full">Manage Custom Pages</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

