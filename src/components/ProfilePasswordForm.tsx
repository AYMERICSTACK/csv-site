"use client";

import { useState } from "react";

export default function ProfilePasswordForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  function handleCancel() {
    resetForm();
    setIsEditing(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setSuccess("");
    setError("");

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("Tous les champs sont obligatoires.");
      }

      if (newPassword.length < 8) {
        throw new Error(
          "Le nouveau mot de passe doit contenir au moins 8 caractères.",
        );
      }

      if (newPassword !== confirmPassword) {
        throw new Error(
          "Les deux nouveaux mots de passe ne correspondent pas.",
        );
      }

      const response = await fetch("/api/me/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Impossible de modifier le mot de passe.",
        );
      }

      resetForm();
      setIsEditing(false);
      setSuccess("Mot de passe modifié avec succès.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification du mot de passe.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {!isEditing ? (
        <>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              Mot de passe
            </div>
            <div className="mt-1 font-semibold text-neutral-900">********</div>
            <p className="mt-2 text-sm text-neutral-600">
              Modifie ton mot de passe de connexion à l’espace privé.
            </p>
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
            Modifier mon mot de passe
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-900">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-900">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Minimum 8 caractères.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-900">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
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
