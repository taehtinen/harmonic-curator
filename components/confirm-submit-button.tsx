"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { useFormStatus } from "react-dom";

export default function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
  disabled,
  title,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  disabled?: boolean;
  title?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (isDisabled) return;
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  };

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={isDisabled}
      title={title}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
