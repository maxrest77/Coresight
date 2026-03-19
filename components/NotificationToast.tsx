"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { AppNotification } from "@/lib/firestoreService";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationToast() {
    const { notifications, markAsRead } = useNotifications();
    const [latestUnread, setLatestUnread] = useState<AppNotification | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Find the most recent unread notification
        const newestUnread = notifications.find(n => !n.read);
        
        // Only show if it's genuinely new (different ID from what we already tracked)
        if (newestUnread && newestUnread.id !== latestUnread?.id) {
            setLatestUnread(newestUnread);
        } else if (!newestUnread) {
            // Dismiss toast if all were marked read
            setLatestUnread(null);
        }
    }, [notifications, latestUnread]);

    useEffect(() => {
        if (!latestUnread) return;

        // Auto-dismiss after 7 seconds
        const timer = setTimeout(() => {
            setLatestUnread(null);
        }, 7000);

        return () => clearTimeout(timer);
    }, [latestUnread]);

    const handleClick = async () => {
        if (latestUnread) {
            await markAsRead(latestUnread.id);
        }
        setLatestUnread(null);
        router.push("/pancreas-scan?tab=history");
    };

    return (
        <AnimatePresence>
            {latestUnread && (
                <motion.div
                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-rose-900/50 shadow-2xl rounded-2xl p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <div onClick={handleClick} className="flex gap-4 items-start">
                        <div className="shrink-0 p-2 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                Action Required
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                                {latestUnread.message}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setLatestUnread(null);
                        }}
                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={16} />
                    </button>
                    
                    {/* Progress bar for 7s */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 rounded-b-2xl overflow-hidden">
                        <motion.div 
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 7, ease: "linear" }}
                            className="h-full bg-rose-500"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
