import React from 'react';

const GlassLayout = ({ children }) => {
    return (
        <div className="relative min-h-screen w-full bg-slate-50 dark:bg-transparent overflow-hidden font-sans text-gray-800 dark:text-slate-100 transition-colors duration-300">
            {/* Organic Blobs Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] bg-gradient-to-br from-sky-400 to-blue-600 dark:bg-purple-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-30 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[45rem] h-[45rem] bg-gradient-to-tr from-[#FFEDD5] to-orange-200 dark:bg-orange-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[25%] w-[50rem] h-[50rem] bg-gradient-to-bl from-emerald-300 to-teal-500 dark:bg-emerald-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-30 animate-blob animation-delay-4000"></div>

            {/* Content layer with glass effect filtering background */}
            <div className="relative z-10 w-full min-h-screen">
                {children}
            </div>
        </div>
    );
};

export default GlassLayout;
