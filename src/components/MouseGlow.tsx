"use client";

import { useEffect, useRef } from "react";

export function MouseGlow() {
    const glowRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const targetPosition = useRef({ x: 0, y: 0 });
    const currentPosition = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const glow = glowRef.current;
        if (!glow) return;

        // Set initial position to center
        const rect = glow.parentElement?.getBoundingClientRect();
        if (rect) {
            currentPosition.current = { x: rect.width / 2, y: rect.height / 2 };
            targetPosition.current = { ...currentPosition.current };
        }

        const handleMouseMove = (e: MouseEvent) => {
            const parent = glow.parentElement;
            if (!parent) return;

            const rect = parent.getBoundingClientRect();
            targetPosition.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        // Smooth animation loop with lerp (linear interpolation)
        // Lerp factor 0.08 = soft, laggy follow; very resource-efficient
        const animate = () => {
            const lerp = 0.08;
            currentPosition.current.x += (targetPosition.current.x - currentPosition.current.x) * lerp;
            currentPosition.current.y += (targetPosition.current.y - currentPosition.current.y) * lerp;

            // Use transform for GPU acceleration (no repaints)
            glow.style.transform = `translate(${currentPosition.current.x}px, ${currentPosition.current.y}px) translate(-50%, -50%)`;

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Start animation loop
        animationFrameRef.current = requestAnimationFrame(animate);

        // Add mouse listener with passive flag for performance
        window.addEventListener("mousemove", handleMouseMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return <div ref={glowRef} className="mouse-glow" aria-hidden="true" />;
}
