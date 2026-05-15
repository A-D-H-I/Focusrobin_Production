'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Plus, Search } from 'lucide-react';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';
import { Input } from '@/components/ui/input';
import { CSVImportPanel } from '@/components/admin/CSVImportPanel';
import { BigBuySyncButtons } from '@/components/admin/BigBuySyncButtons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Converts Google Drive share link to direct image URL
 */
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

/**
 * Normalizes image URLs to relative paths for Next.js Image component
 */
function normalizeImageUrl(url: string): string {
  if (!url) return '';
  
  if (url.startsWith('/')) return url;
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('drive.google.com')) {
      return convertGoogleDriveLink(url);
    }
    return url;
  }
  
  const publicPathMatch = url.match(/[\\/]public[\\/](.+)$/i);
  if (publicPathMatch) {
    const path = publicPathMatch[1].replace(/\\/g, '/');
    return '/' + path;
  }
  
  const filenameMatch = url.match(/[\\/]([^\\/]+\.(jpg|jpeg|png|gif|webp|svg|glb))$/i);
  if (filenameMatch) {
    return '/' + filenameMatch[1];
  }
  
  return url.startsWith('./') ? url.slice(1) : '/' + url;
}

export function AdminProductListClient({ products, prismaProducts }: { products: any[]; prismaProducts: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Extract unique categories for the filter
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach((p) => {
      if (Array.isArray(p.categories)) {
        p.categories.forEach((c: string) => categories.add(c));
      }
    });
    return Array.from(categories).sort();
  }, [products]);

  const allBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [products]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => {
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v: any) => {
          if (v.colorFamily) colors.add(v.colorFamily);
          else if (v.colorName) colors.add(v.colorName);
        });
      }
    });
    return Array.from(colors).sort();
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(lowerQuery) ||
          p.brand?.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.categories?.includes(categoryFilter));
    }

    // Filter by brand
    if (brandFilter !== 'all') {
      result = result.filter((p) => p.brand === brandFilter);
    }

    // Filter by color
    if (colorFilter !== 'all') {
      result = result.filter((p) => {
        if (!Array.isArray(p.variants)) return false;
        return p.variants.some((v: any) => v.colorFamily === colorFilter || v.colorName === colorFilter);
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0');
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0');
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        result.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0');
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0');
          return priceB - priceA;
        });
        break;
      case 'name-asc':
        result.sort((a, b) => a.name?.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name?.localeCompare(a.name));
        break;
      case 'newest':
      default:
        // Already sorted by newest from DB
        break;
    }

    return result;
  }, [products, searchQuery, categoryFilter, brandFilter, colorFilter, sortBy]);

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-brand-h1 font-headline text-foreground">All Products</h1>
            <p className="mt-2 text-muted-foreground">
              Manage and view all products in your store ({products.length} total)
            </p>
          </div>
          <Link href="/admin/add">
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Add New Product
            </Button>
          </Link>
        </div>

        {/* BigBuy Sync Buttons — always visible */}
        <BigBuySyncButtons />

        {/* BigBuy CSV Import Panel (collapsible) */}
        <div className="mb-6">
          <CSVImportPanel
            categoryType="SUNGLASSES"
            onImportComplete={() => window.location.reload()}
          />
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          
          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {allBrands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={colorFilter} onValueChange={setColorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Colors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                {allColors.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
            {(searchQuery || categoryFilter !== 'all' || brandFilter !== 'all' || colorFilter !== 'all') && (
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setBrandFilter('all');
                setColorFilter('all');
              }}>
                Clear Filters
              </Button>
            )}
            {products.length === 0 && (
              <Link href="/admin/add" className="ml-4">
                <Button>Add Your First Product</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product: any) => {
              const rawImage = product.variants?.[0]?.thumbnail || product.variants?.[0]?.images?.[0] || '';
              const primaryImage = normalizeImageUrl(rawImage);
              
              const originalIndex = products.findIndex(p => p.id === product.id);
              const dbProductId = originalIndex >= 0 ? prismaProducts[originalIndex]?.id : product.id;
              
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative bg-muted overflow-hidden">
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={product.name}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex flex-col justify-between" style={{ minHeight: '180px' }}>
                    <div>
                      <h3 className="text-brand-h3 font-headline mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.categories?.join(', ')}
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        <p className="text-lg font-bold">{product.price}</p>
                        {product.cashback && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            🎁 {product.cashback}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex gap-2">
                        <Link href={`/admin/products/${product.slug}`} className="flex-1">
                          <Button variant="outline" className="w-full gap-2" size="sm">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${product.slug}/edit`} className="flex-1">
                          <Button variant="outline" className="w-full gap-2" size="sm">
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <DeleteProductButton
                          productId={dbProductId}
                          productName={product.name}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {product.variants?.length || 0} variant{(product.variants?.length !== 1) ? 's' : ''}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
