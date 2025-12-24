import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className, logoColor }: { className?: string; logoColor?: string }) {
  // Apply filter based on logoColor prop
  const getFilterStyle = () => {
    if (!logoColor) return {};
    const color = logoColor.toLowerCase();
    if (color === 'white' || color === '#ffffff') {
      return { filter: 'brightness(0) invert(1)' };
    } else if (color === 'black' || color === '#000000') {
      return { filter: 'brightness(0)' };
    }
    // For custom colors, you might need more complex filters
    return {};
  };

  return (
    <Link href="/" className="inline-block relative z-[101]">
      <Image
        src="/logo/Horizontal Primary dark (Color).svg"
        alt="FocusRobin Logo"
        width={120}
        height={36}
        className={cn("h-auto w-auto max-h-8 md:max-h-10 transition-all duration-300", className)}
        style={logoColor ? getFilterStyle() : undefined}
        priority
      />
    </Link>
  );
}
