"use client";

import type { MouseEventHandler, ReactNode } from "react";

export default function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  "aria-label"?: string;
}) {
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  };

  return (
    <button
      type="submit"
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
