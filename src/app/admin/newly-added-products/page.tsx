"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package, CheckCircle2 } from "lucide-react";
import type { Product } from "@/lib/productData";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function NewlyAddedProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProducts();
    fetchNewlyAddedProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: errorData.message || "Failed to load products",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNewlyAddedProducts = async () => {
    try {
      const response = await fetch("/api/admin/products?isNewlyAdded=true");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const ids = new Set(data.map((p: Product) => p.id));
          setNewlyAddedIds(ids);
          setSelectedProducts(ids);
        }
      }
      // Silently fail if filter doesn't work (migration not run yet)
    } catch (error) {
      console.error("Error fetching newly added products:", error);
      // Don't show error - migration may not be run yet
    }
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/products/update-featured", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: Array.from(selectedProducts),
          field: "isNewlyAdded",
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Newly added products updated successfully",
        });
        setNewlyAddedIds(new Set(selectedProducts));
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: errorData.message || "Failed to update products. Please run database migration first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Newly Added Products
            </h1>
            <p className="mt-2 text-muted-foreground">
              Select products to display in the "Newly Added Products" section on the homepage
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Selected:</strong> {selectedProducts.size} product{selectedProducts.size !== 1 ? "s" : ""}
          </p>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No products available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              const isNewlyAdded = newlyAddedIds.has(product.id);
              const mainImage =
                product.variants?.[0]?.thumbnail ||
                product.variants?.[0]?.images?.[0] ||
                "";

              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleToggleProduct(product.id)}
                >
                  <div className="relative">
                    {mainImage && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={mainImage}
                          alt={product.name}
                          fill
                          className="object-cover rounded-t-lg"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleProduct(product.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {isNewlyAdded && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Currently Featured
                        </span>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                    <CardDescription>{product.price}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

