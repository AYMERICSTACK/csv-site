"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, LoaderCircle } from "lucide-react";
import { useToast } from "./ToastProvider";

type FormSubmitButtonProps = {
  idleLabel: string;
  pendingLabel?: string;
  successLabel?: string;
  loadingTitle?: string;
  loadingDescription?: string;
  successTitle?: string;
  className?: string;
  icon?: React.ReactNode;
  successDuration?: number;
};

export default function FormSubmitButton({
  idleLabel,
  pendingLabel = "Enregistrement en cours…",
  successLabel = "Enregistré ✓",
  loadingTitle = "Enregistrement en cours",
  loadingDescription,
  successTitle = "Enregistrement validé",
  className,
  icon,
  successDuration = 1800,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const toast = useToast();
  const previousPendingRef = useRef(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (pending && !previousPendingRef.current) {
      setSaved(false);
      toast.brand(loadingTitle, loadingDescription);
    }

    if (!pending && previousPendingRef.current) {
      setSaved(true);
      toast.success(successTitle);
      timer = setTimeout(() => setSaved(false), successDuration);
    }

    previousPendingRef.current = pending;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loadingDescription, loadingTitle, pending, successDuration, successTitle, toast]);

  const label = pending ? pendingLabel : saved ? successLabel : idleLabel;

  return (
    <button type="submit" disabled={pending} className={className} aria-live="polite">
      <span className="inline-flex items-center justify-center gap-2">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : saved ? <Check className="h-4 w-4" aria-hidden="true" /> : icon}
        {label}
      </span>
    </button>
  );
}
