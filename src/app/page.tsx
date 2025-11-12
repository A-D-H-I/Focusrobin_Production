import Header from '@/components/header';
import HeroSection from '@/components/hero-section';
import BestsellersSection from '@/components/bestsellers-section';
import ValuePropsSection from '@/components/value-props-section';
import LensFeatureSection from '@/components/lens-feature-section';
import InstagramFeedSection from '@/components/instagram-feed-section';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <BestsellersSection />
        <ValuePropsSection />
        <LensFeatureSection />
        <InstagramFeedSection />
      </main>
      <Footer />
    </div>
  );
}
