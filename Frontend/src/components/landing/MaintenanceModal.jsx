import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Server, ShieldCheck, CalendarClock, MessageCircle, X } from 'lucide-react';

const MaintenanceModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Show modal immediately on mount
        setIsOpen(true);

        // Prevent scrolling when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        document.body.style.overflow = 'unset';
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Background Pattern */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent pointer-events-none" />

                        <div className="relative p-6 md:p-8">
                            {/* Icon */}
                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-amber-500/20 rotate-3">
                                <Server size={32} className="text-amber-600 dark:text-amber-400" />
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl md:text-3xl font-black text-center text-slate-900 dark:text-white mb-4">
                                Plataforma en Pausa Temporal
                            </h2>

                            {/* Main Message */}
                            <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed text-center">
                                <p>
                                    Querida comunidad estudiantil, para optimizar nuestros recursos hemos pausado temporalmente el acceso a la plataforma.
                                </p>
                                <p>
                                    Esta medida nos ayuda a ahorrar costos operativos mientras nos preparamos para los <strong>cursos de vacaciones del primer semestre</strong>, momento en el cual estaremos habilitados nuevamente con mejoras.
                                </p>
                            </div>

                            {/* Key Points */}
                            <div className="mt-8 space-y-3">
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Datos Seguros</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Tu información está resguardada y estará disponible intacta al regresar.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <CalendarClock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Próxima Apertura</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Inicio de cursos de vacaciones (Primer Semestre).</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Action */}
                            <div className="mt-8 flex flex-col gap-3">
                                <a
                                    href="https://wa.me/50240131873?text=Hola,%20tengo%20una%20duda%20sobre%20mis%20datos%20en%20KAI."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 px-4 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <MessageCircle size={18} />
                                    Contactar Soporte
                                </a>
                                <button
                                    onClick={handleClose}
                                    className="w-full py-3 px-4 rounded-xl font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Entendido, cerrar mensaje
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default MaintenanceModal;
