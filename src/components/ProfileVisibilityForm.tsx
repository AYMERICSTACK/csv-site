"use client";

import { useState } from "react";

type Props = {
  showEmailToMembers: boolean;
  showPhoneToMembers: boolean;
  userEmail?: string | null;
  userPhone?: string | null;
};

export default function ProfileVisibilityForm({
  showEmailToMembers,
  showPhoneToMembers,
  userEmail,
  userPhone,
}: Props) {
  const [emailVisible, setEmailVisible] = useState(showEmailToMembers);
  const [phoneVisible, setPhoneVisible] = useState(showPhoneToMembers);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const hasChanged =
    emailVisible !== showEmailToMembers || phoneVisible !== showPhoneToMembers;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hasChanged) return;

    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          showEmailToMembers: emailVisible,
          showPhoneToMembers: phoneVisible,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de mettre à jour.");
      }

      setSuccess("Préférences enregistrées.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de l’enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-5">
      <div className="space-y-4">
        <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <input
            type="checkbox"
            checked={emailVisible}
            onChange={(e) => setEmailVisible(e.target.checked)}
            disabled={!userEmail}
            className="mt-1 h-4 w-4 rounded border-neutral-300"
          />

          <div>
            <div className="text-sm font-semibold text-neutral-900">
              Afficher mon email aux membres connectés
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              {userEmail
                ? `Email actuel : ${userEmail}`
                : "Aucun email renseigné sur mon compte."}
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <input
            type="checkbox"
            checked={phoneVisible}
            onChange={(e) => setPhoneVisible(e.target.checked)}
            disabled={!userPhone}
            className="mt-1 h-4 w-4 rounded border-neutral-300"
          />

          <div>
            <div className="text-sm font-semibold text-neutral-900">
              Afficher mon téléphone aux membres connectés
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              {userPhone
                ? `Téléphone actuel : ${userPhone}`
                : "Aucun téléphone renseigné sur mon compte."}
            </div>
          </div>
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving || !hasChanged}
        className="inline-flex items-center justify-center rounded-2xl bg-csv-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Enregistrement..." : "Enregistrer mes préférences"}
      </button>
    </form>
  );
}
