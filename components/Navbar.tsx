"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, logout } = useAuth();

    const links = [
        { href: "/", label: "Home" },
        { href: "/pancreas-scan", label: "CoreSight AI" },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 dark:border-white/5 bg-white/60 dark:bg-slate-950/80 backdrop-blur-lg transition-colors duration-300"
        >
            <Link href="/" className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500">
                CoreSight AI
            </Link>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex gap-6">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors hover:text-cyan-500 dark:hover:text-cyan-400 ${pathname === link.href ? "text-cyan-600 dark:text-cyan-400" : "text-slate-600 dark:text-slate-400"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="outline" className="text-sm h-9 px-4">
                                    Dashboard
                                </Button>
                            </Link>
                            <Button
                                onClick={() => {
                                    logout();
                                    router.push('/');
                                }}
                                variant="ghost"
                                className="text-sm h-9 px-4 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" className="text-sm h-9 px-4">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="text-sm h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white border-0">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
