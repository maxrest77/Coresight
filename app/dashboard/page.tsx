"use client";

import { motion } from "framer-motion";
import { Activity, Users, FileBarChart, Plus, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome, Dr. Smith</h2>
                    <p className="text-slate-500 dark:text-slate-400">Here's what's happening today.</p>
                </div>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2 shadow-lg shadow-cyan-500/20">
                    <Plus size={18} />
                    New Assessment
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Assessments", value: "1,284", icon: Activity, color: "text-blue-500" },
                    { label: "Patients Monitored", value: "342", icon: Users, color: "text-cyan-500" },
                    { label: "Reports Generated", value: "892", icon: FileBarChart, color: "text-purple-500" },
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-cyan-500/30 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">{stat.label}</span>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 overflow-hidden">
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-medium">
                                            JD
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-slate-200">John Doe</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">Liver Risk Assessment • Completed</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-400">2h ago</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                    <div className="space-y-4">
                        <Card className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 border-dashed border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center flex-col gap-2 text-slate-500 hover:text-cyan-500 transition-colors h-32">
                            <Plus size={24} />
                            <span className="font-medium">Upload Scan</span>
                        </Card>
                        <Card className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <FileText size={20} />
                            <span>Export Monthly Report</span>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
