"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function DiagnosisPage() {
    const [formData, setFormData] = useState({
        age: "",
        bilirubin: "",
        sgpt: "",
        sgot: "",
        albumin: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle submission - for now just log
        console.log("Analyzing:", formData);
        alert("Analysis started... (Simulation)");
    };

    const formFields: { name: keyof typeof formData; label: string; type: string; step?: string }[] = [
        { name: "age", label: "Age", type: "number" },
        { name: "bilirubin", label: "Total Bilirubin", type: "number", step: "0.1" },
        { name: "sgpt", label: "SGPT (ALT)", type: "number" },
        { name: "sgot", label: "SGOT (AST)", type: "number" },
        { name: "albumin", label: "Albumin", type: "number", step: "0.1" },
    ];

    return (
        <main className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
            <Navbar />

            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-lg"
            >
                <Card className="backdrop-blur-xl bg-slate-900/40 border-slate-700/50 shadow-2xl">
                    <div className="mb-8 text-center space-y-2">
                        <h2 className="text-2xl font-bold text-white">Input Medical Data</h2>
                        <p className="text-sm text-slate-400">Enter patient metrics for AI analysis</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-5">
                            {formFields.map((field) => (
                                <div key={field.name} className="space-y-1">
                                    <label className="text-xs font-semibold text-cyan-500 uppercase tracking-wider ml-1">
                                        {field.label}
                                    </label>
                                    <Input
                                        name={field.name}
                                        type={field.type}
                                        step={field.step}
                                        placeholder={`Enter ${field.label}`}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            ))}
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-8 py-4 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none shadow-lg shadow-cyan-900/20"
                        >
                            Run Analysis
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </main>
    );
}
