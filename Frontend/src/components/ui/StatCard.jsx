import React from 'react';
import GlassCard from './GlassCard';

const StatCard = ({ title, value, icon: Icon, colorClass = "text-gray-800" }) => {
    return (
        <GlassCard className="flex items-center space-x-4 hover:scale-105 transition-transform duration-300">
            <div className={`p-3 rounded-full bg-white/50 ${colorClass}`}>
                {Icon && <Icon className="w-8 h-8" />}
            </div>
            <div>
                <p className="text-sm text-gray-600 font-medium tracking-wide uppercase">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
        </GlassCard>
    );
};

export default StatCard;
