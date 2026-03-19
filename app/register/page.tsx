"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// Separate component to wrap in Suspense because useSearchParams causes hydration mismatch if not handled properly in some Next.js versions/configs
function RegisterForm() {
    const { register } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = searchParams.get("type"); // 'pancreas'

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState<string | null>(null);

    const getFriendlyErrorMessage = (errorCode: string) => {
        switch (errorCode) {
            case "auth/email-already-in-use":
                return "This email is already registered. Please sign in instead.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/weak-password":
                return "Password is too weak. Please use at least 6 characters.";
            case "auth/network-request-failed":
                return "Network error. Please check your connection.";
            default:
                return "Failed to create account. Please try again.";
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await register(email, password, name);
            router.push(type ? `/dashboard?assessment=${type}` : "/dashboard");
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err.code));
        }
    };

    return (
        <>
            {error && (
                <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name
                </label>
                <Input
                    type="text"
                    placeholder="Dr. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                </label>
                <Input
                    type="email"
                    placeholder="doctor@clinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password
                </label>
                <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            <Button type="submit" className="w-full h-11 text-lg">
                Start Assessment
            </Button>
        </form>
        </>
    );
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <Navbar />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-8"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h1>
                    <p className="text-slate-600 dark:text-slate-400">Start your AI-powered health assessment</p>
                </div>

                <Suspense fallback={<div>Loading form...</div>}>
                    <RegisterForm />
                </Suspense>

                <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                    Already have an account?{" "}
                    <Link href="/login" className="text-cyan-500 hover:text-cyan-600 font-medium">
                        Sign in
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
