import React from 'react';
import { Shield, Lock, Server, CheckCircle, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const SecuritySection = () => {
    return (
        <section className="relative py-20 px-4 md:px-8 bg-black overflow-hidden" id="seguridad">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs md:text-sm font-bold uppercase tracking-widest mb-6"
                    >
                        <Shield size={14} />
                        Seguridad de Grado Bancario
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6"
                    >
                        Tus datos, más seguros <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-500">
                            que nunca.
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-400 leading-relaxed"
                    >
                        Entendemos que tu información académica es privada. Por eso, KAI está construido sobre la infraestructura más robusta del mundo.
                    </motion.p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

                    {/* Google Cloud Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-10 rounded-3xl border border-slate-800 relative overflow-hidden group hover:border-sky-500/30 transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Server size={120} />
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-sky-500/10 rounded-xl">
                                <Database className="text-sky-400" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Infraestructura Google Cloud</h3>
                        </div>

                        <p className="text-slate-400 text-lg mb-8 max-w-xl leading-relaxed">
                            KAI no corre en servidores caseros. Utilizamos <strong>Google Cloud Platform (GCP)</strong>, la misma tecnología que potencia a Google, YouTube y Gmail. Esto garantiza un 99.9% de disponibilidad y una protección blindada contra ataques.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span className="text-sm font-medium text-slate-300">Google Cloud SQL</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span className="text-sm font-medium text-slate-300">Cloud Run Scalability</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Encryption Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 hover:bg-slate-900 transition-colors"
                    >
                        <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-6">
                            <Lock className="text-emerald-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Encriptación de Punta a Punta</h3>
                        <p className="text-slate-400 leading-relaxed mb-6">
                            Tus datos viajan seguros. Utilizamos protocolos de encriptación <strong>TLS/SSL estándares de la industria</strong> para asegurar que nadie pueda interceptar tu conexión.
                        </p>
                    </motion.div>

                    {/* Privacy Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 hover:bg-slate-900 transition-colors"
                    >
                        <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-6">
                            <Shield className="text-purple-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Privacidad Primero</h3>
                        <p className="text-slate-400 leading-relaxed mb-6">
                            Tu contraseña y datos sensibles son <strong>hasheados y salteados</strong> (Bcrypt). Ni siquiera nosotros podemos ver tu contraseña real.
                        </p>
                    </motion.div>

                    {/* Trust Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 }}
                        className="col-span-1 md:col-span-2 bg-gradient-to-r from-slate-900 to-sky-900/20 p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center gap-6"
                    >
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2">Tu tranquilidad es nuestra prioridad.</h3>
                            <p className="text-slate-400">
                                Olvídate de excels inseguros o plataformas lentas. KAI te da velocidad con la seguridad de un banco.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center justify-center px-6 py-3 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
                                <span className="text-white font-bold flex items-center gap-2">
                                    <Database size={18} className="text-sky-400" />
                                    Powered by Google Cloud
                                </span>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default SecuritySection;
