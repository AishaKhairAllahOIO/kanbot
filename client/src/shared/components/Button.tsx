import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-active",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-sunken active:bg-sunken",
  ghost: "text-muted hover:bg-sunken hover:text-ink active:bg-sunken",
  danger: "bg-danger text-surface hover:opacity-90 active:opacity-80",
  link: "text-brand-ink underline-offset-4 hover:underline active:text-brand",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-small",
  md: "min-h-9 px-4 text-small",
  lg: "min-h-10 px-5 text-body",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  leadingIcon,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-fast disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        leadingIcon
      )}
      {children}
    </button>
  );
}
