import React from 'react';

const GlassCard = ({ children, className = "", ...props }) => {
    return (
        <div
            className={`
        bg-white/30 
        backdrop-blur-md 
        border border-white/40 
        shadow-xl 
        rounded-2xl 
        p-6 
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
};

export default GlassCard;
