"use client";

import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Beaker, Activity, AlertTriangle } from "lucide-react";

export default function PancreasInfoPage() {
    const router = useRouter();

    const infoCards = [
        {
            title: "Functions",
            content: "Produces enzymes for digestion and hormones like insulin to regulate blood sugar.",
            icon: Beaker,
        },
        {
            title: "Risks",
            content: "Pancreatitis, diabetes, and pancreatic cancer are serious risks often linked to lifestyle.",
            icon: AlertTriangle,
        },
        {
            title: "Importance",
            content: "Critical for both digestion and metabolic health. Early screening is vital.",
            icon: Activity,
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 50 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 px-4 pb-12 transition-colors duration-300">
            <Navbar />

            <div className="max-w-6xl mx-auto space-y-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                        Pancreas Health Insights
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Understanding your pancreas is key to metabolic balance and overall longevity.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-3 gap-6"
                >
                    {infoCards.map((card, idx) => (
                        <motion.div key={idx} variants={item}>
                            <Card className="h-full hover:border-amber-500/50 transition-colors group p-6">
                                <div className="text-4xl mb-4 text-amber-500/80 group-hover:text-amber-400 transition-colors">
                                    <card.icon size={40} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">{card.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                    {card.content}
                                </p>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center pt-8"
                >
                    <Button
                        onClick={() => router.push("/register?type=pancreas")}
                        className="px-12 py-6 text-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                    >
                        Start Pancreas Assessment
                    </Button>
                </motion.div>
            </div>
        </main>
    );
}
