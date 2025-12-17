import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import UseCasesSection from '../components/landing/UseCasesSection';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
    return (
        <div className="font-sans text-gray-900 scroll-smooth">
            <Navbar />
            <main>
                <HeroSection />
                <UseCasesSection />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
