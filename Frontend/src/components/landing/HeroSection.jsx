import React from 'react';
import { Link } from 'react-router-dom';
import ThreeDParticles from './ThreeDParticles';
import { motion } from 'framer-motion';

const HeroSection = () => {
    return (
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-black">
            {/* Canvas de Fondo */}
            <ThreeDParticles particleSize={2.5} scaleFactor={1.6} className="opacity-70" />

            {/* Contenido */}
            <div className="relative z-10 text-center px-4 max-w-6xl mx-auto mt-[-5vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                </motion.div>

                <motion.h1
                    className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-tight mb-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    KAI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">USAC</span>
                </motion.h1>

                <motion.h2
                    className="text-2xl md:text-4xl font-light text-gray-400 mb-8 tracking-wide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    Kairos Artificial Intelligence
                </motion.h2>

                <motion.p
                    className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    Revolucionando la gestión académica con el poder de la Inteligencia Artificial y Python.
                    <br className="hidden md:block" /> Optimización de horarios, proyecciones y análisis de datos en una plataforma unificada.
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row justify-center items-center gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <Link
                        to="/login"
                        className="group relative px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold overflow-hidden shadow-2xl hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Ingresar a la Plataforma
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    <Link
                        to="/register"
                        className="px-8 py-4 bg-white/5 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold hover:bg-white/10 transition-all hover:scale-105 shadow-lg flex items-center justify-center"
                    >
                        Crear Cuenta
                    </Link>
                </motion.div>
            </div>

            <motion.div
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-gray-400"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em]">Descubre Más</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-gray-400 to-transparent"></div>
                </div>
            </motion.div>
        </section>
    );
};

export default HeroSection;
