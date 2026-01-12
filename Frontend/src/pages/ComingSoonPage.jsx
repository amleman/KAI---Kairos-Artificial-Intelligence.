import React from 'react';
import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';

const ComingSoonPage = () => {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden text-white font-sans">
            <AuthBackground />

            <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
                <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <Construction className="w-12 h-12 text-blue-400" />
                </div>

                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                        Muy Pronto
                    </span>
                </h1>

                <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                    Estamos trabajando arduamente para expandir el universo de KAI.
                    <br className="hidden md:block" />
                    Esta funcionalidad estará disponible en una próxima actualización.
                </p>

                <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 mb-10">
                    <p className="text-sm text-gray-300 italic">
                        "La paciencia es amarga, pero su fruto es dulce." — Aristóteles
                    </p>
                </div>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all hover:scale-105"
                >
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
};

export default ComingSoonPage;
