"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Wallet } from 'lucide-react';
import { getWelcomeBonusAmount, updateWelcomeBonusAmount } from '@/app/actions/users';
import { useSession } from 'next-auth/react';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [welcomeBonusAmount, setWelcomeBonusAmount] = useState<number>(10.00);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any)?.role;
      if (userRole !== 'ADMIN') {
        router.push('/');
        return;
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    const loadSettings = async () => {
      if (status === 'authenticated') {
        setIsLoading(true);
        try {
          const result = await getWelcomeBonusAmount();
          if (result.error) {
            toast({
              title: "Error",
              description: result.error,
              variant: "destructive",
            });
          } else if (result.amount !== undefined) {
            setWelcomeBonusAmount(result.amount);
          }
        } catch (error) {
          console.error('Error loading settings:', error);
          toast({
            title: "Error",
            description: "Failed to load settings",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
  }, [status, toast]);

  const handleSave = async () => {
    if (welcomeBonusAmount < 0) {
      toast({
        title: "Error",
        description: "Welcome bonus amount cannot be negative",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateWelcomeBonusAmount(welcomeBonusAmount);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Welcome bonus amount updated successfully",
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="bg-background p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-brand-h1 font-headline text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Configure store settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle>Welcome Bonus Settings</CardTitle>
            </div>
            <CardDescription>
              Set the amount of free wallet money that new users receive when they sign up for the first time.
              This bonus will be automatically credited to their wallet upon first login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="welcome-bonus">Welcome Bonus Amount (€)</Label>
              <Input
                id="welcome-bonus"
                type="number"
                step="0.01"
                min="0"
                value={welcomeBonusAmount}
                onChange={(e) => setWelcomeBonusAmount(parseFloat(e.target.value) || 0)}
                placeholder="10.00"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-2">
                New users will receive this amount in their wallet when they sign in for the first time.
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

