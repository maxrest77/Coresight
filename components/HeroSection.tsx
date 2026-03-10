"use client";

import { motion, useAnimation, Variants } from "framer-motion";
import BodyDiagram from "@/components/BodyDiagram";
import { useEffect } from "react";

export default function HeroSection() {
    const controls = useAnimation();

    // Trigger animation immediately on mount
    useEffect(() => {
        controls.start("visible");
    }, [controls]);

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.4,
            },
        },
    };

    const wordVariants: Variants = {
        hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                duration: 0.8,
                ease: "easeOut",
            },
        },
    };

    const subtextVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.8, // Reduced delay for faster appearance
                duration: 0.8,
                ease: "easeOut",
            },
        },
    };

    return (
        <section className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden">
            {/* 1️⃣ Video Layer (Absolute Background) */}
            <div className="absolute inset-0 z-0 select-none">
                <motion.div
                    className="w-full h-full"
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover filter brightness-[0.9]"
                    >
                        <source src="/molecular-background.mp4" type="video/mp4" />
                    </video>
                </motion.div>
                {/* Overlay for readability */}
                <div className="absolute inset-0 z-10 bg-black/20 pointer-events-none" />
            </div>

            {/* 3️⃣ Content Layer */}
            <div className="container relative z-20 mx-auto px-4 flex flex-col items-center justify-center h-full">
                {/* Text Content */}
                <div className="text-center space-y-8 max-w-4xl mx-auto">
                    <motion.h1
                        variants={containerVariants}
                        initial="hidden"
                        animate={controls}
                        className="text-5xl lg:text-7xl font-bold tracking-tight text-white flex flex-wrap justify-center gap-x-4"
                    >
                        <motion.span variants={wordVariants} className="inline-block">Seeing</motion.span>
                        <motion.span variants={wordVariants} className="inline-block">Beyond</motion.span>
                        <motion.span variants={wordVariants} className="inline-block text-cyan-400">Symptoms.</motion.span>
                    </motion.h1>

                    <motion.p
                        variants={subtextVariants}
                        initial="hidden"
                        animate={controls}
                        className="text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed"
                    >
                        AI-Powered Early Pancreas Risk Detection.
                    </motion.p>

                    <div className="flex gap-4 justify-center">
                        {/* CTA or additional links if needed */}
                    </div>
                </div>
            </div>
        </section>
    );
}
