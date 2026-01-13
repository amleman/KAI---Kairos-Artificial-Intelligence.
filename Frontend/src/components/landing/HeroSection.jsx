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
            <div className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-20 md:pt-0">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                </motion.div>

                <motion.h1
                    className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-tight mb-6 md:mb-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    KAI <span className="text-transparent bg-clip-text bg-gradient-to-br from-sky-500 to-blue-600">USAC</span>
                </motion.h1>

                <motion.h2
                    className="text-xl md:text-5xl font-light text-gray-200 mb-8 tracking-wide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    Tu Asistente Académico Inteligente
                </motion.h2>

                <motion.p
                    className="text-base md:text-xl text-gray-300 mb-8 md:mb-12 max-w-3xl mx-auto font-light leading-relaxed bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    Diseñado por estudiantes, para estudiantes.
                    <br className="hidden md:block" />
                    Automatiza la creación de tus horarios, visualiza tu progreso y toma decisiones informadas sobre tu carrera en segundos.
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <Link
                        to="/login"
                        className="group relative px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold overflow-hidden shadow-2xl hover:shadow-xl transition-all hover:-translate-y-1 w-full sm:w-auto text-center"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            Empezar Ahora
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    <Link
                        to="/register"
                        className="px-6 py-3.5 bg-white/5 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold hover:bg-white/10 transition-all hover:scale-105 shadow-lg flex items-center justify-center w-full sm:w-auto"
                    >
                        Crear Cuenta Gratis
                    </Link>
                </motion.div>
            </div>

            <motion.div
                className="absolute bottom-10 w-full flex justify-center text-gray-400"
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
