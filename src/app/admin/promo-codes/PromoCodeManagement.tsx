"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountPercentage: number | null;
  discountAmount: number | null;
  cashbackPercentage: number | null;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  usageLimit: number | null;
  usedCount: number;
  minPurchaseAmount: number | null;
  minFrameQuantity: number | null;
  bulkFrameDiscountPercentage: number | null;
  applyToFramesOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PromoCodeManagement() {
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountPercentage: "",
    discountAmount: "",
    cashbackPercentage: "",
    isActive: true,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    usageLimit: "",
    minPurchaseAmount: "",
    minFrameQuantity: "",
    bulkFrameDiscountPercentage: "",
    applyToFramesOnly: false,
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch("/api/admin/promo-codes");
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data);
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast({
        title: "Error",
        description: "Promo code is required",
        variant: "destructive",
      });
      return;
    }

    // Validate: Either regular discount/cashback OR bulk frame discount must be provided
    const hasRegularDiscount = formData.discountPercentage || formData.discountAmount || formData.cashbackPercentage;
    const hasBulkFrameDiscount = formData.bulkFrameDiscountPercentage && formData.minFrameQuantity;
    
    if (!hasRegularDiscount && !hasBulkFrameDiscount) {
      toast({
        title: "Error",
        description: "At least one discount type must be provided (regular discount/cashback OR bulk frame discount)",
        variant: "destructive",
      });
      return;
    }

    // Validate bulk frame discount requirements
    if (formData.applyToFramesOnly) {
      if (!formData.minFrameQuantity || !formData.bulkFrameDiscountPercentage) {
        toast({
          title: "Error",
          description: "Minimum frame quantity and bulk frame discount percentage are required when applying to frames only",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const url = editingCode
        ? `/api/admin/promo-codes/${editingCode.id}`
        : "/api/admin/promo-codes";
      const method = editingCode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: editingCode
            ? "Promo code updated successfully"
            : "Promo code created successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchPromoCodes();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save promo code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save promo code",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Promo code deleted successfully",
        });
        fetchPromoCodes();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete promo code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete promo code",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingCode(promoCode);
    setFormData({
      code: promoCode.code,
      description: promoCode.description || "",
      discountPercentage: promoCode.discountPercentage?.toString() || "",
      discountAmount: promoCode.discountAmount?.toString() || "",
      cashbackPercentage: promoCode.cashbackPercentage?.toString() || "",
      isActive: promoCode.isActive,
      startDate: promoCode.startDate.split("T")[0],
      endDate: promoCode.endDate ? promoCode.endDate.split("T")[0] : "",
      usageLimit: promoCode.usageLimit?.toString() || "",
      minPurchaseAmount: promoCode.minPurchaseAmount?.toString() || "",
      minFrameQuantity: promoCode.minFrameQuantity?.toString() || "",
      bulkFrameDiscountPercentage: promoCode.bulkFrameDiscountPercentage?.toString() || "",
      applyToFramesOnly: promoCode.applyToFramesOnly || false,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCode(null);
    setFormData({
      code: "",
      description: "",
      discountPercentage: "",
      discountAmount: "",
      cashbackPercentage: "",
      isActive: true,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      usageLimit: "",
      minPurchaseAmount: "",
      minFrameQuantity: "",
      bulkFrameDiscountPercentage: "",
      applyToFramesOnly: false,
    });
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-brand-h1 font-headline">Promo Code Management</h1>
        <p className="mt-2 text-muted-foreground">
          Create and manage discount and cashback promo codes
        </p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Promo Code
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? "Edit Promo Code" : "Create New Promo Code"}
            </DialogTitle>
            <DialogDescription>
              {editingCode
                ? "Update the promo code details below"
                : "Fill in the details to create a new promo code"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Promo Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="SUMMER2024"
                  required
                />
              </div>
              <div>
                <Label htmlFor="isActive">Status</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    type="button"
                    variant={formData.isActive ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, isActive: true })}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={!formData.isActive ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, isActive: false })}
                  >
                    Inactive
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, discountPercentage: e.target.value })
                  }
                  placeholder="10.00"
                />
              </div>
              <div>
                <Label htmlFor="discountAmount">Fixed Discount Amount (€)</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, discountAmount: e.target.value })
                  }
                  placeholder="5.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cashbackPercentage">Cashback Percentage (%)</Label>
              <Input
                id="cashbackPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.cashbackPercentage}
                onChange={(e) =>
                  setFormData({ ...formData, cashbackPercentage: e.target.value })
                }
                placeholder="5.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="minPurchaseAmount">Min Purchase Amount (€)</Label>
                <Input
                  id="minPurchaseAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minPurchaseAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, minPurchaseAmount: e.target.value })
                  }
                  placeholder="50.00"
                />
              </div>
            </div>

            {/* Bulk Frame Discount Section */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="applyToFramesOnly"
                  checked={formData.applyToFramesOnly}
                  onChange={(e) =>
                    setFormData({ ...formData, applyToFramesOnly: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="applyToFramesOnly" className="font-semibold">
                  Apply Discount to Frames Only (Not Prescription Glasses)
                </Label>
              </div>

              {formData.applyToFramesOnly && (
                <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-primary/20">
                  <div>
                    <Label htmlFor="minFrameQuantity">Minimum Frame Quantity *</Label>
                    <Input
                      id="minFrameQuantity"
                      type="number"
                      min="2"
                      value={formData.minFrameQuantity}
                      onChange={(e) =>
                        setFormData({ ...formData, minFrameQuantity: e.target.value })
                      }
                      placeholder="2"
                      required={formData.applyToFramesOnly}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum number of frames required (e.g., 2, 3)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="bulkFrameDiscountPercentage">Frame Discount Percentage (%) *</Label>
                    <Input
                      id="bulkFrameDiscountPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.bulkFrameDiscountPercentage}
                      onChange={(e) =>
                        setFormData({ ...formData, bulkFrameDiscountPercentage: e.target.value })
                      }
                      placeholder="50.00"
                      required={formData.applyToFramesOnly}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Discount percentage applied only to frames
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCode ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Promo Codes</CardTitle>
          <CardDescription>
            Manage all discount and cashback promo codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No promo codes found. Create your first promo code above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Cashback</TableHead>
                  <TableHead>Frame Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promoCode) => (
                  <TableRow key={promoCode.id}>
                    <TableCell className="font-mono font-semibold">
                      {promoCode.code}
                    </TableCell>
                    <TableCell>
                      {promoCode.discountPercentage
                        ? `${promoCode.discountPercentage}%`
                        : promoCode.discountAmount
                        ? `€${promoCode.discountAmount}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {promoCode.cashbackPercentage
                        ? `${promoCode.cashbackPercentage}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {promoCode.applyToFramesOnly && promoCode.bulkFrameDiscountPercentage && promoCode.minFrameQuantity
                        ? `${promoCode.bulkFrameDiscountPercentage}% off (${promoCode.minFrameQuantity}+ frames)`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {promoCode.isActive ? (
                        <span className="text-green-600 flex items-center">
                          <Check className="h-4 w-4 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center">
                          <X className="h-4 w-4 mr-1" /> Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {promoCode.usageLimit
                        ? `${promoCode.usedCount}/${promoCode.usageLimit}`
                        : `${promoCode.usedCount} (unlimited)`}
                    </TableCell>
                    <TableCell>
                      {promoCode.endDate
                        ? new Date(promoCode.endDate).toLocaleDateString()
                        : "No expiry"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(promoCode)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(promoCode.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

