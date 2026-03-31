"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

type DeleteNewsItemButtonProps = {
  id: string;
  title: string;
  action: (formData: FormData) => void | Promise<void>;
  onOptimisticDelete?: () => void;
  loadingTitle?: string;
  loadingDescription?: string;
  loadingVariant?: "success" | "error" | "info" | "brand" | "danger";
};

export default function DeleteNewsItemButton({
  id,
  title,
  action,
  onOptimisticDelete,
  loadingTitle = "Suppression en cours...",
  loadingDescription = "Le contenu est en train d’être supprimé.",
  loadingVariant = "danger",
}: DeleteNewsItemButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  function closeModal() {
    if (submitting) return;
    setOpen(false);
  }

  function onConfirmDelete() {
    if (!formRef.current || submitting) return;

    setSubmitting(true);

    toast.showToast({
      title: loadingTitle,
      description: loadingDescription,
      variant: loadingVariant,
      duration: 2200,
    });

    onOptimisticDelete?.();
    formRef.current.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={action}>
        <input type="hidden" name="id" value={id} />

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          <Trash2 size={15} />
          Supprimer
        </button>
      </form>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer la fenêtre"
            onClick={closeModal}
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[2px]"
          />

          <div className="relative z-[101] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-neutral-950 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_30%)]" />

            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                  <AlertTriangle size={22} />
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="mt-5 text-xl font-extrabold tracking-tight">
                Supprimer ce contenu ?
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-white/75">
                Tu es sur le point de supprimer définitivement :
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm font-semibold text-white">{title}</p>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/65">
                Cette action est irréversible. Le contenu sera retiré du système
                et ne sera plus visible dans l’espace communication ni sur la
                page actualités.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={onConfirmDelete}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={15} />
                  {submitting ? "Suppression..." : "Oui, supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
