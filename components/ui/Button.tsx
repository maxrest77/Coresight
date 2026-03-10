import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "outline" | "ghost";
}

// Ensure lib/utils exists or create inline
// I will assume the user has not set up lib/utils yet, so I will define cn here or creating lib/utils is better.
// I will create lib/utils next. For now, I'll inline a simple class merger or just use template literals if simple.
// But I installed clsx and tailwind-merge.
// So I will create lib/utils first? No, I'll stick to simple implementation here if possible or assume I'll create lib/utils.
// I'll create `lib/utils` in a subsequent step. For now I will import it, expecting to create it.

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", ...props }, ref) => {
        const variants = {
            primary: "bg-cyan-500 text-white hover:bg-cyan-600 dark:hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]",
            outline: "border border-slate-200 dark:border-cyan-500/50 text-slate-700 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-cyan-500/10",
            ghost: "text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/50",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center",
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
