"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend
} from "recharts";
import { FileBarChart, Activity, ShieldAlert, CheckCircle2 } from "lucide-react";

const scanVolumeData = [
  { name: 'Jan', scans: 145 },
  { name: 'Feb', scans: 182 },
  { name: 'Mar', scans: 224 },
  { name: 'Apr', scans: 278 },
  { name: 'May', scans: 312 },
  { name: 'Jun', scans: 342 },
];

const diagnosticDistribution = [
  { name: 'Normal', value: 840, fill: '#10b981' }, // emerald-500
  { name: 'High Risk (Tumor)', value: 124, fill: '#f43f5e' }, // rose-500
  { name: 'Inconclusive', value: 36, fill: '#f59e0b' }, // amber-500
];

export default function ReportsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <FileBarChart className="text-cyan-500" />
                    Clinical Reports & Analytics
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Longitudinal statistics and accuracy metrics for CoreSight AI.
                </p>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">1,000</div>
                        <div className="text-sm text-slate-500">Total Scans Processed</div>
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">84%</div>
                        <div className="text-sm text-slate-500">Normal Diagnoses</div>
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">12.4%</div>
                        <div className="text-sm text-slate-500">High Risk Flags</div>
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                    <div className="text-sm text-slate-500 mb-1">Average AI Confidence</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">96.8%</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full w-[96.8%]" />
                    </div>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Line Chart */}
                <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Scan Volume Over Time</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={scanVolumeData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#06b6d4' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="scans" 
                                    stroke="#06b6d4" 
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Bar Chart */}
                <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Diagnostic Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diagnosticDistribution} margin={{ top: 5, right: 30, left: -20, bottom: 5 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
