import React from "react"
import clsx from "clsx"

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function IconButton({ className, ...props }: IconButtonProps) {
  const base = "rounded-full bg-neutral-800/70 hover:bg-neutral-800 p-2 border border-neutral-700/70 inline-flex items-center justify-center"
  return <button className={clsx(base, className)} {...props} />
}

