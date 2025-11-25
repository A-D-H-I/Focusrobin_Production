import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="inline-block">
      <Image
        src="/logo/Horizontal Primary dark (Color).svg"
        alt="FocusRobin Logo"
        width={120}
        height={36}
        className={cn("h-auto w-auto max-h-8 md:max-h-10", className)}
        priority
      />
    </Link>
  );
}
