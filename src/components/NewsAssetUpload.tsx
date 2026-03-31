"use client";

import { useRef, useState } from "react";
import {
  FileUp,
  Loader2,
  Link as LinkIcon,
  CheckCircle2,
  X,
} from "lucide-react";

type NewsAssetUploadProps = {
  label: string;
  name: string;
  defaultValue?: string;
  accept?: string;
  helpText?: string;
  placeholder?: string;
};

export default function NewsAssetUpload({
  label,
  name,
  defaultValue = "",
  accept,
  helpText,
  placeholder,
}: NewsAssetUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    setIsUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/news/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Upload impossible.");
      }

      setValue(data.url);
      setMessage("Fichier envoyé avec succès.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Impossible d’envoyer le fichier.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function clearValue() {
    setValue("");
    setMessage("");
    setError("");
  }

  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>

      {/* INPUT PRINCIPAL — SOURCE UNIQUE */}
      <input
        id={name}
        name={name}
        type="text"
        className="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />

      {/* UPLOAD */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="mt-3 block w-full text-sm text-neutral-700 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:font-semibold file:text-orange-700 hover:file:bg-orange-100"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleUpload(file);
          }
        }}
      />

      {helpText ? (
        <p className="mt-2 text-xs text-neutral-500">{helpText}</p>
      ) : null}

      {/* STATUS */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {isUploading && (
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
            <Loader2 size={14} className="animate-spin" />
            Upload en cours...
          </div>
        )}

        {!isUploading && message && (
          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            <CheckCircle2 size={14} />
            {message}
          </div>
        )}

        {error && (
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {value && (
          <>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <LinkIcon size={14} />
              Ouvrir
            </a>

            <button
              type="button"
              onClick={clearValue}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <X size={14} />
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
