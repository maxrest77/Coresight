"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import DigestiveSystemSVG from "./DigestiveSystemSVG";

export default function BodyDiagram() {
    const router = useRouter();
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const handleRegionClick = (region: string) => {
        if (region === "Liver") {
            router.push("/liver-info");
        } else if (region === "Pancreas") {
            router.push("/pancreas-info");
        } else {
            console.log(`Clicked on ${region}`);
        }
    };

    return (
        <div className="relative w-full max-w-[400px] h-[600px] mx-auto flex items-center justify-center">
            <div className="w-full h-full">
                <DigestiveSystemSVG
                    onRegionHover={setHoveredRegion}
                    onRegionClick={handleRegionClick}
                    hoveredRegion={hoveredRegion}
                />
            </div>

            {/* Floating Tooltip - Portaled to document.body to avoid stacking context issues */}
            {mounted && hoveredRegion && createPortal(
                <div
                    className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]"
                    style={{ position: 'fixed', top: 0, left: 0 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={hoveredRegion}
                            className="absolute pointer-events-none bg-slate-900 dark:bg-slate-900/95 border-2 border-cyan-500 text-white px-4 py-2 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.5)] text-sm font-medium whitespace-nowrap"
                            style={{
                                left: mousePos.x,
                                top: mousePos.y,
                                transform: 'translate(15px, -15px)' // Offset from cursor by 15px
                            }}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className="text-white font-bold text-base block">{hoveredRegion}</span>
                            <div className="text-xs text-cyan-300 mt-1 font-semibold">Click for analysis</div>
                        </motion.div>
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </div>
    );
}
