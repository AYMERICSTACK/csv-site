"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type PlayerPhotoInputProps = {
  name?: string;
  label?: string;
  compact?: boolean;
};

export default function PlayerPhotoInput({
  name = "photoFile",
  label = "Ajouter une photo",
  compact = false,
}: PlayerPhotoInputProps) {
  const [file, setFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-2">
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-orange-300 bg-orange-50 text-sm font-bold text-orange-700 transition hover:bg-orange-100 ${
          compact ? "px-4 py-3" : "px-5 py-4"
        }`}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-orange-600 shadow-sm">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Aperçu"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </span>

        <span className="min-w-0 flex-1 truncate">
          {file ? file.name : label}
        </span>

        <input
          ref={inputRef}
          name={name}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] || null;

            setFile(selectedFile);
          }}
        />
      </label>

      {file ? (
        <button
          type="button"
          onClick={() => {
            setFile(null);

            if (inputRef.current) {
              inputRef.current.value = "";
            }
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-red-600 transition hover:text-red-700"
        >
          <X className="h-3.5 w-3.5" />
          Retirer la photo sélectionnée
        </button>
      ) : (
        <p className="text-xs text-neutral-500">PNG, JPG ou WEBP</p>
      )}
    </div>
  );
}
