import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ScalabilitySection from '../components/landing/ScalabilitySection';
import SecuritySection from '../components/landing/SecuritySection';
import ContactSection from '../components/landing/ContactSection';
import CreditsSection from '../components/landing/CreditsSection';
import Footer from '../components/landing/Footer';
import MaintenanceModal from '../components/landing/MaintenanceModal';

const LandingPage = () => {
    return (
        <div className="font-sans text-gray-100 scroll-smooth bg-black selection:bg-purple-500 selection:text-white">
            <MaintenanceModal />
            <Navbar />
            <main className="relative z-0">
                <HeroSection />
                <FeaturesSection />
                <SecuritySection />
                <ScalabilitySection />
                <ContactSection />
            </main>
            <CreditsSection />
            <Footer />
        </div>
    );
};

export default LandingPage;
