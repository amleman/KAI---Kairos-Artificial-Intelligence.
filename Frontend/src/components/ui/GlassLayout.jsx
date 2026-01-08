import React from 'react';

const GlassLayout = ({ children }) => {
    return (
        <div className="relative min-h-screen w-full bg-slate-50 dark:bg-transparent overflow-hidden font-sans text-gray-800 dark:text-slate-100 transition-colors duration-300">
            {/* Organic Blobs Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] bg-pastel-pink/60 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-30 animate-blob"></div>
            <div className="absolute top-[-5%] right-[-10%] w-[45rem] h-[45rem] bg-soft-blue/60 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-15%] left-[10%] w-[50rem] h-[50rem] bg-pastel-yellow/60 dark:bg-emerald-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-30 animate-blob animation-delay-4000"></div>
            <div className="absolute bottom-[20%] right-[15%] w-[35rem] h-[35rem] bg-pastel-purple/50 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-60 dark:opacity-30 animate-blob animation-delay-3000"></div>
            <div className="absolute top-[30%] left-[40%] w-[30rem] h-[30rem] bg-pastel-green/40 dark:bg-sky-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-30 animate-blob animation-delay-5000"></div>

            {/* Content layer with glass effect filtering background */}
            <div className="relative z-10 w-full min-h-screen">
                {children}
            </div>
        </div>
    );
};

export default GlassLayout;
