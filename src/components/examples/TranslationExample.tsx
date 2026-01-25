"use client";

/**
 * Example component showing how to use translation
 * Copy patterns from this component to your own components
 */

import TranslatableText from '@/components/ui/TranslatableText';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function TranslationExample() {
  const { translate, translateBatch } = useTranslation();
  const [buttonText, setButtonText] = useState('Click me');

  // Example: Translate a single text using hook
  useEffect(() => {
    translate('Click me').then(setButtonText);
  }, [translate]);

  // Example: Translate multiple texts
  const [menuItems, setMenuItems] = useState(['Home', 'Shop', 'About', 'Contact']);
  
  useEffect(() => {
    translateBatch(['Home', 'Shop', 'About', 'Contact']).then(setMenuItems);
  }, [translateBatch]);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Translation Examples</h1>

      {/* Example 1: Simple text translation */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Example 1: Simple Text</h2>
        <p>
          <TranslatableText text="Welcome to our store!" />
        </p>
      </section>

      {/* Example 2: Navigation menu */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Example 2: Navigation Menu</h2>
        <nav className="flex gap-4">
          {menuItems.map((item, i) => (
            <a key={i} href="#" className="text-blue-600 hover:underline">
              {item}
            </a>
          ))}
        </nav>
      </section>

      {/* Example 3: Buttons */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Example 3: Buttons</h2>
        <div className="flex gap-4">
          <Button>
            <TranslatableText text="Add to Cart" />
          </Button>
          <Button variant="outline">
            <TranslatableText text="Learn More" />
          </Button>
          <Button>{buttonText}</Button>
        </div>
      </section>

      {/* Example 4: Product card */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Example 4: Product Card</h2>
        <div className="border p-4 rounded-lg max-w-sm">
          <h3 className="font-bold text-lg mb-2">Sunglasses</h3>
          <p className="text-sm text-gray-600 mb-4">
            <TranslatableText text="Premium polarized sunglasses with UV400 protection." />
          </p>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">€49.99</span>
            <Button size="sm">
              <TranslatableText text="Buy Now" />
            </Button>
          </div>
        </div>
      </section>

      {/* Example 5: Form labels */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Example 5: Form Labels</h2>
        <form className="space-y-4 max-w-md">
          <div>
            <label className="block mb-1">
              <TranslatableText text="Name" />
            </label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block mb-1">
              <TranslatableText text="Email" />
            </label>
            <input type="email" className="w-full border rounded px-3 py-2" />
          </div>
          <Button type="submit">
            <TranslatableText text="Submit" />
          </Button>
        </form>
      </section>
    </div>
  );
}

