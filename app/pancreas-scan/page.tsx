"use client";

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SingleScanAnalysis } from "@/components/pancreas/SingleScanAnalysis";
import { BatchAnalysis } from "@/components/pancreas/BatchAnalysis";
import { ScanHistory } from "@/components/pancreas/ScanHistory";
import { Activity, Layers, History, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function PancreasScanContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("single");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["single", "batch", "history"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.replace(`/pancreas-scan?tab=${val}`, { scroll: false });
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <Navbar />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <motion.div 
                className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-cyan-500/5 blur-[100px]"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
                className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/5 blur-[100px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="relative z-10 w-full max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 md:p-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-8"
          >
            <ShieldAlert className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Authentication Required
          </h2>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            To access the CoreSight AI diagnostic features, please register an account or sign in if you already have one.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/login")}
              className="w-full relative group overflow-hidden rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold h-12 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">Sign In</span>
            </button>
            
            <button
              onClick={() => router.push("/register?type=pancreas")}
              className="w-full relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-semibold h-12 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            >
              <span>Create Account</span>
            </button>
            
            <button
              onClick={() => router.back()}
              className="w-full mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors py-2"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 px-4 pb-12 transition-colors duration-300">
      <Navbar />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
             <div className="p-3 bg-amber-500/10 rounded-xl">
               <Activity className="w-8 h-8 text-amber-500" />
             </div>
             <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
               CoreSight AI Diagnostic Engine
             </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 max-w-3xl text-lg">
            Advanced machine learning inference for the early detection of pancreatic malignancies from CT scan imagery.
          </p>

          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 rounded-lg p-3 border border-amber-200 dark:border-amber-900/50 dark:bg-amber-900/10 text-sm max-w-max">
             <ShieldAlert className="w-5 h-5 shrink-0" />
             <span>For research and investigational use only. Not a replacement for professional radiological review.</span>
          </div>
        </motion.div>

        {/* Main Interface */}
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-6 md:p-8"
        >
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-8 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger value="single" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 flex items-center gap-2">
                <Activity className="w-4 h-4" /> 
                <span className="hidden sm:inline">Single</span> Scan
              </TabsTrigger>
              <TabsTrigger value="batch" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 flex items-center gap-2">
                <Layers className="w-4 h-4" /> 
                <span className="hidden sm:inline">Batch</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 flex items-center gap-2">
                <History className="w-4 h-4" /> 
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="focus-visible:outline-none focus-visible:ring-0">
               <SingleScanAnalysis />
            </TabsContent>

            <TabsContent value="batch" className="focus-visible:outline-none focus-visible:ring-0">
               <div className="max-w-4xl mx-auto">
                 <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">
                   High-Throughput Batch Processing
                 </h3>
                 <BatchAnalysis />
               </div>
            </TabsContent>

            <TabsContent value="history" className="focus-visible:outline-none focus-visible:ring-0">
               <div className="max-w-4xl mx-auto">
                 <ScanHistory />
               </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  );
}

export default function PancreasScanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center pt-24" />}>
      <PancreasScanContent />
    </Suspense>
  );
}
