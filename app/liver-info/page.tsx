"use client";

import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LiverInfoPage() {
    const router = useRouter();

    const infoCards = [
        {
            title: "Functions",
            content: "The liver filters blood, produces bile for digestion, and stores essential vitamins and minerals.",
            icon: "⚡",
        },
        {
            title: "Risks",
            content: "Excessive alcohol, fatty diet, and viral infections can lead to cirrhosis or liver failure.",
            icon: "⚠️",
        },
        {
            title: "Importance",
            content: "It is the body's metabolic powerhouse. Early detection of issues can save lives.",
            icon: "❤️",
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
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        Liver Health Insights
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Understanding the vital role of your liver is the first step towards better health.
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
                            <Card className="h-full hover:border-cyan-500/50 transition-colors group">
                                <div className="text-4xl mb-4 text-cyan-500/80 group-hover:text-cyan-400 transition-colors">
                                    {card.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-white">{card.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">
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
                        onClick={() => router.push("/diagnosis")}
                        className="px-12 py-6 text-lg animate-pulse hover:animate-none"
                    >
                        Start Diagnosis
                    </Button>
                </motion.div>
            </div>
        </main>
    );
}
