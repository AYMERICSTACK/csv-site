"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "./ToastProvider";

type FormSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  loadingTitle: string;
  loadingDescription?: string;
  className?: string;
  icon?: React.ReactNode;
};

export default function FormSubmitButton({
  idleLabel,
  pendingLabel,
  loadingTitle,
  loadingDescription,
  className,
  icon,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const toast = useToast();
  const previousPendingRef = useRef(false);

  useEffect(() => {
    if (pending && !previousPendingRef.current) {
      toast.brand(loadingTitle, loadingDescription);
    }

    previousPendingRef.current = pending;
  }, [loadingDescription, loadingTitle, pending, toast]);

  return (
    <button type="submit" disabled={pending} className={className}>
      <span className="inline-flex items-center gap-2">
        {icon}
        {pending ? pendingLabel : idleLabel}
      </span>
    </button>
  );
}
