import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4 block">
                            SIOA
                        </Link>
                        <p className="text-gray-400 max-w-sm">
                            Sistema Inteligente de Optimización Académica. Transformando la gestión educativa con el poder de la Inteligencia Artificial.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-200">Plataforma</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Seguridad</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-200">Compañía</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} SIOA. Todos los derechos reservados.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white transition-colors">Términos</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-white transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
