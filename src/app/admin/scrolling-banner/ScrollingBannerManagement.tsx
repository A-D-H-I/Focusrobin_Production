'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createScrollingBanner, updateScrollingBanner, deleteScrollingBanner } from '@/app/actions/scrollingBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ScrollingBanner {
  id: string;
  text: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ScrollingBannerManagementProps {
  initialBanners: ScrollingBanner[];
}

export function ScrollingBannerManagement({ initialBanners }: ScrollingBannerManagementProps) {
  const [banners, setBanners] = useState<ScrollingBanner[]>(initialBanners);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<ScrollingBanner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    text: 'BUY 1, GET 1 FREE ON ALL GLASSES! CODE: XMAS2X1',
    isActive: true,
  });
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setBanners(initialBanners);
  }, [initialBanners]);

  const handleEdit = (banner: ScrollingBanner) => {
    setEditingBanner(banner);
    setFormData({
      text: banner.text,
      isActive: banner.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setFormData({
      text: 'BUY 1, GET 1 FREE ON ALL GLASSES! CODE: XMAS2X1',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('text', formData.text);
      formDataToSend.append('isActive', formData.isActive.toString());

      let result;
      if (editingBanner) {
        formDataToSend.append('id', editingBanner.id);
        result = await updateScrollingBanner(formDataToSend);
      } else {
        result = await createScrollingBanner(formDataToSend);
      }

      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: editingBanner ? 'Banner updated successfully' : 'Banner created successfully',
        });
        setIsDialogOpen(false);
        setEditingBanner(null);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('id', bannerId);
      const result = await deleteScrollingBanner(formDataToSend);

      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Banner deleted successfully',
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scrolling Banners / Offers</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage multiple scrolling banner offers. All active banners will be displayed on the homepage.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingBanner(null);
                setFormData({
                  text: 'BUY 1, GET 1 FREE ON ALL GLASSES! CODE: XMAS2X1',
                  isActive: true,
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingBanner ? 'Edit' : 'Create'} Scrolling Banner Offer</DialogTitle>
                  <DialogDescription>
                    Enter the text to display in the scrolling banner. The text will scroll horizontally across the page.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text">Banner Text / Offer</Label>
                    <Input
                      id="text"
                      value={formData.text}
                      onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                      placeholder="BUY 1, GET 1 FREE ON ALL GLASSES! CODE: XMAS2X1"
                      required
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum 500 characters. Use <code className="bg-muted px-1 rounded">&lt;b&gt;text&lt;/b&gt;</code> or <code className="bg-muted px-1 rounded">&lt;strong&gt;text&lt;/strong&gt;</code> to make words bold.
                      <br />
                      Example: <code className="bg-muted px-1 rounded">BUY 1, GET 1 FREE! CODE: &lt;b&gt;XMAS2X1&lt;/b&gt;</code>
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">Preview:</p>
                      <div className="text-sm text-muted-foreground font-bold uppercase">
                        {formData.text.split(/(<b>.*?<\/b>|<strong>.*?<\/strong>)/gi).map((part, idx) => {
                          const boldMatch = part.match(/<(b|strong)>(.*?)<\/\1>/i);
                          if (boldMatch) {
                            return <strong key={idx} className="font-black">{boldMatch[2]}</strong>;
                          }
                          return <span key={idx}>{part}</span>;
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked as boolean })
                      }
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active (show on homepage)
                    </Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingBanner(null);
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingBanner ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingBanner ? 'Update Offer' : 'Create Offer'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {banners.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                {banners.filter(b => b.isActive).length} active offer(s) out of {banners.length} total
              </div>
              {banners.map((banner) => (
                <div key={banner.id} className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Updated: {new Date(banner.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{banner.text}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(banner)}
                        disabled={isSubmitting}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(banner.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No scrolling banners configured yet.</p>
              <p className="text-sm mt-2">Click "Add New Offer" to create your first offer.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

