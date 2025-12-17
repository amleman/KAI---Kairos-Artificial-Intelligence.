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
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                            SIOA
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/que-es-sioa" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">¿Qué es SIOA?</Link>
                        {location.pathname === '/' ? (
                            <a href="#casos-uso" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Funcionalidades</a>
                        ) : (
                            <Link to="/#casos-uso" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Funcionalidades</Link>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 border border-gray-200 rounded-lg hover:border-gray-400 transition-all text-sm">
                            Laboratorio
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
