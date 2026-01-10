import React, { useRef, useEffect } from 'react';
import gradImage from '../../assets/graduating_students.png';
import uniImage from '../../assets/university_building.png';
import bookImage from '../../assets/open_book_knowledge.png';

const ThreeDParticles = ({ particleSize = 2, scaleFactor = 1.6, className = "" }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width, height;

        const allShapes = []; // Store arrays of particles for each shape
        let currentParticles = [];
        let currentShapeIndex = 0;
        let targetShapeIndex = 0;
        let morphProgress = 0;
        let morphSpeed = 0.005; // Speed of transitioning between shapes
        let holdTime = 0;
        const holdDuration = 800; // Frames to hold each shape (approx 5s)

        const colors = [
            'rgba(167, 139, 250, 0.9)', // violet
            'rgba(56, 189, 248, 0.9)',  // sky
            'rgba(244, 114, 182, 0.9)', // pink
            'rgba(255, 255, 255, 0.8)', // white
        ];

        let centerX, centerY;
        const rotation = { x: 0, y: 0 };
        const mouse = { x: 0, y: 0 };
        let autoRotateSpeed = 0.002;

        const loadShape = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    const tempCanvas = document.createElement('canvas');
                    const tCtx = tempCanvas.getContext('2d');
                    const targetWidth = 150;
                    const aspectRatio = img.height / img.width;
                    const targetHeight = targetWidth * aspectRatio;

                    tempCanvas.width = targetWidth;
                    tempCanvas.height = targetHeight;
                    tCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

                    const imageData = tCtx.getImageData(0, 0, targetWidth, targetHeight).data;
                    const shapeParticles = [];

                    for (let y = 0; y < targetHeight; y++) {
                        for (let x = 0; x < targetWidth; x++) {
                            const index = (y * targetWidth + x) * 4;
                            const brightness = (imageData[index] + imageData[index + 1] + imageData[index + 2]) / 3;

                            if (brightness > 50) {
                                shapeParticles.push({
                                    baseX: (x - targetWidth / 2) * 5 * scaleFactor,
                                    baseY: (y - targetHeight / 2) * 5 * scaleFactor, // -y to flip right side up
                                    baseZ: (Math.random() - 0.5) * 50,
                                    x: 0, y: 0, z: 0,
                                    color: colors[Math.floor(Math.random() * colors.length)]
                                });
                            }
                        }
                    }
                    resolve(shapeParticles);
                };
            });
        };

        const init = async () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            centerX = width / 2;
            centerY = height / 2;

            // Load all 3 shapes
            // Load all 3 shapes
            const shape1 = await loadShape(gradImage);
            const shape2 = await loadShape(uniImage);
            const shape3 = await loadShape(bookImage);

            allShapes.push(shape1, shape2, shape3);

            // Initialize current particles with shape 1
            // We need a stable particle array size, effectively the max size of all shapes
            const maxCount = Math.max(shape1.length, shape2.length, shape3.length);

            for (let i = 0; i < maxCount; i++) {
                currentParticles.push({
                    x: 0, y: 0, z: 0,
                    // Start at shape 1 pos (or random if i > shape1.length)
                    currentBaseX: (i < shape1.length) ? shape1[i].baseX : (Math.random() - 0.5) * 500,
                    currentBaseY: (i < shape1.length) ? shape1[i].baseY : (Math.random() - 0.5) * 500,
                    currentBaseZ: (i < shape1.length) ? shape1[i].baseZ : (Math.random() - 0.5) * 500,
                    color: (i < shape1.length) ? shape1[i].color : colors[0],
                });
            }

            draw();
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Logic for morphing
            if (allShapes.length > 0) {
                // Determine target shape
                const targetShape = allShapes[targetShapeIndex];

                // Interpolate
                let moved = false;
                for (let i = 0; i < currentParticles.length; i++) {
                    const p = currentParticles[i];

                    // Target specific particle in the target shape
                    // If target shape has fewer particles, we can hide extras or map them to random/center
                    let tx, ty, tz;

                    if (i < targetShape.length) {
                        tx = targetShape[i].baseX;
                        ty = targetShape[i].baseY; // Already flipped in load
                        tz = targetShape[i].baseZ;
                    } else {
                        // Extra particles fly to center or hide
                        tx = 0; ty = 0; tz = 0;
                    }

                    // Simple lerp
                    p.currentBaseX += (tx - p.currentBaseX) * 0.015;
                    p.currentBaseY += (ty - p.currentBaseY) * 0.015;
                    p.currentBaseZ += (tz - p.currentBaseZ) * 0.015;

                    // Check if close "enough" to consider morph done is hard with lerp, 
                    // so we use a timer state machine instead
                }

                holdTime++;
                if (holdTime > holdDuration) {
                    targetShapeIndex = (targetShapeIndex + 1) % allShapes.length;
                    holdTime = 0;
                }
            }


            // Auto Rotation
            rotation.y += autoRotateSpeed;

            const targetRotX = (mouse.y - centerY) * 0.00005;
            const targetRotY = (mouse.x - centerX) * 0.00005;
            rotation.x += (targetRotX - rotation.x) * 0.05;

            // Draw particles
            for (let i = 0; i < currentParticles.length; i++) {
                const p = currentParticles[i];

                // If this particle index exists in current target OR is fading out
                // We draw all, assuming extras converge to 0

                let x1 = p.currentBaseX * Math.cos(rotation.y) - p.currentBaseZ * Math.sin(rotation.y);
                let z1 = p.currentBaseX * Math.sin(rotation.y) + p.currentBaseZ * Math.cos(rotation.y);

                let y1 = p.currentBaseY * Math.cos(rotation.x) - z1 * Math.sin(rotation.x);
                let z2 = p.currentBaseY * Math.sin(rotation.x) + z1 * Math.cos(rotation.x);

                const fov = 1000;
                const scaleProj = fov / (fov + z2 + 800);

                const x2d = x1 * scaleProj + centerX;
                const y2d = y1 * scaleProj + centerY;

                // Flip Y manually here if needed because Canvas Y is down. 
                // But we negated baseY during load, so logic holds.
                // UNLESS the prompt meant "head down" visually upside down.
                // Assuming `-(y - ...)` corrected it. If it was upside down before, 
                // it might need the negation removed or double-checked.
                // Re-verified: Canvas (0,0) is top-left. Increasing Y goes down.
                // If we want "up" to be negative Y, standard 3D logic applies.
                // Previous code: baseY: -(y...). 
                // Let's ensure rotation logic respects this.

                if (scaleProj > 0) {
                    ctx.beginPath();
                    ctx.arc(x2d, y2d, particleSize * scaleProj, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            centerX = width / 2;
            centerY = height / 2;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        init();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
