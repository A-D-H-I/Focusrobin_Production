import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, Layout } from 'lucide-react';

export default function AdminLandingPage() {
  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Layout className="h-8 w-8 text-primary" />
            <h1 className="text-brand-h1 font-headline text-foreground">Landing Page Management</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Manage all homepage and landing page content, images, and banners
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hero Images Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <CardTitle>Hero Images</CardTitle>
              </div>
              <CardDescription>Manage homepage hero banner images</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/hero">
                <Button variant="outline" className="w-full">Manage Hero Images</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Iconic Images Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <CardTitle>Iconic Section</CardTitle>
              </div>
              <CardDescription>Manage iconic section background image</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/iconic">
                <Button variant="outline" className="w-full">Manage Iconic Images</Button>
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
              <CardDescription>Manage gift categories section (Men, Women, Kids)</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/category-images">
                <Button variant="outline" className="w-full">Manage Category Images</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Gift Banner Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <CardTitle>Gift Banner</CardTitle>
              </div>
              <CardDescription>Manage "Gift for your loved ones" banner</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/gift-banner">
                <Button variant="outline" className="w-full">Manage Gift Banner</Button>
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
              <CardDescription>Manage banner below best sellers section (links to unisex page)</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/gift-for-loved-ones-banner">
                <Button variant="outline" className="w-full">Manage Banner</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Instagram Images Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <CardTitle>Instagram Feed</CardTitle>
              </div>
              <CardDescription>Manage Instagram feed images</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/instagram">
                <Button variant="outline" className="w-full">Manage Instagram Images</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Newly Added Products Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <CardTitle>Newly Added Products</CardTitle>
              </div>
              <CardDescription>Manage products shown in the "Newly Added Products" section</CardDescription>
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
                <ImageIcon className="h-5 w-5 text-primary" />
                <CardTitle>Unique Designs</CardTitle>
              </div>
              <CardDescription>Manage products shown in the "Unique Designs" section (formerly Best Sellers)</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/unique-designs">
                <Button variant="outline" className="w-full">Manage Unique Designs</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

