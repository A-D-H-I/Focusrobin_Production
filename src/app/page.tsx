import Header from '@/components/Landing/header.tsx';
import HeroSection from '@/components/Landing/hero-section.tsx';
import IconicSection from '@/components/Landing/iconic-section.tsx';
import GiftCategoriesSection from '@/components/Landing/gift-categories-section.tsx';
import BestsellersCarousel from '@/components/Landing/BestsellersCarousel.tsx';
import ValuePropsSection from '@/components/Landing/value-props-section.tsx';
import LensFeatureSection from '@/components/Landing/lens-feature-section.tsx';
import InstagramFeedSection from '@/components/Landing/instagram-feed-section.tsx';
import Footer from '@/components/Landing/footer.tsx';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <IconicSection />
        <GiftCategoriesSection />
        <BestsellersCarousel />
        <div className="bg-background">
          <ValuePropsSection />
          <LensFeatureSection />
          <InstagramFeedSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
