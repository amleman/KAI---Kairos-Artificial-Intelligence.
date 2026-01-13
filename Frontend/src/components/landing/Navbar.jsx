import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 20;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrolled]);

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled || isMenuOpen ? 'bg-black/80 backdrop-blur-md shadow-lg border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-sky-500 to-blue-600 tracking-tight">
                            KAI USAC
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link to="/login" className="text-gray-300 hover:text-white font-medium px-4 py-2 border border-white/20 rounded-lg hover:border-white/50 transition-all text-sm">
                            Inicia Sesión
                        </Link>
                        <Link to="/register" className="bg-white text-black px-5 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-md hover:shadow-lg text-sm">
                            Empezar ahora
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-300 hover:text-white p-2 rounded-lg"
                        >
                            {isMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 visible max-h-screen' : 'opacity-0 invisible max-h-0'}`}>
                <div className="px-6 py-8 space-y-4 flex flex-col">
                    <Link
                        to="/login"
                        className="text-center w-full text-white font-bold px-4 py-4 border border-white/20 rounded-xl hover:bg-white/5 transition-all"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Inicia Sesión
                    </Link>
                    <Link
                        to="/register"
                        className="text-center w-full bg-blue-600 text-white px-4 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Empezar ahora gratis
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
