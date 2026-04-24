"use client";

import { useState } from "react";

type Props = {
  name: string;
  defaultValue?: string | null;
};

export default function RegistrationDocumentUpload({
  name,
  defaultValue,
}: Props) {
  const [url, setUrl] = useState(defaultValue || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/registrations/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Impossible d’envoyer le fichier.");
      }

      setUrl(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l’envoi du fichier.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={url} />

      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-900">
          Fichier PDF
        </label>

        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleUpload}
          disabled={uploading}
          className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {uploading ? (
        <p className="text-sm font-medium text-orange-700">
          Envoi du PDF en cours...
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {url ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          PDF envoyé avec succès.{" "}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            Voir le document
          </a>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          Aucun PDF envoyé pour le moment.
        </p>
      )}
    </div>
  );
}
