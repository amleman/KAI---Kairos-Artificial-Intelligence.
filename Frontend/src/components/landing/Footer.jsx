import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4 block">
                            KAI USAC
                        </Link>
                        <p className="text-gray-400 max-w-sm">
                            Kairos Artificial Intelligence Academic System.
                            <br />Transformando la gestión educativa con el poder de la Inteligencia Artificial.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-200">Plataforma</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Seguridad</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-200">Contacto</h4>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="mailto:2070753360116@ingeniera.usac.edu.gt" className="hover:text-white transition-colors">Email Institucional</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} KAI USAC. Todos los derechos reservados.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
