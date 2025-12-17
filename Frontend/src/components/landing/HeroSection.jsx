import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width, height;

        // Morphing Configuration
        const particles = [];
        const numParticles = 1200; // Más densidad para formas definidas
        const particleSize = 1.6;  // Tamaño uniforme y fino
        let currentShape = 0; // 0: Cap, 1: Book, 2: Sphere
        let lastShapeChange = 0;
        const shapeDuration = 6000; // ms por forma
        const transitionSpeed = 0.03; // Lerp factor

        // View settings
        let centerX, centerY;
        let scale = 1;
        const mouse = { x: 0, y: 0 };
        const rotation = { x: 0, y: 0 };

        const init = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            centerX = width / 2;
            centerY = height / 2;
            scale = Math.min(width, height) / 4; // Ajustar escala al viewport
            createParticles();
        };

        const createParticles = () => {
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: (Math.random() - 0.5) * width, // Current positions
                    y: (Math.random() - 0.5) * height,
                    z: (Math.random() - 0.5) * 500,
                    tx: 0, // Target positions
                    ty: 0,
                    tz: 0,
                    vx: 0,
                    vy: 0,
                    color: `rgba(100, 116, 139, ${0.4 + Math.random() * 0.4})`
                });
            }
            updateTargets(0); // Iniciar con primera forma
        };

        const getSpherePoint = (i) => {
            const phi = Math.acos(-1 + (2 * i) / numParticles);
            const theta = Math.sqrt(numParticles * Math.PI) * phi;
            return {
                x: Math.cos(theta) * Math.sin(phi),
                y: Math.sin(theta) * Math.sin(phi),
                z: Math.cos(phi)
            };
        };

        const getCapPoint = (i) => {
            // Birrete: Parte superior plana (rombo) y parte inferior (pequeño cilindro/base)
            const ratio = 0.7; // % partículas arriba
            if (i < numParticles * ratio) {
                // Top board (Square rotated 45 deg)
                const a = (Math.random() - 0.5) * 2.5;
                const b = (Math.random() - 0.5) * 2.5;
                return { x: a, y: -0.5, z: b }; // Flat on Y
            } else {
                // Skull cap (Half sphere under)
                const phi = Math.random() * Math.PI / 2;
                const theta = Math.random() * Math.PI * 2;
                const r = 0.8;
                return {
                    x: r * Math.sin(phi) * Math.cos(theta),
                    y: r * Math.cos(phi) + 0.2, // Offset down
                    z: r * Math.sin(phi) * Math.sin(theta)
                };
            }
        };

        const getBookPoint = (i) => {
            // Libro abierto: Dos planos curvos
            const side = i % 2 === 0 ? 1 : -1; // Izq o Der
            const u = Math.random(); // 0 a 1 (ancho pagina)
            const v = (Math.random() - 0.5) * 2.4; // Alto pagina (2.4 alto)

            // Curvatura de pagina: z varia con x (u)
            // Lado derecho: x va de 0 a 1.5. z sube y baja levemente
            const x = u * 1.5;
            const z = Math.sin(u * Math.PI) * 0.4;

            // Rotacion basica para abrir libro
            const angle = 0.3 * side; // Angulo de apertura

            const px = x * Math.cos(angle) - z * Math.sin(angle);
            const pz = x * Math.sin(angle) + z * Math.cos(angle);

            return {
                x: px * side,
                y: v,
                z: pz - 0.5 // Push back a bit
            };
        };

        const updateTargets = (shapeIndex) => {
            particles.forEach((p, i) => {
                let point;
                switch (shapeIndex) {
                    case 0: point = getCapPoint(i); break;
                    case 1: point = getBookPoint(i); break;
                    case 2: point = getSpherePoint(i); break;
                    default: point = getSpherePoint(i);
                }

                // Asignar targets escalados
                p.tx = point.x * scale;
                p.ty = point.y * scale;
                p.tz = point.z * scale;
            });
        };

        const draw = (time) => {
            // Check cycle
            if (time - lastShapeChange > shapeDuration) {
                currentShape = (currentShape + 1) % 3;
                updateTargets(currentShape);
                lastShapeChange = time;
            }

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Rotation based on mouse
            const targetRotX = (mouse.y - centerY) * 0.0005;
            const targetRotY = (mouse.x - centerX) * 0.0005;
            rotation.x += (targetRotX - rotation.x) * 0.1;
            rotation.y += (targetRotY - rotation.y) * 0.1;

            // Sort particles by Z for depth occlusion (simple)
            // particles.sort((a, b) => b.z - a.z); // Opcional, puede ser costoso per frame

            particles.forEach(p => {
                // Morphing (Lerp)
                p.x += (p.tx - p.x) * transitionSpeed;
                p.y += (p.ty - p.y) * transitionSpeed;
                p.z += (p.tz - p.z) * transitionSpeed;

                // 3D Rotation
                let x1 = p.x;
                let y1 = p.y * Math.cos(rotation.x) - p.z * Math.sin(rotation.x);
                let z1 = p.y * Math.sin(rotation.x) + p.z * Math.cos(rotation.x);

                let x2 = x1 * Math.cos(rotation.y) - z1 * Math.sin(rotation.y);
                let y2 = y1;
                let z2 = x1 * Math.sin(rotation.y) + z1 * Math.cos(rotation.y);

                // Projection
                const fov = 1000;
                const scaleProj = fov / (fov + z2 + 800); // 800 camera dist

                const x2d = x2 * scaleProj + centerX;
                const y2d = y2 * scaleProj + centerY;

                // Draw
                if (scaleProj > 0) {
                    ctx.beginPath();
                    ctx.arc(x2d, y2d, particleSize * scaleProj, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                }
            });

            animationFrameId = requestAnimationFrame((t) => draw(t));
        };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleResize = () => {
            init();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        init();
        draw(0);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gray-50">
            {/* Canvas de Fondo */}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full z-0 opacity-60"
            />

            {/* Contenido */}
            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-[-5vh]">
                <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6 animate-fade-in-up border border-blue-200">
                    Potenciado con Inteligencia Artificial
                </span>

                <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                    SIOA: Sistema Inteligente de <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Optimización Académica
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                    Automatiza tu futuro académico. Genera horarios sin choques, analiza riesgos de asignación y proyecta tu promedio ideal con nuestros algoritmos avanzados.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link
                        to="/login"
                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center ring-2 ring-transparent hover:ring-blue-500/50"
                    >
                        Laboratorio IA
                        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </Link>

                    <Link
                        to="/register"
                        className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                        Empezar Ahora
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-gray-400">
                <span className="text-xs font-semibold uppercase tracking-widest mb-2 block text-center">Explorar</span>
                <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>
    );
};

export default HeroSection;
