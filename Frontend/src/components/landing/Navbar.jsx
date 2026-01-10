import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
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
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/50 backdrop-blur-md shadow-lg border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-sky-500 to-blue-600">
                            KAI USAC
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        {/* Links simplificados */}
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-gray-300 hover:text-white font-medium px-4 py-2 border border-white/20 rounded-lg hover:border-white/50 transition-all text-sm">
                            Inicia Sesión
                        </Link>
                        <Link to="/register" className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-all shadow-md hover:shadow-lg text-sm">
                            Empezar ahora
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
