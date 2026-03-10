import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/LandingPage/AboutSection";
import DualOrganSection from "@/components/LandingPage/DualOrganSection";
import HowItWorks from "@/components/LandingPage/HowItWorks";
import ClinicalImpact from "@/components/LandingPage/ClinicalImpact";
import Disclaimer from "@/components/LandingPage/Disclaimer";
import CTA from "@/components/LandingPage/CTA";
import SecondaryBackgroundVideo from "@/components/SecondaryBackgroundVideo";

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <SecondaryBackgroundVideo />
      <Navbar />
      <HeroSection />

      {/* Content wrapper with transparency to show video */}
      <div className="relative z-10">
        <AboutSection />
        <DualOrganSection />
        <HowItWorks />
        <ClinicalImpact />
        <CTA />
        <Disclaimer />
      </div>
    </main>
  );
}
