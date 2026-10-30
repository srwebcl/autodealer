import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "whatsapp";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-red text-white hover:bg-brand-red-hover",
  outline: "border border-white/25 text-chalk hover:border-white/60 hover:bg-white/5",
  ghost: "text-chalk hover:text-brand-yellow",
  whatsapp: "bg-[#1f9d55] text-white hover:bg-[#178246]",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[0.95rem]",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-sm font-semibold uppercase tracking-[0.08em]",
    "transition-colors duration-200 select-none",
    variants[variant],
    sizes[size],
    extra,
  ].join(" ");
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

/** Enlace con aspecto de botón. Para URLs externas añade target y rel. */
export function ButtonLink({ variant, size, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
