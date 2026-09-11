"use client";

import { useState } from "react";
import { MATCH_TEAMS, SCHOOL_FOOT_TEAMS } from "@/lib/teams";
import { Upload, CheckCircle2, AlertTriangle, Loader2, Users } from "lucide-react";

type MatchRow = {
  sourceIndex: number;
  category: string;
  team: string;
  opponent: string;
  matchDate: string;
  location: string;
  isHome: boolean;
  competitionKey: string;
  competitionLabel: string;
  confidence: string;
  warning?: string;
  existingMatch: null | { id: string; matchDate: string };
  selected?: boolean;
  state?: "idle" | "creating" | "created" | "error";
  error?: string;
};

type PlateauRow = {
  sourceIndex: number;
  team: string;
  eventDate: string;
  location: string;
  format: "festival" | "matches";
  participants: string[];
  opponents: string[];
  title: string;
  confidence: string;
  warning?: string;
  existingPlateau: null | { id: string; eventDate: string };
  selected?: boolean;
  state?: "idle" | "creating" | "created" | "error";
  error?: string;
};

function categoryFor(team: string) {
  if (team.startsWith("Seniors")) return "Seniors";
  if (team.startsWith("U15")) return "U15";
  if (team.startsWith("U13")) return "U13";
  return team;
}

async function readJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || `Réponse serveur invalide (${res.status}).`);
  }
}

export default function MatchProgramImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [matchRows, setMatchRows] = useState<MatchRow[]>([]);
  const [plateauRows, setPlateauRows] = useState<PlateauRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    setMatchRows([]);
    setPlateauRows([]);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/match-import/analyze", { method: "POST", body: fd });
      const data = await readJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Analyse impossible.");
      setMatchRows((data.matches || []).map((row: MatchRow) => ({ ...row, selected: !row.existingMatch, state: "idle" })));
      setPlateauRows((data.plateaux || []).map((row: PlateauRow) => ({ ...row, selected: !row.existingPlateau, state: "idle" })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse impossible.");
    } finally {
      setLoading(false);
    }
  }

  function patchMatch(index: number, changes: Partial<MatchRow>) {
    setMatchRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));
  }

  function patchPlateau(index: number, changes: Partial<PlateauRow>) {
    setPlateauRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));
  }

  async function createSelected() {
    for (let index = 0; index < matchRows.length; index += 1) {
      const row = matchRows[index];
      if (!row.selected || row.existingMatch || row.state === "created") continue;
      patchMatch(index, { state: "creating", error: "" });
      try {
        const res = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: row.category || categoryFor(row.team),
            team: row.team,
            opponent: row.opponent,
            matchDate: row.matchDate,
            location: row.location,
            isHome: row.isHome,
            status: "scheduled",
            competitionKey: row.competitionKey,
            scoreTeam: null,
            scoreOpponent: null,
            scorers: null,
          }),
        });
        const data = await readJsonResponse(res);
        if (!res.ok) throw new Error(data.error || "Création impossible.");
        patchMatch(index, { state: "created", selected: false });
      } catch (err) {
        patchMatch(index, { state: "error", error: err instanceof Error ? err.message : "Erreur" });
      }
    }

    for (let index = 0; index < plateauRows.length; index += 1) {
      const row = plateauRows[index];
      if (!row.selected || row.existingPlateau || row.state === "created") continue;
      patchPlateau(index, { state: "creating", error: "" });
      try {
        const res = await fetch("/api/admin/plateau-import/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team: row.team,
            eventDate: row.eventDate,
            location: row.location,
            format: row.format,
            title: row.title,
            participants: row.participants,
            opponents: row.opponents,
          }),
        });
        const data = await readJsonResponse(res);
        if (!res.ok) throw new Error(data.error || "Création du plateau impossible.");
        patchPlateau(index, { state: "created", selected: false });
      } catch (err) {
        patchPlateau(index, { state: "error", error: err instanceof Error ? err.message : "Erreur" });
      }
    }
  }

  const existingMatches = matchRows.filter((row) => row.existingMatch).length;
  const missingMatches = matchRows.filter((row) => !row.existingMatch && row.state !== "created").length;
  const existingPlateaux = plateauRows.filter((row) => row.existingPlateau).length;
  const missingPlateaux = plateauRows.filter((row) => !row.existingPlateau && row.state !== "created").length;
  const canCreate =
    matchRows.some((row) => row.selected && !row.existingMatch && row.state !== "created") ||
    plateauRows.some((row) => row.selected && !row.existingPlateau && row.state !== "created");

  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-xl font-black">1. Déposer le PDF</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Le PDF peut contenir des matchs classiques et des plateaux U7/U9/U11. Rien n’est créé sans ta validation.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} className="input flex-1" />
          <button onClick={analyze} disabled={!file || loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-black text-white disabled:opacity-40">
            {loading ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />} Analyser le programme
          </button>
        </div>
        {error ? <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
      </section>

      {matchRows.length || plateauRows.length ? (
        <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">2. Vérifier le programme</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {matchRows.length ? `${matchRows.length} match(s) · ${existingMatches} déjà présent(s) · ${missingMatches} manquant(s)` : "Aucun match classique"}
                {plateauRows.length ? ` · ${plateauRows.length} plateau(x) · ${existingPlateaux} déjà présent(s) · ${missingPlateaux} manquant(s)` : ""}
              </p>
            </div>
            <button onClick={createSelected} disabled={!canCreate} className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white disabled:opacity-40">
              Créer les éléments sélectionnés
            </button>
          </div>

          {plateauRows.length ? (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <Users size={18} className="text-orange-500" />
                <h3 className="text-lg font-black">Plateaux école de foot</h3>
              </div>
              <div className="space-y-4">
                {plateauRows.map((row, index) => (
                  <div key={`plateau-${row.sourceIndex}`} className={`rounded-2xl border p-4 ${row.existingPlateau || row.state === "created" ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50/40"}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 h-5 w-5" checked={Boolean(row.selected)} disabled={Boolean(row.existingPlateau) || row.state === "created"} onChange={(event) => patchPlateau(index, { selected: event.target.checked })} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2 text-xs font-black">
                          {row.existingPlateau ? <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">PLATEAU DÉJÀ PRÉSENT</span> : row.state === "created" ? <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">PLATEAU CRÉÉ</span> : <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">PLATEAU À CRÉER</span>}
                          {row.warning ? <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle size={13} />{row.warning}</span> : null}
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          <label className="text-xs font-bold text-neutral-500">Équipe
                            <select className="input mt-1" value={row.team} disabled={Boolean(row.existingPlateau) || row.state === "created"} onChange={(event) => patchPlateau(index, { team: event.target.value })}>
                              {SCHOOL_FOOT_TEAMS.map((team) => <option key={team}>{team}</option>)}
                            </select>
                          </label>
                          <label className="text-xs font-bold text-neutral-500">Date / heure
                            <input type="datetime-local" className="input mt-1" value={row.eventDate} disabled={Boolean(row.existingPlateau) || row.state === "created"} onChange={(event) => patchPlateau(index, { eventDate: event.target.value })} />
                          </label>
                          <label className="text-xs font-bold text-neutral-500">Lieu
                            <input className="input mt-1" value={row.location} disabled={Boolean(row.existingPlateau) || row.state === "created"} onChange={(event) => patchPlateau(index, { location: event.target.value })} />
                          </label>
                          <label className="text-xs font-bold text-neutral-500 md:col-span-2 lg:col-span-3">Titre
                            <input className="input mt-1" value={row.title} disabled={Boolean(row.existingPlateau) || row.state === "created"} onChange={(event) => patchPlateau(index, { title: event.target.value })} />
                          </label>
                          {row.format === "matches" ? (
                            <label className="text-xs font-bold text-neutral-500 md:col-span-2 lg:col-span-3">Rencontres U11 <span className="font-normal">(un adversaire par ligne)</span>
                              <textarea rows={3} className="input mt-1 min-h-24" value={row.opponents.join("\n")} disabled={Boolean(row.existingPlateau) || row.state === "created"} onChange={(event) => patchPlateau(index, { opponents: event.target.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) })} />
                            </label>
                          ) : (
                            <label className="text-xs font-bold text-neutral-500 md:col-span-2 lg:col-span-3">Clubs participants <span className="font-normal">(un par ligne)</span>
                              <textarea rows={3} className="input mt-1 min-h-24" value={row.participants.join("\n")} disabled={Boolean(row.existingPlateau) || row.state === "created"} onChange={(event) => patchPlateau(index, { participants: event.target.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) })} />
                            </label>
                          )}
                        </div>

                        {row.existingPlateau ? <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-green-700"><CheckCircle2 size={16} /> Plateau déjà enregistré : aucune action nécessaire.</p> : null}
                        {row.state === "creating" ? <p className="mt-3 text-sm font-bold text-orange-600">Création…</p> : null}
                        {row.state === "error" ? <p className="mt-3 text-sm font-bold text-red-600">{row.error}</p> : null}
                        {row.state === "created" ? <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-green-700"><CheckCircle2 size={16} /> Plateau ajouté.</p> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {matchRows.length ? (
            <div className="mt-7">
              <h3 className="mb-3 text-lg font-black">Matchs classiques</h3>
              <div className="space-y-4">
                {matchRows.map((row, index) => (
                  <div key={`match-${row.sourceIndex}`} className={`rounded-2xl border p-4 ${row.existingMatch || row.state === "created" ? "border-green-200 bg-green-50" : "border-neutral-200"}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 h-5 w-5" checked={Boolean(row.selected)} disabled={Boolean(row.existingMatch) || row.state === "created"} onChange={(event) => patchMatch(index, { selected: event.target.checked })} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2 text-xs font-black">
                          {row.existingMatch ? <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">DÉJÀ PRÉSENT</span> : row.state === "created" ? <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">CRÉÉ</span> : <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-800">À CRÉER</span>}
                          {row.warning ? <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle size={13} />{row.warning}</span> : null}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          <label className="text-xs font-bold text-neutral-500">Équipe
                            <select className="input mt-1" value={row.team} disabled={Boolean(row.existingMatch) || row.state === "created"} onChange={(event) => patchMatch(index, { team: event.target.value, category: categoryFor(event.target.value) })}>
                              {!row.team ? <option value="">À choisir</option> : null}
                              {MATCH_TEAMS.map((team) => <option key={team}>{team}</option>)}
                            </select>
                          </label>
                          <label className="text-xs font-bold text-neutral-500">Adversaire
                            <input className="input mt-1" value={row.opponent} disabled={Boolean(row.existingMatch) || row.state === "created"} onChange={(event) => patchMatch(index, { opponent: event.target.value })} />
                          </label>
                          <label className="text-xs font-bold text-neutral-500">Date / heure
                            <input type="datetime-local" className="input mt-1" value={row.matchDate} disabled={Boolean(row.existingMatch) || row.state === "created"} onChange={(event) => patchMatch(index, { matchDate: event.target.value })} />
                          </label>
                          <label className="text-xs font-bold text-neutral-500">Lieu
                            <input className="input mt-1" value={row.location} disabled={Boolean(row.existingMatch) || row.state === "created"} onChange={(event) => patchMatch(index, { location: event.target.value })} />
                          </label>
                          <label className="text-xs font-bold text-neutral-500">Terrain
                            <select className="input mt-1" value={String(row.isHome)} disabled={Boolean(row.existingMatch) || row.state === "created"} onChange={(event) => { const isHome = event.target.value === "true"; patchMatch(index, { isHome, location: row.location === "À confirmer" || row.location === "Stade BRICHON" ? (isHome ? "Stade BRICHON" : "À confirmer") : row.location }); }}>
                              <option value="true">Domicile</option><option value="false">Extérieur</option>
                            </select>
                          </label>
                          <label className="text-xs font-bold text-neutral-500">Compétition
                            <select className="input mt-1" value={row.competitionKey} disabled={Boolean(row.existingMatch) || row.state === "created"} onChange={(event) => patchMatch(index, { competitionKey: event.target.value })}>
                              <option value="championship">Championnat</option><option value="coupe-france">Coupe de France</option><option value="coupe-laurafoot">Coupe LAuRAFoot</option><option value="coupe-ain">Coupe de l&apos;Ain</option><option value="coupe-rene-morandas">Coupe René Morandas</option><option value="coupe-peggy-provost">Coupe Peggy Provost</option><option value="coupe-gambardella">Coupe Gambardella</option><option value="friendly">Match amical</option><option value="other">Autre</option>
                            </select>
                          </label>
                        </div>
                        {row.existingMatch ? <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-green-700"><CheckCircle2 size={16} /> Match déjà enregistré : aucune action nécessaire.</p> : null}
                        {row.state === "creating" ? <p className="mt-3 text-sm font-bold text-orange-600">Création…</p> : null}
                        {row.state === "error" ? <p className="mt-3 text-sm font-bold text-red-600">{row.error}</p> : null}
                        {row.state === "created" ? <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-green-700"><CheckCircle2 size={16} /> Match ajouté.</p> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
