import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, Settings, BarChart3, Users, ShoppingCart, Image as ImageIcon, Trash2 } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await auth();
  
  // Server-side check: redirect if not logged in or not admin
  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage your store and products</p>
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
                <CardTitle>Products</CardTitle>
              </div>
              <CardDescription>View and manage all products</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full">Manage Products</Button>
              </Link>
            </CardContent>
          </Card>

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
              <CardDescription>Manage banners for shop category pages (Men, Women, Kids, Unisex)</CardDescription>
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
              <CardDescription>Create custom pages like "Offers", "New Arrivals", etc. with banners and products</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/custom-shop-pages">
                <Button variant="outline" className="w-full">Manage Custom Shop Pages</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <CardTitle>Orders</CardTitle>
              </div>
              <CardDescription>View and manage customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
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
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
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
        </div>
      </div>
    </div>
  );
}

