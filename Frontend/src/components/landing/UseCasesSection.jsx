import React from 'react';

const CaseCard = ({ title, description, icon, color }) => (
    <div className={`bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-50 rounded-bl-full -mr-8 -mt-8 opacity-50`}></div>

        <div className={`w-14 h-14 bg-${color}-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-${color}-100 transition-colors relative z-10`}>
            {icon}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{title}</h3>
        <p className="text-gray-600 leading-relaxed text-sm relative z-10">{description}</p>

        <div className="mt-6 relative z-10">
            <span className={`text-${color}-600 font-semibold text-sm hover:underline inline-flex items-center cursor-pointer`}>
                Saber más
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </span>
        </div>
    </div>
);

const UseCasesSection = () => {
    return (
        <section id="casos-uso" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="text-base font-bold text-blue-600 tracking-wide uppercase">Funcionalidades Clave</h2>
                    <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                        Tres Motores de Inteligencia Artificial
                    </p>
                    <p className="text-lg text-gray-500">
                        Nuestra plataforma integra algoritmos avanzados para resolver cada aspecto de tu planificación académica.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* 1. Semáforo */}
                    <CaseCard
                        title="Semáforo de Carga (K-Means)"
                        color="green"
                        description="Clasificación automática de cursos por nivel de dificultad utilizando Clustering. Recibe alertas visuales en tiempo real para evitar 'horarios suicidas'."
                        icon={<svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />

                    {/* 2. Generador Horarios */}
                    <CaseCard
                        title="Generador de Horarios (AG)"
                        color="blue"
                        description="Algoritmos Genéticos que crean combinaciones óptimas sin choques de horario. Incluye modos IA automático y Custom con filtros avanzados."
                        icon={<svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                    />

                    {/* 3. Optimizador Promedio */}
                    <CaseCard
                        title="Optimizador de Promedio"
                        color="purple"
                        description="Goal Seeking matemático que calcula las notas exactas necesarias para alcanzar tu promedio objetivo, basado en tu historial real."
                        icon={<svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>}
                    />

                    {/* 4. Chatbot Académico */}
                    <CaseCard
                        title="Chatbot Académico"
                        color="teal"
                        description="Asistente virtual disponible 24/7 para resolver dudas sobre cursos, prerrequisitos y normativas de la carrera."
                        icon={<svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
                    />

                    {/* 5. Costo de Oportunidad */}
                    <CaseCard
                        title="Costo de Oportunidad"
                        color="orange"
                        description="Analiza financieramente si tu horario te atrasa, proyectando la pérdida de ingresos futuros por graduación tardía."
                        icon={<svg className="w-7 h-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />

                    {/* 6. Reconocimiento Facial (WIP) */}
                    <div className="relative">
                        <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full z-20">
                            En Proceso
                        </div>
                        <CaseCard
                            title="Login Facial (IA)"
                            color="indigo"
                            description="Acceso seguro y rápido mediante reconocimiento facial avanzado. Olvida las contraseñas."
                            icon={<svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UseCasesSection;
