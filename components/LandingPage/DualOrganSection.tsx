"use client";

import { motion } from "framer-motion";
import { Activity, Beaker } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function DualOrganSection() {
    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Pancreas AI Model - Centered */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <Card className="h-full p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200 dark:border-amber-900/30 hover:shadow-amber-500/10 transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-6">
                            <Beaker className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Pancreas AI Model
                        </h3>
                        <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                                <span>Multi-factor analysis of enzymes and glucose indicators</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                                <span>Risk stratification for metabolic complications</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                                <span>Preventive insight driven by clinical correlations</span>
                            </li>
                        </ul>
                    </Card>
                </motion.div>
            </div>
        </section>
    );
}
