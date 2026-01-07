import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, Book, Save, Edit3, Award, TrendingUp, Shield, Camera, Brain, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar } from 'recharts';

const Perfil = () => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        fecha_nacimiento: '',
        carrera: '',
        carne: ''
    });

    const [stats, setStats] = useState({
        creditosAprobados: 0,
        creditosTotales: 300,
        promedio: 0,
        cursosAprobados: 0,
        mejorNota: 0,
        mejorCurso: '-'
    });

    const [radarData, setRadarData] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const usuarioNombre = localStorage.getItem('usuario');
                if (!usuarioNombre) return;
                setUsuario({ usuario: usuarioNombre });

                const resPerfil = await fetch(`http://127.0.0.1:8000/api/perfil/${usuarioNombre}`);
                if (resPerfil.ok) {
                    const dataPerfil = await resPerfil.json();
                    setFormData({
                        nombre: dataPerfil.nombre || '',
                        email: dataPerfil.email || '',
                        fecha_nacimiento: dataPerfil.fecha_nacimiento || '',
                        carrera: dataPerfil.carrera || 'Ingeniería en Sistemas',
                        carne: dataPerfil.carne || usuarioNombre,
                        foto_perfil: dataPerfil.foto_perfil || null,
                        foto_banner: dataPerfil.foto_banner || null
                    });
                }

                const resCursos = await fetch('http://127.0.0.1:8000/cursos_aprobados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario: usuarioNombre })
                });

                if (resCursos.ok) {
                    const dataCursos = await resCursos.json();
                    const aprobados = dataCursos.aprobados || [];
                    const creditos = aprobados.reduce((acc, curr) => acc + (curr.creditos || 0), 0);
                    const sumaNotas = aprobados.reduce((acc, curr) => acc + (curr.nota || 0), 0);
                    const promedio = aprobados.length > 0 ? (sumaNotas / aprobados.length).toFixed(2) : 0;
                    const mejorCurso = aprobados.reduce((max, obj) => (obj.nota > max.nota ? obj : max), { nota: 0, nombre: '-' });

                    setStats({
                        creditosAprobados: creditos,
                        creditosTotales: 300,
                        promedio: promedio,
                        cursosAprobados: aprobados.length,
                        mejorNota: mejorCurso.nota,
                        mejorCurso: mejorCurso.nombre
                    });
                    if (dataCursos.competencias_ia && dataCursos.competencias_ia.length > 0) {
                        setRadarData(dataCursos.competencias_ia);
                    }
                }
            } catch (error) {
                console.error("Error cargando perfil:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGuardar = async () => {
        if (!usuario) return;
        setGuardando(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/perfil/${usuario.usuario}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) setEditando(false);
        } catch (error) {
            console.error(error);
        } finally {
            setGuardando(false);
        }
    };

    const fileInputPerfil = useRef(null);
    const fileInputBanner = useRef(null);

    const handleImageUpload = async (e, tipo) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('usuario', usuario.usuario);
        uploadData.append('tipo', tipo);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/upload', {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (res.ok && data.url) {
                setFormData(prev => ({
                    ...prev,
                    [tipo === 'perfil' ? 'foto_perfil' : 'foto_banner']: data.url
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const dataPie = [
        { name: 'Aprobados', value: stats.creditosAprobados, color: '#4F46E5' },
        { name: 'Pendientes', value: Math.max(0, stats.creditosTotales - stats.creditosAprobados), color: '#E5E7EB' }
    ];

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-blue-dark"></div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn space-y-8 pb-12">
            {/* Profile Header Card */}
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-soft-blue shadow-inner overflow-hidden group">
                {/* Banner */}
                <div className="h-56 bg-slate-200 relative overflow-hidden">
                    {formData.foto_banner ? (
                        <img src={formData.foto_banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-pastel-blue via-pastel-purple to-pastel-pink opacity-80" />
                    )}
                    {editando && (
                        <button
                            onClick={() => fileInputBanner.current.click()}
                            className="absolute top-6 right-6 bg-white/40 backdrop-blur-md hover:bg-white/60 text-slate-700 p-3 rounded-xl transition-all shadow-lg"
                        >
                            <Camera size={20} />
                        </button>
                    )}
                    <input type="file" ref={fileInputBanner} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                </div>

                <div className="px-10 pb-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 relative z-10 gap-8">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-40 h-40 rounded-full border-8 border-white bg-white shadow-2xl overflow-hidden flex items-center justify-center transition-transform hover:scale-105 duration-500">
                                {formData.foto_perfil ? (
                                    <img src={formData.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                        <User size={80} strokeWidth={1} />
                                    </div>
                                )}
                            </div>
                            {editando && (
                                <button
                                    onClick={() => fileInputPerfil.current.click()}
                                    className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-xl shadow-xl hover:scale-110 transition-all border-4 border-white"
                                >
                                    <Camera size={20} />
                                </button>
                            )}
                            <input type="file" ref={fileInputPerfil} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'perfil')} />
                        </div>

                        {/* Name & Title */}
                        <div className="flex-1 text-center md:text-left mb-2">
                            <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">
                                {formData.nombre || 'Nombre de Usuario'}
                            </h1>
                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                                <span className="text-xl font-bold text-slate-400">@{usuario?.usuario}</span>
                                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-200" />
                                <div className="bg-pastel-blue/30 px-4 py-1 rounded-full border border-pastel-blue/50">
                                    <span className="text-sm font-black text-slate-600 uppercase tracking-widest">{formData.carrera}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="md:mb-4">
                            {editando ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setEditando(false)} className="px-6 py-3 bg-white/60 text-slate-600 rounded-xl border border-pastel-blue/30 font-bold hover:bg-white transition-all">Cancelar</button>
                                    <button onClick={handleGuardar} disabled={guardando} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-xl transition-all">{guardando ? 'Guardando...' : 'Guardar'}</button>
                                </div>
                            ) : (
                                <button onClick={() => setEditando(true)} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-xl hover:-translate-y-1 transition-all">
                                    <Edit3 size={20} />
                                    Editar Perfil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Information Column (8/12) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Personal Info */}
                    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-10 border border-soft-blue shadow-inner relative overflow-hidden">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-pastel-blue/20 rounded-full blur-3xl opacity-50" />
                        <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                            <Shield className="text-blue-500" /> Información Académica
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            {[
                                { label: 'Nombre Completo', icon: User, name: 'nombre', value: formData.nombre },
                                { label: 'Carné / ID', icon: TrendingUp, name: 'carne', value: formData.carne, disabled: true },
                                { label: 'Correo Electrónico', icon: Mail, name: 'email', value: formData.email },
                                { label: 'Fecha de Nacimiento', icon: Calendar, name: 'fecha_nacimiento', value: formData.fecha_nacimiento, type: 'date' },
                            ].map((field) => (
                                <div key={field.name} className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                    <div className="relative">
                                        <field.icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type={field.type || "text"}
                                            name={field.name}
                                            value={field.value}
                                            onChange={handleChange}
                                            disabled={field.disabled || !editando}
                                            className={`w-full pl-14 pr-6 py-4 rounded-xl ${editando && !field.disabled
                                                ? "bg-white border-[2px] border-soft-blue/40 shadow-inner focus:ring-2 focus:ring-pastel-blue focus:border-transparent"
                                                : "bg-white/40 border-transparent text-slate-600 cursor-default"
                                                }`}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carrera</label>
                                <div className="relative">
                                    <Book className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="carrera"
                                        value={formData.carrera}
                                        onChange={handleChange}
                                        disabled={!editando}
                                        className={`w-full pl-14 pr-6 py-4 rounded-xl border-[2px] border-soft-blue/40 transition-all font-black ${editando ? "bg-white shadow-inner focus:ring-2 focus:ring-pastel-blue focus:border-transparent"
                                            : "bg-white/40 border-transparent text-slate-600 cursor-default"
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-10 border border-soft-blue shadow-inner">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <Brain className="text-pastel-purple-dark" /> Análisis de Capacidades
                            </h2>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-pastel-green/20 rounded-full border border-pastel-green/30">
                                <Zap size={14} className="text-green-600" />
                                <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">AI Analysis</span>
                            </div>
                        </div>
                        <div className="flex flex-col xl:flex-row items-center gap-12">
                            <div className="flex-1 w-full h-[320px]">
                                {radarData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="#E2E8F0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} />
                                            <Radar name="Nivel" dataKey="A" stroke="#B8A7D1" strokeWidth={4} fill="#B8A7D1" fillOpacity={0.4} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 border-[2.5px] border-dashed border-soft-blue/30 rounded-2xl">
                                        <Brain size={48} className="mb-3 opacity-20" />
                                        <p className="text-sm font-bold">Sin datos de análisis</p>
                                    </div>
                                )}
                            </div>
                            <div className="w-full xl:w-72 space-y-4">
                                {radarData.map((item, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>{item.subject}</span>
                                            <span className="text-slate-800">{item.A}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-pastel-blue-dark rounded-full" style={{ width: `${item.A}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Sidebar Column (4/12) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Progress Chart */}
                    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border border-soft-blue shadow-inner text-center">
                        <h3 className="text-md font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Progreso de Carrera</h3>
                        <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={dataPie} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" cornerRadius={10}>
                                        {dataPie.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#B8A7D1' : '#F1F5F9'} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-black text-slate-800 tracking-tighter">{stats.creditosAprobados}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Créditos</span>
                            </div>
                        </div>
                        <div className="mt-4 text-slate-400 font-bold text-sm">
                            Faltan {Math.max(0, stats.creditosTotales - stats.creditosAprobados)} para la meta
                        </div>
                    </div>

                    {/* Stats Breakdown */}
                    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border border-soft-blue shadow-inner space-y-8">
                        <div className="flex flex-col items-center text-center">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Promedio General</h3>
                            <div className="h-40 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: parseFloat(stats.promedio) }]} startAngle={180} endAngle={0}>
                                        <RadialBar dataKey="value" fill="#DFEEF3" cornerRadius={100} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <span className="text-5xl font-black text-slate-800 tracking-tighter">{stats.promedio}</span>
                                    <div className="w-8 h-1 bg-pastel-blue rounded-full mt-1" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/60 p-5 rounded-2xl border-[2px] border-soft-blue/20 flex flex-col items-center shadow-sm">
                                <span className="text-2xl font-black text-slate-800 mb-1">{stats.cursosAprobados}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Cursos Ganados</span>
                            </div>
                            <div className="bg-white/60 p-5 rounded-2xl border-[2px] border-soft-blue/20 flex flex-col items-center shadow-sm">
                                <span className="text-2xl font-black text-slate-800 mb-1">{stats.mejorNota}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Mejor Nota</span>
                            </div>
                        </div>

                        <div className="bg-soft-blue/30 p-5 rounded-2xl border-[2px] border-soft-blue/40 text-center shadow-sm">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Curso Estrella</p>
                            <p className="text-sm font-black text-slate-700 truncate">{stats.mejorCurso}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Perfil;
