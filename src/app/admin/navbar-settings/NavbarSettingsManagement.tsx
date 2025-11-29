"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateNavbarSettings } from "@/app/actions/navbarSettings";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NavbarSettings {
  iconColorNotScrolled: string;
  logoColorNotScrolled: string;
}

interface NavbarSettingsManagementProps {
  initialSettings: NavbarSettings;
}

const COLOR_OPTIONS = [
  { value: "white", label: "White", preview: "bg-white border" },
  { value: "black", label: "Black", preview: "bg-black" },
  { value: "#ffffff", label: "White (Hex)", preview: "bg-white border" },
  { value: "#000000", label: "Black (Hex)", preview: "bg-black" },
  { value: "#1e40af", label: "Blue", preview: "bg-blue-600" },
  { value: "#059669", label: "Teal", preview: "bg-teal-600" },
];

export default function NavbarSettingsManagement({
  initialSettings,
}: NavbarSettingsManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<NavbarSettings>(initialSettings);
  const [customIconColor, setCustomIconColor] = useState(
    !COLOR_OPTIONS.find((opt) => opt.value === initialSettings.iconColorNotScrolled)
      ? initialSettings.iconColorNotScrolled
      : ""
  );
  const [customLogoColor, setCustomLogoColor] = useState(
    !COLOR_OPTIONS.find((opt) => opt.value === initialSettings.logoColorNotScrolled)
      ? initialSettings.logoColorNotScrolled
      : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const iconColor = customIconColor || settings.iconColorNotScrolled;
      const logoColor = customLogoColor || settings.logoColorNotScrolled;

      const result = await updateNavbarSettings(iconColor, logoColor);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Navbar settings updated successfully!",
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating navbar settings:", error);
      toast({
        title: "Error",
        description: "Failed to update navbar settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Navbar Colors (Not Scrolled)</CardTitle>
        </div>
        <CardDescription>
          Configure the colors for navbar icons and logo when the page is not scrolled (homepage hero section).
          These colors only apply when the navbar is transparent (not scrolled).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Icon Color */}
          <div className="space-y-2">
            <Label htmlFor="icon-color">Navbar Icons Color (Not Scrolled)</Label>
            <div className="flex gap-2">
              <Select
                value={COLOR_OPTIONS.find((opt) => opt.value === settings.iconColorNotScrolled)?.value || "custom"}
                onValueChange={(value) => {
                  if (value !== "custom") {
                    setSettings({ ...settings, iconColorNotScrolled: value });
                    setCustomIconColor("");
                  } else {
                    setCustomIconColor(settings.iconColorNotScrolled);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.preview}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Color</SelectItem>
                </SelectContent>
              </Select>
              {(!COLOR_OPTIONS.find((opt) => opt.value === settings.iconColorNotScrolled) || customIconColor) && (
                <Input
                  type="text"
                  placeholder="#ffffff or white"
                  value={customIconColor || settings.iconColorNotScrolled}
                  onChange={(e) => {
                    setCustomIconColor(e.target.value);
                    setSettings({ ...settings, iconColorNotScrolled: e.target.value });
                  }}
                  className="flex-1"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Color for search, wishlist, cart, and menu icons when navbar is transparent
            </p>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Preview:</span>
                <div
                  className="w-8 h-8 rounded border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: settings.iconColorNotScrolled === "white" ? "#000" : "#fff",
                    color: settings.iconColorNotScrolled,
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6c0 4.314 4.48 8.483 4.696 8.664a1 1 0 001.608 0C10.52 16.483 15 12.314 15 8a6 6 0 00-6-6zM8 8a2 2 0 114 0 2 2 0 01-4 0z" />
                  </svg>
                </div>
                <span className="text-xs text-muted-foreground">
                  {settings.iconColorNotScrolled}
                </span>
              </div>
            </div>
          </div>

          {/* Logo Color */}
          <div className="space-y-2">
            <Label htmlFor="logo-color">Logo Color (Not Scrolled)</Label>
            <div className="flex gap-2">
              <Select
                value={COLOR_OPTIONS.find((opt) => opt.value === settings.logoColorNotScrolled)?.value || "custom"}
                onValueChange={(value) => {
                  if (value !== "custom") {
                    setSettings({ ...settings, logoColorNotScrolled: value });
                    setCustomLogoColor("");
                  } else {
                    setCustomLogoColor(settings.logoColorNotScrolled);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.preview}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Color</SelectItem>
                </SelectContent>
              </Select>
              {(!COLOR_OPTIONS.find((opt) => opt.value === settings.logoColorNotScrolled) || customLogoColor) && (
                <Input
                  type="text"
                  placeholder="#ffffff or white"
                  value={customLogoColor || settings.logoColorNotScrolled}
                  onChange={(e) => {
                    setCustomLogoColor(e.target.value);
                    setSettings({ ...settings, logoColorNotScrolled: e.target.value });
                  }}
                  className="flex-1"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Color filter applied to logo when navbar is transparent (brightness/invert filter)
            </p>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Preview:</span>
                <div className="relative">
                  <div
                    className="w-24 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-bold"
                    style={{
                      filter: settings.logoColorNotScrolled === "white" 
                        ? "brightness(0) invert(1)" 
                        : settings.logoColorNotScrolled === "black"
                        ? "brightness(0)"
                        : `brightness(0) saturate(100%) invert(${settings.logoColorNotScrolled === "#ffffff" ? "1" : "0"})`,
                    }}
                  >
                    LOGO
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {settings.logoColorNotScrolled}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSettings(initialSettings);
                setCustomIconColor("");
                setCustomLogoColor("");
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

