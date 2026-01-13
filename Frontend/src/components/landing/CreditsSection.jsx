import React from 'react';
import { Heart, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const CreditsSection = () => {
    return (
        <section className="py-16 bg-gradient-to-b from-black to-slate-900 border-t border-white/5 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider mb-6"
                >
                    <Users size={14} className="text-sky-400" />
                    Iniciativa Estudiantil Independiente
                </motion.div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                    No somos la Facultad. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
                        Somos estudiantes como tú.
                    </span>
                </h3>

                <p className="text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8 text-base md:text-lg">
                    KAI nació en una noche de desvelo, frustrados por los mismos sistemas lentos que tú usas.
                    Este no es un proyecto oficial de la Universidad ni de ninguna entidad administrativa.
                    Es el resultado de creer que merecemos herramientas modernas, rápidas y dignas de nuestra carrera.
                </p>

                <div className="flex justify-center items-center gap-2 text-slate-500 text-sm font-medium">
                    <span>Hecho con</span>
                    <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
                    <span>para la comunidad de Ingeniería</span>
                </div>
            </div>
        </section>
    );
};

export default CreditsSection;
