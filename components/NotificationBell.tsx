"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";
import { AppNotification } from "@/lib/firestoreService";

export default function NotificationBell() {
    const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (n: AppNotification) => {
        setIsOpen(false);
        if (!n.read) {
            await markAsRead(n.id);
        }
        router.push("/pancreas-scan?tab=history");
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 z-50 flex flex-col"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium flex items-center gap-1"
                                >
                                    <Check size={14} /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                    <p className="text-sm">No notifications yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex gap-3 ${!n.read ? "bg-cyan-50/50 dark:bg-cyan-900/10" : ""}`}
                                        >
                                            <div className="shrink-0 mt-1">
                                                <div className={`w-2 h-2 rounded-full ${!n.read ? "bg-cyan-500" : "bg-transparent"}`} />
                                            </div>
                                            <div>
                                                <p className={`text-sm ${!n.read ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-600 dark:text-slate-400"}`}>
                                                    {n.message}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  · {new Date(n.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
