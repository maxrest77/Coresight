"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import BodyDiagram from "@/components/BodyDiagram";

export default function CTA() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-950/10 dark:bg-cyan-950/20 -z-10" />
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8 text-center lg:text-left"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold text-[#9aa2a6] dark:text-white">
                            Start Your Organ Health Assessment
                        </h2>
                        <p className="text-lg text-[#9aa2a6] dark:text-slate-300">
                            Join thousands of patients and providers using CoreSight for proactive health management.
                        </p>
                        <div className="flex justify-center lg:justify-start">
                            <Link href="/pancreas-scan">
                                <Button className="h-12 px-8 text-lg bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-shadow">
                                    Start Pancreas Assessment
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="flex justify-center"
                    >
                        <div className="relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl -z-10" />
                            <BodyDiagram />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
