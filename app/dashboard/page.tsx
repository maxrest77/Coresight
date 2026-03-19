"use client";

import { motion } from "framer-motion";
import { Activity, ShieldAlert, CheckCircle2, Plus, FileText, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getScanHistory, getUserProfile, ScanRecord, UserProfile } from "@/lib/firestoreService";
import { useEffect, useState, useMemo } from "react";
import { generateMonthlyReport } from "@/lib/utils/pdfGenerator";

export default function DashboardPage() {
    const { user } = useAuth();
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        setLoading(true);
        Promise.all([
            getScanHistory(user.uid),
            getUserProfile(user.uid)
        ])
        .then(([scansData, profileData]) => {
            setScans(scansData);
            setProfile(profileData);
        })
        .finally(() => setLoading(false));
    }, [user]);

    const stats = useMemo(() => {
        let normalCount = 0;
        let highRiskCount = 0;
        scans.forEach(s => {
            if (s.diagnosis === s.positive_class) highRiskCount++;
            else normalCount++;
        });
        return {
            total: scans.length,
            normal: normalCount,
            highRisk: highRiskCount
        };
    }, [scans]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    const displayName = profile?.displayName || user?.displayName || "Doctor";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome, {displayName}</h2>
                    <p className="text-slate-500 dark:text-slate-400">Here's a summary of your automated assessments.</p>
                </div>
                <Link href="/pancreas-scan">
                    <Button className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2 shadow-lg shadow-cyan-500/20">
                        <Plus size={18} />
                        New Assessment
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Assessments", value: stats.total.toString(), icon: Activity, color: "text-blue-500" },
                    { label: "Normal Findings", value: stats.normal.toString(), icon: CheckCircle2, color: "text-emerald-500" },
                    { label: "High Risk Detects", value: stats.highRisk.toString(), icon: ShieldAlert, color: "text-rose-500" },
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
                            {scans.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No scans performed yet. 
                                </div>
                            ) : (
                                scans.slice(0, 5).map((scan, i) => {
                                    const isTumor = scan.diagnosis === scan.positive_class;
                                    const dateStr = new Date(scan.timestamp).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                    });
                                    return (
                                        <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium
                                                    ${isTumor ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' 
                                                              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}
                                                >
                                                    {isTumor ? 'HR' : 'N'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-slate-200">
                                                        {scan.organ.charAt(0).toUpperCase() + scan.organ.slice(1)} Scan
                                                    </div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                                        {isTumor ? 'High Risk Detected' : 'Normal Pattern'} • {(scan.confidence * 100).toFixed(1)}% Confidence
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-400 whitespace-nowrap">{dateStr}</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                    <div className="space-y-4">
                        <Link href="/pancreas-scan">
                            <Card className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 border-dashed border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center flex-col gap-2 text-slate-500 hover:text-cyan-500 transition-colors h-32">
                                <Plus size={24} />
                                <span className="font-medium">Upload Scan</span>
                            </Card>
                        </Link>
                        <Card 
                            className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors"
                            onClick={() => generateMonthlyReport(scans, profile)}
                        >
                            <FileText size={20} />
                            <span>Export Monthly Report</span>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
