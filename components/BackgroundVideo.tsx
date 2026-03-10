"use client";

import { motion } from "framer-motion";

export default function BackgroundVideo() {
    return (
        <div className="fixed inset-0 z-[-10] w-full h-full overflow-hidden pointer-events-none">
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
            {/* Subtle Overlay for readability */}
            <div className="absolute inset-0 z-10 bg-black/20 pointer-events-none" />
        </div>
    );
}
