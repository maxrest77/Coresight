"use client";

import { motion } from "framer-motion";

export default function ClinicalImpact() {
    return (
        <section className="py-24 bg-white dark:bg-slate-950">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
                            Clinical Impact & Accuracy
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Early detection is the single most important factor in managing liver health.
                            CoreSight AI utilizes models trained on over 2 million clinical data points to identify potential risks before symptoms manifest.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "94% Accuracy in early-stage risk identification",
                                "Reduced false positive rates via multi-modal analysis",
                                "Seamless integration with existing EHR systems"
                            ].map((item, index) => (
                                <li key={index} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="relative h-[400px] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center"
                    >
                        {/* Abstract visual representation of data/accuracy */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10" />
                        <div className="text-center p-8">
                            <div className="text-6xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">2M+</div>
                            <div className="text-slate-500 dark:text-slate-400 font-medium">Data Points Analyzed</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
