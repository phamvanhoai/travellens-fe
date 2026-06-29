import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "dark";
  href?: string;
  children: ReactNode;
};

const styles = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-white text-ink hover:bg-brand-50",
  ghost: "bg-transparent text-ink hover:bg-slate-100",
  outline: "border border-slate-200 bg-white text-ink hover:border-brand-500 hover:text-brand-600",
  dark: "bg-ink text-white hover:bg-slate-800"
};

export function Button({ className, variant = "primary", href, children, ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    styles[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
