import Image from "next/image";
import Link from "next/link";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface CategoryBannerProps {
  title: string;
  imageSrc: string;
  description?: string;
  link?: string;
  alt?: string;
}

export default function CategoryBanner({ title, imageSrc, description, link, alt }: CategoryBannerProps) {
  const normalizedImageSrc = normalizeImageUrl(imageSrc);
  
  const bannerContent = (
    <>
      <Image
        src={normalizedImageSrc}
        alt={alt || title}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12 pb-6 sm:pb-8 md:pb-10 lg:pb-12 xl:pb-16">
        <div className="max-w-[45%] lg:max-w-[40%]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-brand-h1 font-headline text-white mb-2 sm:mb-3 md:mb-4 drop-shadow-lg leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl drop-shadow-md">
              {description}
            </p>
          )}
        </div>
      </div>
    </>
  );

  const bannerWrapper = (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
      {bannerContent}
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block">
        {bannerWrapper}
      </Link>
    );
  }

  return bannerWrapper;
}

