"use client";
import { useState } from "react";
import Link from "next/link";


type Row = { team: string; opponent: string; status: "finished" | "postponed"; scoreTeam: number | null; scoreOpponent: number | null; matchId: string; candidates: { id: string; label: string }[]; warning?: string; selected: boolean; createNew?: boolean; newDate?: string; newTime?: string; newIsHome?: boolean };
export default function MatchResultsImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState("2026-11-14");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  function update(i: number, patch: Partial<Row>) { setRows(old => old.map((r, n) => n === i ? { ...r, ...patch } : r)); }
  async function call(body: object) {
    const response = await fetch("/api/admin/result-import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
    return data;
  }
  async function analyze() {
    if (!file) return;
    setBusy(true); setError(""); setMessage(""); setRows([]);
    try {
      if (file.size > 30_000_000) throw new Error("PDF trop volumineux (maximum 30 Mo).");
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const positioned: { text: string; x: number; y: number; page: number }[] = [];
      for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 8); pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        for (const item of content.items) {
          if ("str" in item && item.str.trim() && "transform" in item) {
            positioned.push({ text: item.str, x: item.transform[4], y: item.transform[5], page: pageNumber });
          }
        }
      }
      if (!positioned.length) throw new Error("Aucun texte sélectionnable. Exporte le document depuis Canva en PDF standard.");
      const data = await call({ action: "analyze", positioned, startDate: date });
      setRows(data.rows);
      if (!data.rows.length) setError("Aucun résultat reconnu. Vérifie l'export PDF Canva.");
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur de lecture."); }
    finally { setBusy(false); }
  }
  async function save() {
    const selected = rows.filter(r => r.selected);
    if (!selected.length) return;
    if (!window.confirm(`Enregistrer ${selected.length} résultat(s) sur le site ? Vérifie bien les scores et le week-end.`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const data = await call({ action: "save", startDate: date, rows: selected.map(({ team, opponent, matchId, createNew, newDate, newTime, newIsHome, status, scoreTeam, scoreOpponent }) => ({ team, opponent, matchId, createNew, newDate, newTime, newIsHome, status, scoreTeam, scoreOpponent })) });
      setMessage(`${data.count} résultat(s) enregistré(s). Tu peux compléter les buteurs et passeurs depuis les fiches matchs ci-dessous.`);
      setRows(old => old.map(r => r.selected ? { ...r, selected: false } : r));
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur d'enregistrement."); }
    finally { setBusy(false); }
  }
  return <div className="mt-6 space-y-5">
    <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">1. Importer ton PDF Canva</h2>
      <p className="mt-2 text-sm text-neutral-600">Choisis le vrai week-end, même si la date sur le visuel est incorrecte. Aucun résultat n'est publié automatiquement.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm font-bold">Début du week-end<input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block rounded-xl border border-neutral-300 p-3" /></label><input type="file" accept=".pdf,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="max-w-full rounded-xl border border-neutral-300 p-3 text-sm"/><button type="button" disabled={!file || busy} onClick={analyze} className="rounded-xl bg-orange-600 px-5 py-3 font-black text-white disabled:opacity-40">{busy ? "Analyse..." : "Analyser les résultats"}</button></div>
    </section>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800">{message}</p>}
    {rows.length > 0 && <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-black">2. Vérifier les correspondances et les scores</h2><p className="mt-2 text-sm text-neutral-600">Les matchs déjà terminés ne sont pas écrasés. Une correspondance ambiguë doit être choisie manuellement.</p><div className="mt-5 space-y-4">{rows.map((r, i) => <div key={`${r.team}-${i}`} className="rounded-2xl border border-neutral-200 p-4"><div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 font-black"><input type="checkbox" checked={r.selected} disabled={!r.matchId && !r.createNew} onChange={e => update(i, { selected: e.target.checked })}/>{r.team}</label><span className="text-sm text-neutral-600">contre {r.opponent || "adversaire à confirmer"}</span>{r.warning && <span className="text-xs font-semibold text-amber-700">⚠ {r.warning}</span>}</div><div className="mt-3 flex flex-wrap items-end gap-3"><label className="text-xs font-bold">Match du calendrier<select value={r.matchId} disabled={r.createNew} onChange={e => update(i, { matchId: e.target.value, selected: false })} className="mt-1 block max-w-full rounded-xl border p-2 text-sm"><option value="">Choisir le match...</option>{r.candidates.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label className="text-xs font-bold">Statut<select value={r.status} onChange={e => update(i, { status: e.target.value as Row["status"] })} className="mt-1 block rounded-xl border p-2 text-sm"><option value="finished">Terminé</option><option value="postponed">Reporté</option></select></label>{r.status === "finished" && <><label className="text-xs font-bold">Buts CSV<input type="number" min="0" max="99" value={r.scoreTeam ?? ""} onChange={e => update(i, { scoreTeam: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1 block w-20 rounded-xl border p-2 text-sm"/></label><label className="text-xs font-bold">Buts adversaire<input type="number" min="0" max="99" value={r.scoreOpponent ?? ""} onChange={e => update(i, { scoreOpponent: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1 block w-20 rounded-xl border p-2 text-sm"/></label></>}{!r.matchId && <label className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900"><input type="checkbox" checked={Boolean(r.createNew)} onChange={e => update(i, { createNew: e.target.checked, selected: false, newDate: r.newDate || date, newTime: r.newTime || "15:00", newIsHome: r.newIsHome ?? false })}/> Créer ce match</label>}{r.createNew && <div className="flex w-full flex-wrap items-end gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3"><label className="text-xs font-bold">Date<input type="date" value={r.newDate || date} onChange={e => update(i, { newDate: e.target.value })} className="mt-1 block rounded-lg border p-2"/></label><label className="text-xs font-bold">Heure<input type="time" value={r.newTime || "15:00"} onChange={e => update(i, { newTime: e.target.value })} className="mt-1 block rounded-lg border p-2"/></label><label className="text-xs font-bold">Lieu<select value={r.newIsHome ? "home" : "away"} onChange={e => update(i, { newIsHome: e.target.value === "home" })} className="mt-1 block rounded-lg border p-2"><option value="away">Extérieur</option><option value="home">Domicile</option></select></label><p className="w-full text-xs text-orange-900">Vérifie la date, l’heure et le lieu avant de cocher le résultat. Le stade pourra être précisé ensuite sur la fiche du match.</p></div>}{r.matchId && <Link href={`/admin/matchs/${r.matchId}/resultat`} className="text-xs font-bold text-orange-700 underline">Buteurs / passeurs ↗</Link>}</div></div>)}</div><button disabled={busy || !rows.some(r => r.selected)} onClick={save} className="mt-5 rounded-xl bg-neutral-950 px-6 py-3 font-black text-white disabled:opacity-40">3. Valider les résultats sélectionnés ({rows.filter(r => r.selected).length})</button></section>}
  </div>;
}
