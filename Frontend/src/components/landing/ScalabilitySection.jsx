import React from 'react';
import { motion } from 'framer-motion';
import { Scaling, Layers, Globe } from 'lucide-react';

const ScalabilitySection = () => {
    return (
        <section className="py-24 bg-slate-950 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                            Nuestra Misión: <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                                Tu Éxito Académico
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 mb-8 font-light leading-relaxed">
                            KAI no es solo software; es una respuesta a la complejidad universitaria. Creado para estudiantes que buscan tomar control de su carrera, optimizar su tiempo y alcanzar sus metas sin estrés.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-xl shadow-md border border-white/5">
                                    <Scaling className="text-blue-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Para Estudiantes Visionarios</h3>
                                    <p className="text-gray-400 text-sm">Herramientas profesionales para quienes se toman en serio su futuro.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-xl shadow-md border border-white/5">
                                    <Globe className="text-indigo-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Impacto Real</h3>
                                    <p className="text-gray-400 text-sm">Más de 1000 horas ahorradas en gestión manual de cursos.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <p className="text-gray-300 text-sm leading-relaxed pl-2 relative z-10">
                                <span className="text-blue-400 font-bold block mb-1">Nota Importante:</span>
                                Actualmente, KAI está optimizado exclusivamente para la <span className="text-white font-semibold">Facultad de Ingeniería de la USAC</span>. Sin embargo, nuestra arquitectura es escalable y estamos preparados para integrar otras facultades y universidades en el futuro.
                            </p>
                        </div>

                    </motion.div>

                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        viewport={{ once: true }}
                    >
                        {/* Abstract Visual Representation */}
                        <div className="aspect-square rounded-3xl bg-transparent relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900 to-indigo-900 rounded-3xl transform rotate-3 scale-105 opacity-50" />
                            <div className="absolute inset-0 bg-slate-900 rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center transform -rotate-2 hover:rotate-0 transition-all duration-500 border border-white/10">
                                <div className="grid grid-cols-2 gap-4 w-full h-full opacity-80">
                                    <div className="bg-slate-800 rounded-2xl animate-pulse delay-75" />
                                    <div className="bg-blue-900/50 rounded-2xl animate-pulse delay-150" />
                                    <div className="bg-indigo-900/50 rounded-2xl animate-pulse delay-300" />
                                    <div className="bg-slate-700/50 rounded-2xl animate-pulse delay-500" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-white text-black px-6 py-3 rounded-xl font-bold text-xl shadow-xl">
                                        Comunidad KAI
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div >
        </section >
    );
};

export default ScalabilitySection;
