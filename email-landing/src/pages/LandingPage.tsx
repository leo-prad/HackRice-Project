import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { GuestOnly } from "../components/GuestOnly";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import SmoothScroll from "../components/landing/SmoothScroll";
import FeatureGrid from "../components/landing/FeatureGrid";
import HowItWorks from "../components/landing/HowItWorks";
import AppDemoRow from "../components/landing/AppDemoRow";
import WhyChoose from "../components/landing/WhyChoose";
import PricingSection from "../components/landing/PricingSection";
import FAQSection from "../components/landing/FAQSection";
import Footer from "../components/landing/Footer";
import {
  type LandingScrollState,
  scrollToLandingSection,
  stripUrlHash,
} from "../lib/landingScroll";

function useLandingScrollInit() {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    stripUrlHash();

    const scrollTo = (state as LandingScrollState | null)?.scrollTo;
    if (scrollTo) {
      const t = window.setTimeout(() => {
        scrollToLandingSection(scrollTo);
        navigate(pathname, { replace: true, state: {} });
      }, 80);
      return () => window.clearTimeout(t);
    }

    window.scrollTo(0, 0);
  }, [pathname, state, navigate]);
}

export default function LandingPage() {
  useLandingScrollInit();

  return (
    <GuestOnly>
      <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <div
          id="top"
          className="relative min-h-screen overflow-x-hidden bg-land-canvas font-landing-body text-land-ink antialiased"
        >
          <Navbar />
          <Hero />
          <FeatureGrid />
          <HowItWorks />
          <AppDemoRow />
          <WhyChoose />
          <PricingSection />
          <FAQSection />
          <Footer />
        </div>
      </SmoothScroll>
    </MotionConfig>
    </GuestOnly>
  );
}
