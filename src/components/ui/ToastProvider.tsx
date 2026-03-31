"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Flame,
  Trash2,
} from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "brand" | "danger";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ShowToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  showToast: (input: ShowToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  brand: (title: string, description?: string) => void;
  danger: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastStyles(variant: ToastVariant = "success") {
  switch (variant) {
    case "success":
      return {
        icon: <CheckCircle2 size={18} className="text-green-400" />,
        cardClass:
          "border-green-500/20 bg-neutral-950 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]",
        accentClass:
          "bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.12),transparent_35%)]",
      };

    case "danger":
      return {
        icon: <Trash2 size={18} className="text-red-400" />,
        cardClass:
          "border-red-500/20 bg-neutral-950 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]",
        accentClass:
          "bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.20),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.10),transparent_35%)]",
      };

    case "brand":
      return {
        icon: <Flame size={18} className="text-orange-400" />,
        cardClass:
          "border-orange-500/20 bg-neutral-950 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]",
        accentClass:
          "bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_35%)]",
      };

    case "error":
      return {
        icon: <AlertCircle size={18} className="text-red-400" />,
        cardClass:
          "border-red-500/20 bg-neutral-950 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]",
        accentClass:
          "bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.10),transparent_35%)]",
      };

    case "info":
    default:
      return {
        icon: <Info size={18} className="text-blue-400" />,
        cardClass:
          "border-blue-500/20 bg-neutral-950 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]",
        accentClass:
          "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.10),transparent_35%)]",
      };
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      title,
      description,
      variant = "success",
      duration = 3500,
    }: ShowToastInput) => {
      const id = idRef.current++;
      const nextToast: ToastItem = {
        id,
        title,
        description,
        variant,
      };

      setToasts((current) => [...current, nextToast]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (title, description) =>
        showToast({ title, description, variant: "success" }),
      error: (title, description) =>
        showToast({ title, description, variant: "error" }),
      info: (title, description) =>
        showToast({ title, description, variant: "info" }),
      brand: (title, description) =>
        showToast({ title, description, variant: "brand" }),
      danger: (title, description) =>
        showToast({ title, description, variant: "danger" }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-20 z-[200] flex w-full max-w-sm flex-col gap-3 sm:right-6">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.variant);

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative overflow-hidden rounded-[1.5rem] border p-4 ${styles.cardClass}`}
            >
              <div className={`absolute inset-0 ${styles.accentClass}`} />

              <div className="relative flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                  {styles.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold tracking-tight text-white">
                    {toast.title}
                  </p>

                  {toast.description ? (
                    <p className="mt-1 text-sm leading-relaxed text-white/70">
                      {toast.description}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Fermer la notification"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
