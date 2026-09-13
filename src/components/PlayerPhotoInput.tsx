"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

type PlayerPhotoInputProps = {
  name?: string;
  label?: string;
  compact?: boolean;
};

const MAX_UPLOAD_SIZE = 3 * 1024 * 1024;
const MAX_SOURCE_SIZE = 20 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2048;
const SUPPORTED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export default function PlayerPhotoInput({
  name = "photoFile",
  label = "Ajouter une photo",
  compact = false,
}: PlayerPhotoInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    // Certains navigateurs / WebView Android peuvent échouer à créer un aperçu
    // à partir d'un fichier provenant d'un fournisseur de contenu. L'upload reste
    // possible : on évite donc qu'une erreur d'aperçu fasse planter toute la page.
    if (
      typeof URL === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      setPreviewUrl(null);
      setMessage("Aperçu indisponible sur ce navigateur. La photo peut tout de même être enregistrée.");
      return;
    }

    let objectUrl: string | null = null;

    try {
      objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } catch {
      setPreviewUrl(null);
      setMessage("Aperçu indisponible sur ce navigateur. La photo peut tout de même être enregistrée.");
    }

    return () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Rien à faire : le nettoyage de l'aperçu ne doit jamais casser la page.
        }
      }
    };
  }, [file]);

  function clearSelection() {
    setFile(null);
    setPreviewUrl(null);
    setMessage(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function compressPhoto(source: File) {
    const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      throw new Error("canvas-unavailable");
    }

    // Les photos de joueurs n'ont pas besoin de transparence. Un fond blanc évite
    // qu'un PNG transparent devienne noir lors de la conversion en JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let quality = 0.86;
    let blob: Blob | null = null;
    do {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      quality -= 0.08;
    } while (blob && blob.size > MAX_UPLOAD_SIZE && quality >= 0.5);

    if (!blob || blob.size > MAX_UPLOAD_SIZE) {
      throw new Error("compression-failed");
    }

    const baseName = source.name.replace(/\.[^.]+$/, "") || "photo-joueur";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null;
    setMessage(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type && !SUPPORTED_PHOTO_TYPES.has(selectedFile.type)) {
      setMessage("Format non pris en charge. Utilisez une photo JPG, PNG ou WEBP.");
      event.target.value = "";
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_SOURCE_SIZE) {
      setMessage("La photo d'origine est trop lourde (20 Mo maximum).");
      event.target.value = "";
      setFile(null);
      return;
    }

    // Même les photos déjà légères passent par cette étape : on réduit les très
    // grandes résolutions de téléphone et on garantit une requête largement sous
    // la limite du serveur.
    setMessage("Optimisation de la photo en cours…");

    try {
      const optimizedFile = await compressPhoto(selectedFile);
      const transfer = new DataTransfer();
      transfer.items.add(optimizedFile);
      event.target.files = transfer.files;
      setFile(optimizedFile);

      if (optimizedFile.size < selectedFile.size) {
        const originalMb = (selectedFile.size / 1024 / 1024).toFixed(1);
        const optimizedMb = (optimizedFile.size / 1024 / 1024).toFixed(1);
        setMessage(`Photo optimisée automatiquement : ${originalMb} Mo → ${optimizedMb} Mo.`);
      } else {
        setMessage(null);
      }
    } catch {
      event.target.value = "";
      setFile(null);
      setMessage("Impossible d'optimiser cette photo. Essayez une autre photo JPG, PNG ou WEBP.");
    }
  }

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
              onError={() => {
                setPreviewUrl(null);
                setMessage("L'aperçu n'est pas disponible, mais vous pouvez enregistrer la photo.");
              }}
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
          onChange={(event) => void handleFileChange(event)}
        />
      </label>

      {file ? (
        <button
          type="button"
          onClick={clearSelection}
          className="inline-flex items-center gap-1 text-xs font-bold text-red-600 transition hover:text-red-700"
        >
          <X className="h-3.5 w-3.5" />
          Retirer la photo sélectionnée
        </button>
      ) : (
        <p className="text-xs text-neutral-500">PNG, JPG ou WEBP · compression automatique avant envoi.</p>
      )}

      {message ? (
        <p role="status" className="text-xs font-semibold text-amber-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
