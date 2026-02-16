'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { createColorFamily } from '@/app/actions/createColorFamily';
import { useToast } from '@/hooks/use-toast';

interface AddColorFamilyDialogProps {
    onSuccess?: (newFamily: any) => void;
}

export function AddColorFamilyDialog({ onSuccess }: AddColorFamilyDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Form State
    const [name, setName] = useState('');
    const [hex, setHex] = useState('#000000');
    const [imageUrl, setImageUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('hex', hex);
        if (imageUrl) {
            formData.append('imageUrl', imageUrl);
        }

        const result = await createColorFamily(formData);

        if (result.success) {
            toast({
                title: 'Success',
                description: `Color family "${name}" created successfully.`,
            });
            setOpen(false);
            // Reset form
            setName('');
            setHex('#000000');
            setImageUrl('');
            // Notify parent to refresh list
            if (onSuccess && result.family) {
                onSuccess(result.family);
            }
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to create color family.',
                variant: 'destructive',
            });
        }

        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-8">
                    <Plus className="h-3 w-3" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        New Family
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Color Family</DialogTitle>
                        <DialogDescription>
                            Create a new color family for grouping product colors.
                            You can define a base Hex color and an optional pattern image.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="familyName" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="familyName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Tortoise"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="familyHex" className="text-right">
                                Hex / CSS
                            </Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    id="familyHexColor"
                                    type="color"
                                    value={hex}
                                    onChange={(e) => setHex(e.target.value)}
                                    className="w-12 h-10 p-1"
                                />
                                <Input
                                    id="familyHex"
                                    value={hex}
                                    onChange={(e) => setHex(e.target.value)}
                                    placeholder="#000000 or linear-gradient(...)"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right mt-2">
                                Pattern Image
                            </Label>
                            <div className="col-span-3">
                                <ImageUploader
                                    value={imageUrl}
                                    onChange={setImageUrl}
                                    folder="color-families"
                                    label="Pattern / Swatch"
                                    description="Optional image for texture."
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Family
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
