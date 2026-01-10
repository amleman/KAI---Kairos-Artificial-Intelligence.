import React from 'react';
import { motion } from 'framer-motion';
import { Brain, ScanLine, Code2, Zap } from 'lucide-react';

const FeaturesSection = () => {
    const features = [
        {
            icon: <Brain className="w-8 h-8 text-purple-500" />,
            title: "Inteligencia Artificial",
            description: "Algoritmos avanzados de optimización que generan el horario ideal basándose en tus necesidades y preferencias académicas.",
            color: "bg-pastel-purple"
        },
        {
            icon: <ScanLine className="w-8 h-8 text-blue-500" />,
            title: "Reconocimiento OCR",
            description: "Olvídate de la entrada manual de datos. Nuestro sistema extrae información de tus constancias automáticamente.",
            color: "bg-pastel-blue"
        },
        {
            icon: <Code2 className="w-8 h-8 text-pink-500" />,
            title: "Core en Python",
            description: "Un backend robusto y eficiente construido con Python, garantizando velocidad y precisión en el procesamiento de datos.",
            color: "bg-pastel-pink"
        }
    ];

    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Soft gradients background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <motion.span
                        className="text-sm font-bold tracking-widest text-blue-400 uppercase mb-4 block"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        Tecnología de Vanguardia
                    </motion.span>
                    <motion.h2
                        className="text-4xl md:text-5xl font-black text-white mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }} // Added delay
                        viewport={{ once: true }}
                    >
                        Potencia bajo el capó
                    </motion.h2>
                    <motion.p
                        className="text-xl text-gray-400 max-w-2xl mx-auto font-light"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        viewport={{ once: true }}
                    >
                        Una suite de herramientas diseñadas para transformar la complejidad académica en simplicidad.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (index * 0.2) }} // Increased delay
                            viewport={{ once: true }}
                            whileHover={{ y: -10 }}
                        >
                            <div className={`w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10 shadow-inner`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed font-light">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
