"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar
} from "recharts";
import { FileBarChart, Activity, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getScanHistory, ScanRecord } from "@/lib/firestoreService";
import { useEffect, useState, useMemo } from "react";

export default function ReportsPage() {
    const { user } = useAuth();
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        getScanHistory(user.uid).then(setScans).finally(() => setLoading(false));
    }, [user]);

    // Derived statistics
    const stats = useMemo(() => {
        if (!scans.length) return { total: 0, normalPct: 0, highRiskPct: 0, avgConfidence: 0, distributions: [], volume: [] };

        let normalCount = 0;
        let highRiskCount = 0;
        let totalConfidence = 0;

        // Count distribution
        scans.forEach(s => {
            if (s.diagnosis === s.positive_class) highRiskCount++;
            else normalCount++;
            totalConfidence += s.confidence;
        });

        const total = scans.length;
        
        // Volume data grouped by month
        const monthCounts: Record<string, number> = {};
        scans.forEach(s => {
            const date = new Date(s.timestamp);
            const month = date.toLocaleString('default', { month: 'short' });
            monthCounts[month] = (monthCounts[month] || 0) + 1;
        });

        const volume = Object.entries(monthCounts)
            .map(([name, count]) => ({ name, scans: count }))
            .reverse(); // assuming history comes back newest first, we reverse to show chronological

        return {
            total,
            normalPct: (normalCount / total) * 100,
            highRiskPct: (highRiskCount / total) * 100,
            avgConfidence: (totalConfidence / total) * 100,
            distributions: [
                { name: 'Normal', value: normalCount, fill: '#10b981' },
                { name: 'High Risk', value: highRiskCount, fill: '#f43f5e' },
            ],
            volume
        };
    }, [scans]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }
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
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                        <div className="text-sm text-slate-500">Total Scans Processed</div>
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.normalPct.toFixed(1)}%</div>
                        <div className="text-sm text-slate-500">Normal Diagnoses</div>
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.highRiskPct.toFixed(1)}%</div>
                        <div className="text-sm text-slate-500">High Risk Flags</div>
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                    <div className="text-sm text-slate-500 mb-1">Average AI Confidence</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgConfidence.toFixed(1)}%</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full" style={{ width: `${stats.avgConfidence}%` }} />
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
                            <LineChart data={stats.volume} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
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
                            <BarChart data={stats.distributions} margin={{ top: 5, right: 30, left: -20, bottom: 5 }} layout="vertical">
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
