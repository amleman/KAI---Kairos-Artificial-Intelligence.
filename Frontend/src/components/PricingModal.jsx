import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Sparkles, Check, Zap, MessageCircle, Star, Rocket, Shield, Heart, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PricingModal = ({ isOpen, onClose, currentPlan = 'free', onUpgrade }) => {
    const [loading, setLoading] = useState(false);

    const planes = [
        {
            id: 'free',
            nombre: 'Gratuito',
            precio: 0,
            periodo: 'Siempre',
            icon: Star,
            color: 'from-slate-400 to-slate-500',
            bgCard: 'bg-white/70 dark:bg-slate-800/70',
            borderColor: 'border-slate-200 dark:border-slate-700',
            popular: false,
            features: [
                { texto: 'Vista del pensum en cuadrícula', incluido: true },
                { texto: 'Marcar cursos aprobados', incluido: true },
                { texto: 'Dashboard completo', incluido: true },
                { texto: 'Análisis financiero (costo de oportunidad)', incluido: true },
                { texto: 'Semáforo de carga académica', incluido: true },
                { texto: 'Optimizador de promedio', incluido: true },
                { texto: '5 preguntas/día al chatbot IA', incluido: true, limite: true },
                { texto: '3 horarios manuales por semestre', incluido: true, limite: true },
                { texto: '2 escaneos OCR totales', incluido: true, limite: true },
                { texto: 'Generador de horarios con IA', incluido: false },
                { texto: 'Vista del pensum en grafo', incluido: false },
                { texto: 'Simulador de escenarios', incluido: false },
            ]
        },
        {
            id: 'daily',
            nombre: 'Day Pass',
            precio: 10,
            periodo: '/24hrs',
            icon: Zap,
            color: 'from-violet-400 to-purple-500',
            bgCard: 'bg-gradient-to-br from-violet-50/90 to-purple-50/90 dark:from-violet-900/20 dark:to-purple-900/20',
            borderColor: 'border-violet-300 dark:border-violet-600',
            popular: false,
            isDaily: true,
            features: [
                { texto: 'Premium completo por 24 horas', incluido: true, destacado: true },
                { texto: 'Chatbot IA ilimitado', incluido: true },
                { texto: 'Generador de horarios con IA', incluido: true },
                { texto: 'Vista del pensum en grafo', incluido: true },
                { texto: 'Ideal para inscripciones', incluido: true },
            ]
        },
        {
            id: 'premium',
            nombre: 'Premium',
            precio: 29,
            periodo: '/mes',
            precioSemestral: 145,
            icon: Crown,
            color: 'from-amber-400 via-yellow-500 to-orange-500',
            bgCard: 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 dark:from-amber-900/20 dark:to-orange-900/20',
            borderColor: 'border-amber-300 dark:border-amber-600',
            popular: true,
            features: [
                { texto: 'Todo del plan Gratuito', incluido: true },
                { texto: 'Chatbot IA ilimitado', incluido: true },
                { texto: 'Generador de horarios con IA', incluido: true, destacado: true },
                { texto: 'Vista del pensum en grafo interactivo', incluido: true, destacado: true },
                { texto: 'Simulador de escenarios académicos', incluido: true, destacado: true },
                { texto: 'OCR ilimitado para escanear notas', incluido: true },
                { texto: 'Exportar horarios a PDF', incluido: true },
                { texto: 'Soporte prioritario', incluido: true },
            ]
        }
    ];

    const handleUpgrade = async (planId) => {
        if (planId === 'free' || planId === currentPlan) return;
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            if (onUpgrade) onUpgrade(planId);
        }, 1000);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/50 dark:border-slate-700/50"
                >
                    <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <div className="relative p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-sky-50/50 via-white to-amber-50/50 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/50">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl" />
                            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl" />

                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all hover:rotate-90 duration-300"
                            >
                                <X size={22} />
                            </button>

                            <div className="relative text-center max-w-2xl mx-auto">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-full mb-4 shadow-lg shadow-sky-200 dark:shadow-sky-900/30">
                                    <Sparkles size={14} />
                                    Potencia tu Experiencia
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3">
                                    Elige tu Plan
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-base">
                                    Desbloquea las funciones avanzadas de IA y optimiza tu camino universitario
                                </p>
                            </div>
                        </div>

                        {/* Plans Grid - 2 columns */}
                        <div className="p-8">
                            {/* Why Premium Section - FIRST */}
                            <div className="mb-8 p-5 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl border border-sky-200 dark:border-slate-700">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-white dark:bg-slate-700 rounded-xl shadow-sm flex-shrink-0">
                                        <Server size={22} className="text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1.5 flex items-center gap-2">
                                            <Heart size={14} className="text-rose-500" />
                                            ¿Por qué hay un plan de pago?
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                            Las funciones avanzadas de <strong>IA pesada</strong> (generador de horarios inteligente y chatbot académico ilimitado)
                                            requieren servidores potentes para ejecutar estos modelos. Tu suscripción ayuda a <strong>mantener el proyecto activo 24/7</strong> para
                                            toda la comunidad estudiantil y financiar futuras expansiones a otras facultades.
                                            <span className="text-sky-600 dark:text-sky-400 font-medium"> ¡Gracias por apoyar! 🇬🇹</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {planes.map((plan) => {
                                    const IconComponent = plan.icon;
                                    const isCurrentPlan = currentPlan?.toLowerCase() === plan.id;

                                    return (
                                        <motion.div
                                            key={plan.id}
                                            whileHover={{ scale: plan.popular ? 1.02 : 1.01, y: -4 }}
                                            className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden
                                            ${plan.bgCard} backdrop-blur-xl ${plan.borderColor}
                                            ${plan.popular ? 'shadow-xl shadow-amber-200/50 dark:shadow-amber-900/20' : 'shadow-lg'}
                                            ${plan.isDaily ? 'shadow-lg shadow-violet-200/50 dark:shadow-violet-900/20' : ''}
                                        `}
                                        >
                                            {/* Popular Badge */}
                                            {plan.popular && (
                                                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                                                    <div className="px-4 py-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-b-xl shadow-lg">
                                                        Recomendado
                                                    </div>
                                                </div>
                                            )}

                                            {/* Daily Pass Badge */}
                                            {plan.isDaily && (
                                                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                                                    <div className="px-4 py-1 bg-gradient-to-r from-violet-400 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-b-xl shadow-lg">
                                                        ⚡ Solo Hoy
                                                    </div>
                                                </div>
                                            )}

                                            {/* Current Plan Badge */}
                                            {isCurrentPlan && (
                                                <div className="absolute top-4 right-4">
                                                    <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-200 dark:border-emerald-700">
                                                        Plan Actual
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-6 pt-8">
                                                {/* Icon & Name */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                                                        <IconComponent size={24} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.nombre}</h3>
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="mb-6">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black text-slate-900 dark:text-white">
                                                            {plan.precio === 0 ? 'Gratis' : `Q${plan.precio}`}
                                                        </span>
                                                        {plan.precio > 0 && (
                                                            <span className="text-slate-500 dark:text-slate-400 font-medium">{plan.periodo}</span>
                                                        )}
                                                    </div>
                                                    {plan.precioSemestral && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            o Q{plan.precioSemestral}/semestre <span className="text-emerald-600 font-bold">(Ahorra 1 mes)</span>
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Features */}
                                                <ul className="space-y-2.5 mb-6">
                                                    {plan.features.map((feature, idx) => (
                                                        <li key={idx} className="flex items-start gap-2.5">
                                                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${feature.incluido
                                                                ? feature.destacado
                                                                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                                                                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                                }`}>
                                                                {feature.incluido ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                                                            </div>
                                                            <span className={`text-sm ${feature.incluido
                                                                ? feature.destacado
                                                                    ? 'text-slate-900 dark:text-white font-semibold'
                                                                    : 'text-slate-700 dark:text-slate-300'
                                                                : 'text-slate-400 dark:text-slate-500 line-through'
                                                                }`}>
                                                                {feature.texto}
                                                                {feature.limite && (
                                                                    <span className="ml-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                                                        Limitado
                                                                    </span>
                                                                )}
                                                                {feature.destacado && (
                                                                    <span className="ml-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                                                        ✨ IA
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {/* CTA Button */}
                                                <button
                                                    onClick={() => handleUpgrade(plan.id)}
                                                    disabled={isCurrentPlan || plan.id === 'free' || loading}
                                                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2
                                                    ${isCurrentPlan
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                                                            : plan.id === 'free'
                                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default'
                                                                : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30 hover:shadow-xl hover:-translate-y-0.5'
                                                        }
                                                    disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                                                `}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Procesando...
                                                        </>
                                                    ) : isCurrentPlan ? (
                                                        'Tu plan actual'
                                                    ) : plan.id === 'free' ? (
                                                        'Plan base'
                                                    ) : (
                                                        <>
                                                            <Rocket size={16} />
                                                            Comenzar Ahora
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Payment Info */}
                            <div className="mt-6 p-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/50">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white dark:bg-slate-700/80 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                                            <Shield size={20} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">Pago seguro</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Transferencias, TIGO Money y Zigi</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1.5">
                                            <Check size={14} className="text-emerald-500" /> Cancela cuando quieras
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Check size={14} className="text-emerald-500" /> Sin compromisos
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Check size={14} className="text-emerald-500" /> Soporte por WhatsApp
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="mt-6 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 flex-wrap">
                                    ¿Dudas? Contáctanos por{' '}
                                    <a
                                        href="https://wa.me/50240131873?text=Hola!,%20tengo%20dudas%20sobre%20los%20planes%20Premium%20de%20KAI%20USAC"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                                    >
                                        <MessageCircle size={14} />
                                        WhatsApp
                                    </a>
                                </p>
                            </div>

                            {/* No Refunds Policy */}
                            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2">
                                    <strong className="text-slate-600 dark:text-slate-300">Política de no reembolsos:</strong>
                                </p>
                                <ul className="text-[11px] text-slate-400 dark:text-slate-500 space-y-1 max-w-lg mx-auto">
                                    <li className="flex items-start gap-2">
                                        <span className="text-slate-300">•</span>
                                        <span>Las suscripciones son servicios digitales de <strong>uso inmediato</strong>; al activarse, ya tienes acceso completo a las funciones.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-slate-300">•</span>
                                        <span>Los costos de los servidores de IA se <strong>incurren al momento del pago</strong>, por lo que no es posible revertir el gasto.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-slate-300">•</span>
                                        <span>Puedes <strong>cancelar tu suscripción en cualquier momento</strong> sin cargos adicionales y seguirás teniendo acceso hasta el fin del período pagado.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default PricingModal;
