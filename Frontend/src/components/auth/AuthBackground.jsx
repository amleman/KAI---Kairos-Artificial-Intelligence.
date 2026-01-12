import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const colors = [
    'bg-sky-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-emerald-400',
    'bg-amber-400',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-cyan-400',
    'bg-orange-400', // Soft orange
    'bg-amber-300'   // Warm city light
];

const AuthBackground = () => {
    // Generate static random values once to avoid hydration mismatch or re-renders changing positions excessively
    // However, since this is a client-side visualization, we can just generate them on mount.
    const [circles, setCircles] = useState([]);

    useEffect(() => {
        const newCircles = Array.from({ length: 60 }).map((_, i) => ({ // Increased to 120 for high density
            id: i,
            size: Math.floor(Math.random() * 60) + 10, // 10px - 70px (Smaller average size)
            top: Math.floor(Math.random() * 100),
            left: Math.floor(Math.random() * 100),
            color: colors[Math.floor(Math.random() * colors.length)],
            duration: Math.random() * 5 + 3, // 3-8s (Slower pulsing)
            delay: Math.random() * 5, // 0-5s (More distributed start times)
        }));
        setCircles(newCircles);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black">
            {circles.map((circle) => (
                <motion.div
                    key={circle.id}
                    className={`absolute rounded-full ${circle.color} blur-md`} // blur-md for tighter lights
                    style={{
                        top: `${circle.top}%`,
                        left: `${circle.left}%`,
                        width: circle.size,
                        height: circle.size,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        scale: [0, 1.2, 0], // Scale up and down
                        opacity: [0, 0.8, 0], // Fade in and out
                    }}
                    transition={{
                        duration: circle.duration,
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: circle.delay,
                        ease: "easeInOut"
                    }}
                />
            ))}
            {/* Subtle overlay to blend them slightly */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
        </div>
    );
};

export default AuthBackground;
