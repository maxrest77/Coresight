"use client";

import { motion } from "framer-motion";

export default function SecondaryBackgroundVideo() {
    return (
        <div className="fixed inset-0 z-[0] w-full h-full overflow-hidden pointer-events-none">
            <motion.div
                className="w-full h-full"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                    duration: 25,
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
                    className="w-full h-full object-cover filter brightness-[0.6] blur-[1px]"
                >
                    <source src="/secondary-background.mp4" type="video/mp4" />
                </video>
            </motion.div>
            {/* Dark Overlay for readability of main content */}
            <div className="absolute inset-0 z-10 bg-slate-950/80 pointer-events-none" />
        </div>
    );
}
