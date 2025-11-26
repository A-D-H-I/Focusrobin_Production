import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative inline-block">
          <Image
            src="/logo/Horizontal Primary dark (Color).svg"
            alt="FocusRobin Logo"
            width={180}
            height={54}
            className="h-auto w-auto max-h-12 md:max-h-16 relative z-10"
            priority
          />
          <div className="logo-gradient-overlay"></div>
        </div>
      </div>
    </div>
  );
}

