import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm">
              Elevate Your Style, Enhance Your Vision.
            </p>
            <div className="flex space-x-4 mt-4">
              <Link href="#" aria-label="Facebook"><Facebook className="h-6 w-6 hover:text-primary transition-colors" /></Link>
              <Link href="#" aria-label="Instagram"><Instagram className="h-6 w-6 hover:text-primary transition-colors" /></Link>
              <Link href="#" aria-label="Twitter"><Twitter className="h-6 w-6 hover:text-primary transition-colors" /></Link>
              <Link href="#" aria-label="Youtube"><Youtube className="h-6 w-6 hover:text-primary transition-colors" /></Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold font-headline mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Sunglasses</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Eyeglasses</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Bestsellers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold font-headline mb-4">About Us</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Our Story</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold font-headline mb-4">Newsletter</h4>
            <p className="text-sm mb-4">
              Join our list for exclusive offers and new product alerts.
            </p>
            <form className="flex space-x-2">
              <Input type="email" placeholder="Enter your email" className="bg-background" />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} FocusRobin. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
