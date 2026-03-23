"use client";

import { motion } from "framer-motion";

export default function AboutSection() {
    return (
        <section className="py-16 bg-white dark:bg-slate-950">
            <div className="container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-3xl mx-auto space-y-6"
                >
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        About CoreSight AI
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                        CoreSight AI is an advanced preventive health platform utilizing artificial intelligence to assess Pancreas health risks.
                        By analyzing key biomarkers and clinical data, we provide data-driven insights to assist in early detection and preventive care.
                        This tool is designed to support, not replace, professional medical diagnosis.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
