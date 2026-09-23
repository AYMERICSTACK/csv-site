"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Images, UploadCloud } from "lucide-react";

type PlayerOption = { id: string; firstName: string; lastName: string; team: string | null; photoUrl?: string | null; portraitUrl?: string | null };
type ImportRow = { file: File; expectedName: string; player: PlayerOption | null; enabled: boolean; status: string };

const PHOTO_MAP: Record<string, string> = {
  "IMG_20260919_150040.jpg": "Ansoumane Keita",
  "IMG_20260919_150100.jpg": "Noah Sigler",
  "IMG_20260919_150107.jpg": "Anthony Bernard",
  "IMG_20260919_150123.jpg": "Clément Brevet",
  "IMG_20260919_150138.jpg": "Antonin Chanel",
  "IMG_20260919_150149.jpg": "Elie Chevillard",
  "IMG_20260919_150154.jpg": "Enzo Prieto",
  "IMG_20260919_150159.jpg": "Lucas Perroud",
  "IMG_20260919_150208.jpg": "Médéric Rigaudier",
  "IMG_20260919_150327.jpg": "Kevin Goncalves",
  "IMG_20260919_150348.jpg": "Lenny Ramalingompoule",
  "IMG_20260919_150417.jpg": "Eric Bonnassieux",
  "IMG_20260919_150826.jpg": "Maxime Fieujean",
  "IMG_20260919_150834.jpg": "Eduardo Alberto",
  "IMG_20260919_150842.jpg": "Elias Mohamed",
  "IMG_20260919_150847.jpg": "Simon Desmurs",
  "IMG_20260919_150851 (1).jpg": "Victor Michon",
  "IMG_20260919_150851.jpg": "Victor Michon",
  "IMG_20260919_150856.jpg": "Tom Journet",
  "IMG_20260919_150902.jpg": "Arthur Perrot",
  "IMG_20260919_150911.jpg": "Théo Taponard",
  "IMG_20260919_150916.jpg": "Sacha Hernandez",
  "IMG_20260919_150940.jpg": "Adel Boubezaria",
  "IMG_20260919_150945.jpg": "Sergio Perez",
  "IMG_20260919_151222.jpg": "Yvann Lorin",
  "IMG_20260919_151305.jpg": "Aymeric Djeridi",
  "IMG_20260919_151312.jpg": "Enzo Collin",
  "IMG_20260919_151319.jpg": "Yanis Chagraoui",
  "IMG_20260919_151346_1.jpg": "Corentin Ponceblanc",
  "IMG_20260920_173112.jpg": "Mathis Froment",
};

const MAX_UPLOAD_SIZE = 3 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 3200;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function optimizePhoto(source: File): Promise<File> {
  if (source.size <= MAX_UPLOAD_SIZE) return source;
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("canvas"); }
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (let quality = 0.94; quality >= 0.74; quality -= 0.04) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_UPLOAD_SIZE) return new File([blob], source.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  }
  throw new Error("compression");
}

export default function BulkPlayerPhotoImport({ players }: { players: PlayerOption[] }) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState("");
  const [portraitRunning, setPortraitRunning] = useState(false);
  const [portraitSummary, setPortraitSummary] = useState("");
  const playerByName = useMemo(() => {
    const map = new Map<string, PlayerOption>();
    for (const player of players) {
      map.set(normalize(`${player.firstName}${player.lastName}`), player);
      map.set(normalize(`${player.lastName}${player.firstName}`), player);
    }
    return map;
  }, [players]);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    const next = files.map((file) => {
      const expectedName = PHOTO_MAP[file.name] || "Fichier non reconnu";
      const player = expectedName === "Fichier non reconnu" ? null : playerByName.get(normalize(expectedName)) || null;
      return { file, expectedName, player, enabled: Boolean(player) && file.name !== "IMG_20260919_150851 (1).jpg", status: player ? "Prêt" : "Joueur introuvable" };
    });
    setRows(next);
    setSummary(`${next.length} photo(s) sélectionnée(s) · ${next.filter((r) => r.player).length} correspondance(s) trouvée(s).`);
  }

  async function startImport() {
    setRunning(true);
    let success = 0;
    let errors = 0;
    const working = [...rows];
    for (let i = 0; i < working.length; i += 1) {
      const row = working[i];
      if (!row.enabled || !row.player) continue;
      working[i] = { ...row, status: "Optimisation…" }; setRows([...working]);
      try {
        const optimized = await optimizePhoto(row.file);
        working[i] = { ...working[i], status: "Envoi…" }; setRows([...working]);
        const body = new FormData(); body.set("file", optimized); body.set("playerId", row.player.id);
        const response = await fetch("/api/players/bulk-photo", { method: "POST", body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "upload");
        working[i] = { ...working[i], status: "✓ Importée" }; success += 1;
      } catch {
        working[i] = { ...working[i], status: "Erreur" }; errors += 1;
      }
      setRows([...working]);
    }
    setRunning(false);
    setSummary(`${success} photo(s) importée(s)${errors ? ` · ${errors} erreur(s)` : ""}.`);
  }


  async function generatePortraits() {
    const seen = new Set<string>();
    const targets = players.filter((player) => {
      if (!player.photoUrl) return false;
      const identity = normalize(`${player.firstName}${player.lastName}`);
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
    if (!targets.length) {
      setPortraitSummary("Aucun joueur avec photo source à traiter.");
      return;
    }

    setPortraitRunning(true);
    let success = 0;
    let errors = 0;

    for (const player of targets) {
      setPortraitSummary(`Génération des portraits HD… ${success + errors}/${targets.length}`);
      try {
        const response = await fetch("/api/players/portrait", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: player.id }),
        });
        if (!response.ok) throw new Error("portrait");
        success += 1;
      } catch {
        errors += 1;
      }
    }

    setPortraitRunning(false);
    setPortraitSummary(`${success} portrait(s) HD généré(s)${errors ? ` · ${errors} erreur(s)` : ""}. Rechargez la page Classements pour voir le nouveau rendu.`);
  }

  return <section className="mb-6 rounded-[2rem] border border-orange-200 bg-orange-50/40 p-5 md:p-6">
    <div className="flex items-start gap-3"><div className="rounded-2xl bg-orange-600 p-3 text-white"><Images className="h-5 w-5" /></div><div><h2 className="text-lg font-extrabold text-neutral-950">Import massif des photos joueurs</h2><p className="mt-1 text-sm text-neutral-600">Sélectionnez les photos originales du lot du 19/20 septembre. Les fichiers sont associés automatiquement aux joueurs avant l’envoi.</p></div></div>
    <div className="mt-4 rounded-2xl border border-orange-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="font-extrabold text-neutral-950">Portraits HD automatiques</div><p className="mt-1 text-xs text-neutral-500">Régénère les portraits carrés 800×800 depuis les photos sources déjà stockées, y compris ceux qui existent déjà. Le cadrage géométrique privilégie le visage et les épaules des photos plein pied.</p></div>
        <button type="button" disabled={portraitRunning} onClick={() => void generatePortraits()} className="shrink-0 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50">{portraitRunning ? "Génération…" : "Générer les portraits HD"}</button>
      </div>
      {portraitSummary ? <p className="mt-3 text-xs font-semibold text-emerald-700">{portraitSummary}</p> : null}
    </div>
    <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-orange-300 bg-white px-4 py-4 text-sm font-bold text-orange-700 hover:bg-orange-50"><UploadCloud className="h-5 w-5" />Choisir toutes les photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectFiles} disabled={running} /></label>
    {summary ? <p className="mt-3 text-sm font-semibold text-neutral-700">{summary}</p> : null}
    {rows.length ? <div className="mt-4 max-h-96 space-y-2 overflow-auto rounded-2xl bg-white p-3">{rows.map((row, index) => <label key={`${row.file.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3 text-sm"><input type="checkbox" checked={row.enabled} disabled={!row.player || running} onChange={(e) => setRows((current) => current.map((item, idx) => idx === index ? { ...item, enabled: e.target.checked } : item))} /><div className="min-w-0 flex-1"><div className="truncate font-bold text-neutral-900">{row.expectedName}</div><div className="truncate text-xs text-neutral-500">{row.file.name}{row.player?.team ? ` · ${row.player.team}` : ""}</div></div><span className={`shrink-0 text-xs font-bold ${row.status === "Erreur" || !row.player ? "text-red-600" : "text-emerald-700"}`}>{row.status}</span></label>)}</div> : null}
    {rows.some((r) => r.player) ? <><p className="mt-3 text-xs text-neutral-500">Victor Michon possède deux fichiers dans le lot : le doublon « (1) » est décoché par défaut. Vous pouvez choisir l’autre avant de lancer l’import.</p><button type="button" disabled={running || !rows.some((r) => r.enabled && r.player)} onClick={() => void startImport()} className="mt-4 rounded-xl bg-orange-600 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50">{running ? "Import en cours…" : "Importer les photos sélectionnées"}</button></> : null}
  </section>;
}
