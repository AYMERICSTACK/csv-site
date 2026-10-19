"use client";

import { useEffect, useRef, useState } from "react";

type Props = { id: string; photoUrl: string; name: string };
export default function PlayerFaceCrop({ id, photoUrl, name }: Props) {
  const [open, setOpen] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(3);
  const [x, setX] = useState(50);
  const [y, setY] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => { imageRef.current = image; drawPreview(image); };
    image.src = photoUrl;
    function drawPreview(img: HTMLImageElement) {
      const canvas = previewRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, 800, 800);
      const base = Math.max(800 / img.naturalWidth, 800 / img.naturalHeight);
      const width = img.naturalWidth * base * zoom;
      const height = img.naturalHeight * base * zoom;
      ctx.drawImage(img, (800 - width) * x / 100, (800 - height) * y / 100, width, height);
    }
    return () => { image.onload = null; };
  }, [open, photoUrl, zoom, x, y]);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const image = imageRef.current;
      if (!image) throw new Error("Photo en cours de chargement");
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponible");
      const base = Math.max(800 / image.naturalWidth, 800 / image.naturalHeight);
      const width = image.naturalWidth * base * zoom;
      const height = image.naturalHeight * base * zoom;
      ctx.drawImage(image, (800 - width) * x / 100, (800 - height) * y / 100, width, height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Impossible de générer le portrait");
      const form = new FormData();
      form.append("id", id);
      form.append("portrait", blob, "portrait.jpg");
      const response = await fetch("/api/players/portrait-crop", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erreur d'enregistrement");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setBusy(false);
    }
  }

  return (
    <div className="mt-2" onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={() => setOpen(!open)} className="rounded-lg border border-orange-300 px-3 py-2 text-xs font-bold text-orange-700">
        {open ? "Fermer le recadrage" : "Recadrer le visage"}
      </button>
      {open && <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
        <p className="mb-3 text-sm font-semibold">Cadrage du visage de {name}</p>
        <div className="mx-auto h-48 w-48 overflow-hidden rounded-full border-4 border-orange-400 bg-neutral-200">
          <canvas ref={previewRef} width={800} height={800} aria-label={`Aperçu du visage de ${name}`} className="h-full w-full" />
        </div>
        <div className="mt-4 grid gap-3 text-xs font-semibold">
          <label>Zoom : {zoom.toFixed(1)}× <input className="w-full" type="range" min="1" max="8" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
          <label>Horizontal <input className="w-full" type="range" min="0" max="100" value={x} onChange={e => setX(Number(e.target.value))} /></label>
          <label>Vertical <input className="w-full" type="range" min="0" max="100" value={y} onChange={e => setY(Number(e.target.value))} /></label>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button type="button" disabled={busy} onClick={save} className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Enregistrement…" : "Enregistrer le portrait"}</button>
        <p className="mt-2 text-xs text-neutral-500">La photo originale est conservée.</p>
      </div>}
    </div>
  );
}
