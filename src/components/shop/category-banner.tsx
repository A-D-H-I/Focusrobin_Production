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
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-16 pb-8 md:pb-12 lg:pb-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-white mb-4 drop-shadow-lg">
          {title}
        </h1>
        {description && (
          <p className="text-white/90 text-lg md:text-xl max-w-2xl drop-shadow-md">
            {description}
          </p>
        )}
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

