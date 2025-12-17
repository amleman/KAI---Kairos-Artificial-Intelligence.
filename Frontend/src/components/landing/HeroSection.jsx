import React from 'react';
import { Link } from 'react-router-dom';
import ThreeDParticles from './ThreeDParticles';

const HeroSection = () => {
    return (
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gray-50">
            {/* Canvas de Fondo Componentizado con mayor tamaño */}
            <ThreeDParticles particleSize={2.1} scaleFactor={1.5} className="opacity-60" />

            {/* Contenido */}
            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-[-5vh]">
                <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6 animate-fade-in-up border border-blue-200">
                    Potenciado con Inteligencia Artificial
                </span>

                <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                    SIOA: Sistema Inteligente de <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Optimización Académica
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                    Automatiza tu futuro académico. Genera horarios sin choques, analiza riesgos de asignación y proyecta tu promedio ideal con nuestros algoritmos avanzados.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link
                        to="/login"
                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center ring-2 ring-transparent hover:ring-blue-500/50"
                    >
                        Laboratorio IA
                        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </Link>

                    <Link
                        to="/register"
                        className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                        Empezar Ahora
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-gray-400">
                <span className="text-xs font-semibold uppercase tracking-widest mb-2 block text-center">Explorar</span>
                <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>
    );
};

export default HeroSection;
