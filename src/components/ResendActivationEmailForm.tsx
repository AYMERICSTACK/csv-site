"use client";

import { useActionState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

export type ResendActivationEmailState = {
  status: "idle" | "success" | "error";
  message?: string;
};

type Props = {
  userId: string;
  action: (
    previousState: ResendActivationEmailState,
    formData: FormData,
  ) => Promise<ResendActivationEmailState>;
};

const initialState: ResendActivationEmailState = { status: "idle" };

export default function ResendActivationEmailForm({ userId, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const sent = state.status === "success" && !pending;

  return (
    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={pending}
          aria-live="polite"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition sm:w-auto ${
            sent
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400 hover:bg-neutral-100"
          } ${pending ? "cursor-wait opacity-70" : "cursor-pointer"}`}
        >
          {pending ? (
            <>
              <LoaderCircle size={14} className="animate-spin" />
              Envoi en cours…
            </>
          ) : sent ? (
            <>
              <CheckCircle2 size={14} />
              Email envoyé
            </>
          ) : (
            <>
              <Send size={14} />
              Renvoyer l’email
            </>
          )}
        </button>
      </form>

      {state.status === "error" && state.message ? (
        <p className="max-w-64 text-right text-xs font-medium text-red-600">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
