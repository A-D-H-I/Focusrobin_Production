'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deletePrescriptionGlasses } from '@/app/actions/prescriptionGlassesCRUD';

interface DeletePrescriptionGlassesButtonProps {
  id: string;
  name: string;
}

export function DeletePrescriptionGlassesButton({ id, name }: DeletePrescriptionGlassesButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deletePrescriptionGlasses(id);

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Prescription glasses deleted successfully',
      });
      router.refresh();
    }

    setIsDeleting(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="gap-2 text-destructive hover:text-destructive"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}

