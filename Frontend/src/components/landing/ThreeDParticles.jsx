import React, { useRef, useEffect } from 'react';

const ThreeDParticles = ({ particleSize = 2.1, scaleFactor = 1.5, className = "" }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width, height;

        // Morphing Configuration
        const particles = [];
        const numParticles = 1200;
        const _particleSize = particleSize;
        let currentShape = 0; // 0: Cap, 1: Book, 2: Sphere
        let lastShapeChange = 0;
        const shapeDuration = 6000;
        const transitionSpeed = 0.03;

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
            // Aumentar escala base
            scale = (Math.min(width, height) / 4) * scaleFactor;
            createParticles();
        };

        const createParticles = () => {
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: (Math.random() - 0.5) * width,
                    y: (Math.random() - 0.5) * height,
                    z: (Math.random() - 0.5) * 500,
                    tx: 0,
                    ty: 0,
                    tz: 0,
                    vx: 0,
                    vy: 0,
                    color: `rgba(0, 123, 255, ${0.4 + Math.random() * 0.4})`
                });
            }
            updateTargets(0);
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
            const ratio = 0.7;
            if (i < numParticles * ratio) {
                const a = (Math.random() - 0.5) * 2.5;
                const b = (Math.random() - 0.5) * 2.5;
                return { x: a, y: -0.5, z: b };
            } else {
                const phi = Math.random() * Math.PI / 2;
                const theta = Math.random() * Math.PI * 2;
                const r = 0.8;
                return {
                    x: r * Math.sin(phi) * Math.cos(theta),
                    y: r * Math.cos(phi) + 0.2,
                    z: r * Math.sin(phi) * Math.sin(theta)
                };
            }
        };

        const getBookPoint = (i) => {
            const side = i % 2 === 0 ? 1 : -1;
            const u = Math.random();
            const v = (Math.random() - 0.5) * 2.4;

            const x = u * 1.5;
            const z = Math.sin(u * Math.PI) * 0.4;
            const angle = 0.3 * side;

            const px = x * Math.cos(angle) - z * Math.sin(angle);
            const pz = x * Math.sin(angle) + z * Math.cos(angle);

            return {
                x: px * side,
                y: v,
                z: pz - 0.5
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

                p.tx = point.x * scale;
                p.ty = point.y * scale;
                p.tz = point.z * scale;
            });
        };

        const draw = (time) => {
            if (time - lastShapeChange > shapeDuration) {
                currentShape = (currentShape + 1) % 3;
                updateTargets(currentShape);
                lastShapeChange = time;
            }

            ctx.clearRect(0, 0, width, height);

            const targetRotX = (mouse.y - centerY) * 0.0005;
            const targetRotY = (mouse.x - centerX) * 0.0005;
            rotation.x += (targetRotX - rotation.x) * 0.1;
            rotation.y += (targetRotY - rotation.y) * 0.1;

            particles.forEach(p => {
                p.x += (p.tx - p.x) * transitionSpeed;
                p.y += (p.ty - p.y) * transitionSpeed;
                p.z += (p.tz - p.z) * transitionSpeed;

                let x1 = p.x;
                let y1 = p.y * Math.cos(rotation.x) - p.z * Math.sin(rotation.x);
                let z1 = p.y * Math.sin(rotation.x) + p.z * Math.cos(rotation.x);

                let x2 = x1 * Math.cos(rotation.y) - z1 * Math.sin(rotation.y);
                let y2 = y1;
                let z2 = x1 * Math.sin(rotation.y) + z1 * Math.cos(rotation.y);

                const fov = 1000;
                const scaleProj = fov / (fov + z2 + 800);

                const x2d = x2 * scaleProj + centerX;
                const y2d = y2 * scaleProj + centerY;

                if (scaleProj > 0) {
                    ctx.beginPath();
                    ctx.arc(x2d, y2d, _particleSize * scaleProj, 0, Math.PI * 2);
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
        <canvas
            ref={canvasRef}
            className={`absolute top-0 left-0 w-full h-full z-0 pointer-events-none ${className}`}
        />
    );
};

export default ThreeDParticles;
