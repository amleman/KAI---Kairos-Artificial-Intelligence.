import React from 'react';

const GlassLayout = ({ children }) => {
    return (
        <div className="relative min-h-screen w-full bg-slate-50 overflow-hidden font-sans text-gray-800">
            {/* Organic Blobs Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] bg-pastel-pink/60 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-[-5%] right-[-10%] w-[45rem] h-[45rem] bg-soft-blue/60 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-15%] left-[10%] w-[50rem] h-[50rem] bg-pastel-yellow/60 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
            <div className="absolute bottom-[20%] right-[15%] w-[35rem] h-[35rem] bg-pastel-purple/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-3000"></div>
            <div className="absolute top-[30%] left-[40%] w-[30rem] h-[30rem] bg-pastel-green/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-5000"></div>

            {/* Content layer with glass effect filtering background */}
            <div className="relative z-10 w-full min-h-screen">
                {children}
            </div>
        </div>
    );
};

export default GlassLayout;
