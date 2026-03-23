"use client";

import { motion } from "framer-motion";
import { Scan, Activity, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";

const steps = [
    {
        icon: Scan,
        title: "AI Analysis",
        description: "Advanced algorithms scan for early indicators of liver health risks using non-invasive inputs.",
    },
    {
        icon: Activity,
        title: "Real-time Monitoring",
        description: "Continuous tracking of key biomarkers to provide up-to-date health assessments.",
    },
    {
        icon: FileText,
        title: "Comprehensive Reports",
        description: " detailed, easy-to-understand reports actionable insights for you and your specialist.",
    },
];

export default function HowItWorks() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold mb-4 text-[#caced1] dark:text-white"
                    >
                        How CoreSight Works
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-[#caced1] dark:text-slate-300 max-w-2xl mx-auto"
                    >
                        Leveraging state-of-the-art AI to transform complex medical data into clear health insights.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.2 }}
                        >
                            <Card className="h-full p-8 bg-slate-950/30 backdrop-blur-sm border-white/5 hover:border-cyan-500/30 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6">
                                    <step.icon className="w-6 h-6 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-[#caced1] dark:text-white">{step.title}</h3>
                                <p className="text-[#caced1] dark:text-slate-300 leading-relaxed">
                                    {step.description}
                                </p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
