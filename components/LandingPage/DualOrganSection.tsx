"use client";

import { motion } from "framer-motion";
import { Activity, Beaker } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function DualOrganSection() {
    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
                    {/* Liver AI Model - Enters from Left */}
                    <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Card className="h-full p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200 dark:border-cyan-900/30 hover:shadow-cyan-500/10 transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mb-6">
                                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                Liver AI Model
                            </h3>
                            <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                                    <span>Biomarker-based analysis for accurate risk scoring</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                                    <span>Focus on early detection of fibrosis and steatosis</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                                    <span>Longitudinal tracking of liver enzyme trends</span>
                                </li>
                            </ul>
                        </Card>
                    </motion.div>

                    {/* Pancreas AI Model - Enters from Right */}
                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
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
            </div>
        </section>
    );
}
