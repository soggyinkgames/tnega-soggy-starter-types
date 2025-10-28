import React from "react"
import clsx from "clsx"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary"
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold px-5 py-3 transition active:scale-[0.98]"
  const styles =
    variant === "primary"
      ? "bg-brand-600 hover:bg-brand-500 text-white shadow-lg"
      : "bg-neutral-800/80 hover:bg-neutral-800 text-neutral-100 border border-neutral-700"
  return <button className={clsx(base, styles, className)} {...props} />
}

