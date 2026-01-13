import { useState, useEffect } from "react";
import { BookOpen, Award, TrendingUp, CheckCircle2 } from "lucide-react";
import API_URL from "../api/apiConfig";

const ApprovedCoursesPage = () => {
    const [stats, setStats] = useState({ count: 0, credits: 0, progress: 0 });
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.carne) {
                fetch(`${API_URL}/aprobados/${user.carne}`)
                    .then(res => res.json())
                    .then(data => {
                        setCourses(data);
                        const totalCreditos = data.reduce((acc, curr) => acc + (parseInt(curr.creditos) || 0), 0);
                        setStats({
                            count: data.length,
                            credits: totalCreditos,
                            progress: Math.min(((totalCreditos / 250) * 100).toFixed(1), 100)
                        });
                    })
                    .catch(console.error);
            }
        }
    }, []);

    const formatCourseName = (name) => {
        if (!name) return "";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    return (
        <div className="animate-fadeIn flex flex-col min-h-0 h-full space-y-4 md:space-y-6 pb-6 md:pb-0">
            {/* Header Stats Minimalist - Fixed at top */}
            {/* Header Stats Minimalist - Fixed at top */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 shrink-0">
                <div className="bg-pastel-blue dark:bg-sky-900/30 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-soft-blue dark:border-sky-800/30 shadow-inner flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-transparent rounded-xl text-sky-500 dark:text-sky-400 shrink-0">
                        <BookOpen size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 truncate">{stats.count}</h3>
                        <p className="text-slate-500 dark:text-slate-300 text-[10px] md:text-sm font-black uppercase tracking-wider">Cursos</p>
                    </div>
                </div>
                <div className="bg-pastel-pink dark:bg-pink-900/30 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-soft-blue dark:border-pink-800/30 shadow-inner flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-transparent rounded-xl text-purple-500 dark:text-purple-400 shrink-0">
                        <Award size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 truncate">{stats.credits}</h3>
                        <p className="text-slate-500 dark:text-slate-300 text-[10px] md:text-sm font-black uppercase tracking-wider">Créditos</p>
                    </div>
                </div>
                <div className="bg-pastel-yellow dark:bg-amber-900/30 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-soft-blue dark:border-amber-800/30 shadow-inner flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-transparent rounded-xl text-orange-500 dark:text-orange-400 shrink-0">
                        <TrendingUp size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 truncate">{stats.progress}%</h3>
                        <p className="text-slate-500 dark:text-slate-300 text-[10px] md:text-sm font-black uppercase tracking-wider">Progreso</p>
                    </div>
                </div>
            </div>

            {/* Historial Académico Container - Occupies the rest and scrolls */}
            <div className="flex-1 bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-soft-blue dark:border-slate-700/50 shadow-inner flex flex-col min-h-0 overflow-hidden">
                <div className="p-5 md:p-8 md:pb-4 shrink-0 border-b border-soft-blue/20 dark:border-slate-700/50">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">Historial Académico</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 md:pt-2 custom-scrollbar">
                    {courses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <div key={course.codigo} className="group relative overflow-hidden bg-white/60 dark:bg-slate-700/40 backdrop-blur-xl border-[2px] border-soft-blue/30 dark:border-slate-600/30 rounded-xl p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/60 hover:to-soft-blue/20 dark:hover:from-slate-700/60 dark:hover:to-slate-600/40">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pastel-blue to-pastel-purple opacity-50 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-start justify-between gap-3 md:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base mb-1.5 md:mb-2 truncate pr-2" title={formatCourseName(course.nombre)}>
                                                {formatCourseName(course.nombre)}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs">
                                                <span className="font-mono text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border border-slate-200 dark:border-slate-600/50">
                                                    #{course.codigo}
                                                </span>
                                                <span className="font-black text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 md:py-1 rounded-full border border-white/60 dark:border-slate-600/50 uppercase tracking-tighter">
                                                    {course.creditos} Cr.
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center border border-green-100 dark:border-green-800/30 shadow-sm group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                                                <CheckCircle2 size={16} className="md:w-5 md:h-5 text-green-500 dark:text-green-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            No hay cursos aprobados registrados aún.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ApprovedCoursesPage;
