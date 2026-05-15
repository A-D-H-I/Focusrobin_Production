'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Search } from 'lucide-react';
import { normalizeImageUrl } from '@/lib/normalize-image-url';
import { DeletePrescriptionGlassesButton } from './DeletePrescriptionGlassesButton';
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

export function AdminPrescriptionGlassesListClient({ prescriptionGlasses }: { prescriptionGlasses: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const allGenders = useMemo(() => {
    const genders = new Set<string>();
    prescriptionGlasses.forEach((g) => {
      if (Array.isArray(g.gender)) {
        g.gender.forEach((gender: string) => genders.add(gender));
      }
    });
    return Array.from(genders).sort();
  }, [prescriptionGlasses]);

  const allBrands = useMemo(() => {
    const brands = new Set<string>();
    prescriptionGlasses.forEach((g) => {
      if (g.brand) brands.add(g.brand);
    });
    return Array.from(brands).sort();
  }, [prescriptionGlasses]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    prescriptionGlasses.forEach((g) => {
      if (Array.isArray(g.PrescriptionGlassesVariant)) {
        g.PrescriptionGlassesVariant.forEach((v: any) => {
          if (v.colorFamily) colors.add(v.colorFamily);
          else if (v.colorName) colors.add(v.colorName);
        });
      }
    });
    return Array.from(colors).sort();
  }, [prescriptionGlasses]);

  const filteredAndSortedGlasses = useMemo(() => {
    let result = [...prescriptionGlasses];

    // Search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name?.toLowerCase().includes(lowerQuery) ||
          g.brand?.toLowerCase().includes(lowerQuery)
      );
    }

    // Gender filter
    if (genderFilter !== 'all') {
      result = result.filter((g) => g.gender?.includes(genderFilter));
    }

    // Filter by brand
    if (brandFilter !== 'all') {
      result = result.filter((g) => g.brand === brandFilter);
    }

    // Filter by color
    if (colorFilter !== 'all') {
      result = result.filter((g) => {
        if (!Array.isArray(g.PrescriptionGlassesVariant)) return false;
        return g.PrescriptionGlassesVariant.some((v: any) => v.colorFamily === colorFilter || v.colorName === colorFilter);
      });
    }

    // Process prices for sorting
    const getFinalPrice = (glasses: any) => {
      const isFocusRobin = (glasses.brand || '').trim().toLowerCase() === 'focusrobin';
      const rawBasePrice = Number(glasses.basePrice) || 0;
      let effectiveBasePrice = rawBasePrice;
      
      if (!isFocusRobin && rawBasePrice > 0) {
        let p = (rawBasePrice * 1.10) + 13.5;
        p = p * 1.21;
        p = p * 1.015;
        effectiveBasePrice = p;
      }
      
      const discountPct = glasses.discountPct || 0;
      return effectiveBasePrice * (1 - discountPct / 100);
    };

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
        break;
      case 'price-desc':
        result.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
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
  }, [prescriptionGlasses, searchQuery, genderFilter, brandFilter, colorFilter, sortBy]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prescription Glasses</h1>
          <p className="text-muted-foreground mt-2">
            Manage all prescription glasses products separately from sunglasses ({prescriptionGlasses.length} total)
          </p>
        </div>
        <Link href="/admin/prescription-glasses/add">
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Prescription Glasses
          </Button>
        </Link>
      </div>

      {/* BigBuy Sync Buttons — always visible */}
      <BigBuySyncButtons />

      {/* BigBuy CSV Import Panel (collapsible) */}
      <div className="mb-6">
        <CSVImportPanel
          categoryType="PRESCRIPTION"
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
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              {allGenders.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
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

      {filteredAndSortedGlasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No prescription glasses products found matching your criteria.
            </p>
            {(searchQuery || genderFilter !== 'all' || brandFilter !== 'all' || colorFilter !== 'all') && (
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setGenderFilter('all');
                setBrandFilter('all');
                setColorFilter('all');
              }} className="mr-4">
                Clear Filters
              </Button>
            )}
            {prescriptionGlasses.length === 0 && (
              <Link href="/admin/prescription-glasses/add">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Prescription Glasses
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedGlasses.map((glasses) => {
            // Get first variant's first gallery image (fall back to NO_BG for BigBuy products)
            const firstVariant = glasses.PrescriptionGlassesVariant?.[0];
            const assets = firstVariant?.PrescriptionGlassesAsset || [];
            const firstGalleryAsset =
              assets.find((a: any) => a.type === 'GALLERY') ||
              assets.find((a: any) => a.type === 'NO_BG') ||
              assets[0];
            const imageUrl = firstGalleryAsset?.url || '/placeholder.png';

            // Calculate the final price with margin (matching admin form logic)
            const isFocusRobin = (glasses.brand || '').trim().toLowerCase() === 'focusrobin';
            const rawBasePrice = Number(glasses.basePrice) || 0;
            let effectiveBasePrice = rawBasePrice;
            if (!isFocusRobin && rawBasePrice > 0) {
              let p = (rawBasePrice * 1.10) + 13.5;
              p = p * 1.21;
              p = p * 1.015;
              effectiveBasePrice = p;
            }
            const discountPct = glasses.discountPct || 0;
            const finalPrice = effectiveBasePrice * (1 - discountPct / 100);

            return (
              <Card key={glasses.id} className="overflow-hidden flex flex-col">
                <div className="relative aspect-video bg-muted">
                  {imageUrl && (
                    <Image
                      src={normalizeImageUrl(imageUrl)}
                      alt={glasses.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                    />
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="line-clamp-1">{glasses.name}</span>
                    {glasses.discountPct > 0 && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded shrink-0 ml-2">
                        -{glasses.discountPct}%
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="font-medium">{glasses.brand || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold text-right">
                        €{finalPrice.toFixed(2)}
                        {(glasses.discountPct ?? 0) > 0 && (
                          <span className="ml-2 text-xs line-through text-muted-foreground block text-right">
                            €{effectiveBasePrice.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Variants:</span>
                      <span>{glasses.PrescriptionGlassesVariant?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gender:</span>
                      <span>{glasses.gender?.join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 mt-auto">
                    <Link
                      href={`/admin/prescription-glasses/${glasses.slug}/edit`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <DeletePrescriptionGlassesButton
                      id={glasses.id}
                      name={glasses.name}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
