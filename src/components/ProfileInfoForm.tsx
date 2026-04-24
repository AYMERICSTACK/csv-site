"use client";

import { useState } from "react";

type Props = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

export default function ProfileInfoForm({ name, email, phone }: Props) {
  const initialForm = {
    name: name || "",
    email: email || "",
    phone: phone || "",
  };

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const hasChanged =
    form.name !== initialForm.name ||
    form.email !== initialForm.email ||
    form.phone !== initialForm.phone;

  function handleCancel() {
    setForm(initialForm);
    setIsEditing(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!hasChanged) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de mettre à jour.");
      }

      setSuccess(
        "Informations mises à jour. Si tu as modifié ton email, reconnecte-toi.",
      );
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {!isEditing ? (
        <>
          <div className="grid gap-3 text-sm text-neutral-700 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                Nom
              </div>
              <div className="mt-1 font-semibold text-neutral-900">
                {form.name || "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                Email
              </div>
              <div className="mt-1 break-all font-semibold text-neutral-900">
                {form.email || "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                Téléphone
              </div>
              <div className="mt-1 font-semibold text-neutral-900">
                {form.phone || "—"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSuccess("");
              setError("");
              setIsEditing(true);
            }}
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
          >
            Modifier mes informations
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-900">
              Nom
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-900">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="votre@email.fr"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-900">
              Téléphone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="06 00 00 00 00"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

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
    </div>
  );
}
