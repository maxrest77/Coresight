"use client";

import { motion } from "framer-motion";

export default function Disclaimer() {
    return (
        <section className="py-12 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-white/5">
            <div className="container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mx-auto space-y-4"
                >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">
                        Responsible AI Disclaimer
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        CoreSight AI is a clinical decision support tool and is not intended to replace professional medical advice, diagnosis, or treatment.
                        Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                        Our AI models are continuously validated but should be used as an assistive technology.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
