"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Activity,
    FileText,
    Settings,
    LogOut,
    Menu,
    User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationBell from "@/components/NotificationBell";
import NotificationToast from "@/components/NotificationToast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login"); // Fixed typo from lgoin
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    const navItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
        { icon: Activity, label: "CoreSight AI Scanner", href: "/pancreas-scan" },
        { icon: FileText, label: "Reports", href: "/dashboard/reports" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ];

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
                {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 hidden md:flex flex-col"
            >
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-white/5">
                    <Link href="/" className={`font-bold text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 overflow-hidden whitespace-nowrap ${!isSidebarOpen && "hidden"}`}>
                        CoreSight AI
                    </Link>
                    {!isSidebarOpen && (
                        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">C</div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === item.href
                                ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                                }`}>
                                <item.icon size={20} />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </div>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-4 mb-4" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                            <Menu size={20} className="text-slate-500" />
                        </button>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={async () => {
                            await logout();
                            router.push("/login");
                        }}
                        className={`w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 ${!isSidebarOpen && "px-2 justify-center"}`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && "Logout"}
                    </Button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "md:ml-[280px]" : "md:ml-[80px]"}`}>
                {/* Header */}
                <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-white/5 px-6 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <ThemeToggle />
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                            <User size={16} className="text-slate-500" />
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-8 space-y-8">
                    {children}
                </div>
            </main>
            <NotificationToast />
        </div>
        </NotificationProvider>
    );
}
