import Link from "next/link";
import type { ComponentProps } from "react";

type CtaLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function CtaLink({ className = "", variant = "primary", children, ...props }: CtaLinkProps) {
  const variants = {
    primary:
      "bg-pulse text-obsidian shadow-glow hover:bg-frost focus-visible:outline-pulse",
    secondary:
      "border border-white/15 bg-white/10 text-white hover:border-pulse/60 hover:bg-pulse/10 focus-visible:outline-pulse",
    ghost:
      "text-slate-200 hover:text-white focus-visible:outline-pulse",
  };

  return (
    <Link
      className={`cta-sweep group inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-full px-5 py-3 text-center text-sm font-semibold transition sm:w-auto ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2 break-words">{children}</span>
    </Link>
  );
}
