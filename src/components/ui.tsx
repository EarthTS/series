import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition-[transform,box-shadow,opacity] active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100";
  const styles = {
    primary:
      "bg-gradient-to-br from-[#5a9fe8] via-[#6eb5ff] to-[#8ecfff] text-[#061018] shadow-[0_8px_28px_var(--accent-glow)] hover:shadow-[0_10px_36px_var(--accent-glow)] hover:brightness-[1.03]",
    secondary:
      "border border-[var(--border-strong)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted-hover)]",
    ghost: "text-[var(--foreground-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
    danger:
      "bg-red-500/90 text-white shadow-[0_6px_20px_rgba(248,113,113,0.35)] hover:bg-red-500",
  };
  return (
    <button type={type} className={cn(base, styles[variant], className)} {...props} />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-3.5 text-sm text-[var(--foreground)] outline-none backdrop-blur-sm transition-colors placeholder:text-[var(--foreground-muted)] focus:border-[var(--accent)]/50 focus:bg-[var(--muted-hover)] focus:ring-2 focus:ring-[var(--accent)]/25",
        props.className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-medium tracking-wide text-[var(--foreground-muted)]",
        className
      )}
      {...props}
    />
  );
}
