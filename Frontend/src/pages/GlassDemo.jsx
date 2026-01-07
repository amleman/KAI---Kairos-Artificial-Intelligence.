import React from 'react';
import GlassLayout from '../components/ui/GlassLayout';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import { Activity, BookOpen, GraduationCap, Trophy, Calendar, Users, Calculator, Clock } from 'lucide-react';

const GlassDemo = () => {
    return (
        <GlassLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 tracking-tight">
                        Panel de Control
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Bienvenido a tu resumen académico. Aquí puedes ver tu progreso y estadísticas clave.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Promedio General"
                        value="94.5"
                        icon={Trophy}
                        colorClass="text-yellow-600 bg-pastel-yellow"
                    />
                    <StatCard
                        title="Créditos Aprobados"
                        value="120"
                        icon={BookOpen}
                        colorClass="text-blue-600 bg-pastel-blue"
                    />
                    <StatCard
                        title="Materias Activas"
                        value="5"
                        icon={Activity}
                        colorClass="text-green-600 bg-pastel-green"
                    />
                    <StatCard
                        title="Semestre Actual"
                        value="6º"
                        icon={GraduationCap}
                        colorClass="text-pink-600 bg-pastel-pink"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Chart/Info Section */}
                    <GlassCard className="lg:col-span-2 min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Rendimiento Semestral</h2>
                            <button className="px-4 py-2 bg-white/50 hover:bg-white/80 rounded-lg text-sm font-medium text-gray-700 transition-colors shadow-sm">
                                Descargar Reporte
                            </button>
                        </div>

                        <div className="h-64 flex items-center justify-center border-dashed border-2 border-gray-300 rounded-xl bg-white/20">
                            <span className="text-gray-500 font-medium">Gráfico de Rendimiento (Placeholder)</span>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/40">
                                <h4 className="text-sm text-gray-600 mb-1">Mejor Materia</h4>
                                <p className="font-bold text-gray-800">Cálculo Diferencial</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/40">
                                <h4 className="text-sm text-gray-600 mb-1">Próximo Examen</h4>
                                <p className="font-bold text-gray-800">Física II - 25 Oct</p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Sidebar / Tools */}
                    <div className="space-y-6">
                        <GlassCard>
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <Calculator className="w-5 h-5 mr-2 text-gray-600" />
                                Herramientas Rápidas
                            </h3>
                            <ul className="space-y-3">
                                <li className="p-3 hover:bg-white/40 rounded-lg cursor-pointer transition-colors flex items-center text-gray-700">
                                    <span className="w-2 h-2 rounded-full bg-pastel-pink mr-3"></span>
                                    Calculadora de Notas
                                </li>
                                <li className="p-3 hover:bg-white/40 rounded-lg cursor-pointer transition-colors flex items-center text-gray-700">
                                    <span className="w-2 h-2 rounded-full bg-pastel-blue mr-3"></span>
                                    Simulador de Horario
                                </li>
                                <li className="p-3 hover:bg-white/40 rounded-lg cursor-pointer transition-colors flex items-center text-gray-700">
                                    <span className="w-2 h-2 rounded-full bg-pastel-green mr-3"></span>
                                    Mapa Curricular
                                </li>
                            </ul>
                        </GlassCard>

                        <GlassCard className="bg-gradient-to-br from-white/40 to-white/10">
                            <div className="flex items-start space-x-3">
                                <div className="bg-pastel-pink p-2 rounded-lg text-pink-700">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">Recordatorio</h4>
                                    <p className="text-sm text-gray-600 mt-1">Inscripción de materias comienza en 2 días.</p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </GlassLayout>
    );
};

export default GlassDemo;
