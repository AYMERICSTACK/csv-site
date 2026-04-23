"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
  initialName: string;
  initialDescription: string | null;
  initialEmail: string | null;
  initialPhone: string | null;
  initialShowMembers: boolean;
  initialShowEmail: boolean;
  initialShowPhone: boolean;
};

export default function EditCommissionForm({
  slug,
  initialName,
  initialDescription,
  initialEmail,
  initialPhone,
  initialShowMembers,
  initialShowEmail,
  initialShowPhone,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [showMembers, setShowMembers] = useState(initialShowMembers);
  const [showEmail, setShowEmail] = useState(initialShowEmail);
  const [showPhone, setShowPhone] = useState(initialShowPhone);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/commissions/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          email,
          phone,
          showMembers,
          showEmail,
          showPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Impossible de mettre à jour la commission.");
        return;
      }

      setSuccess("Commission mise à jour avec succès.");

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Une erreur est survenue.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Nom de la commission
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Email de contact
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Téléphone de contact
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <label className="flex items-center gap-3 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={showMembers}
            onChange={(e) => setShowMembers(e.target.checked)}
            disabled={isPending}
          />
          Afficher les membres de la commission
        </label>

        <label className="flex items-center gap-3 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={showEmail}
            onChange={(e) => setShowEmail(e.target.checked)}
            disabled={isPending}
          />
          Afficher l’email de contact
        </label>

        <label className="flex items-center gap-3 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={showPhone}
            onChange={(e) => setShowPhone(e.target.checked)}
            disabled={isPending}
          />
          Afficher les numéros de téléphone
        </label>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}

      {success ? (
        <p className="text-sm font-medium text-green-600">{success}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
      >
        {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
