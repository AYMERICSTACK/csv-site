"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, RefreshCw, Trophy } from "lucide-react";

type TeamState = "synced" | "pending_sync" | "incomplete" | "missing" | "postponed" | "cup" | "rest";
type Recap = {
  weekendKey: string;
  start: string;
  activeTeams: number;
  syncedTeams: number;
  allReady: boolean;
  sentAt: string | null;
  teams: Array<{ team: string; state: TeamState; dayNumber: number | null }>;
};

function stateLabel(state: TeamState) {
  switch (state) {
    case "synced": return "À jour";
    case "pending_sync": return "À synchroniser";
    case "incomplete": return "Résultats incomplets";
    case "missing": return "Contrôle à faire";
    case "postponed": return "Reporté / annulé";
    case "cup": return "Coupe";
    default: return "Repos";
  }
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date(value));
}

export default function AdminFffWeekendRecap() {
  const [recap, setRecap] = useState<Recap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/fff-weekend-recap", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Récapitulatif indisponible.");
      setRecap(payload as Recap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="mt-8 overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm">
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600">
              <Trophy size={16} /> Contrôle global FFF
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">Récap du week-end</h2>
            <p className="mt-2 text-sm text-neutral-600">Vue admin basée sur Neon et le calendrier du club. Aucune requête supplémentaire n’est envoyée à la FFF ici.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualiser le récap
          </button>
        </div>

        {loading && !recap && <div className="mt-5 rounded-2xl bg-neutral-50 p-5 text-sm font-bold text-neutral-500">Chargement du suivi…</div>}
        {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</div>}

        {recap && (
          <>
            <div className={`mt-5 rounded-2xl border p-5 ${recap.allReady ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
              <div className="flex items-start gap-3">
                {recap.allReady ? <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={22} /> : <Clock3 className="mt-0.5 shrink-0 text-orange-600" size={22} />}
                <div>
                  <div className={`text-lg font-black ${recap.allReady ? "text-green-900" : "text-orange-900"}`}>
                    {recap.allReady ? "Tous les classements du week-end sont à jour" : `${recap.syncedTeams}/${recap.activeTeams} classements de championnat à jour`}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-neutral-600">Week-end du {dateLabel(recap.start)}. Coupe, repos et matchs reportés ne bloquent pas le contrôle.</p>
                  {recap.sentAt && <p className="mt-2 text-sm font-bold text-green-800">Récapitulatif admin envoyé par mail.</p>}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recap.teams.map((team) => (
                <div key={team.team} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                  <span className="text-sm font-black text-neutral-900">{team.team}</span>
                  <span className={`text-xs font-bold ${team.state === "synced" ? "text-green-700" : team.state === "pending_sync" || team.state === "incomplete" || team.state === "missing" ? "text-orange-700" : "text-neutral-500"}`}>{stateLabel(team.state)}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/admin/classements-fff" className="inline-flex rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-neutral-800">Ouvrir les classements FFF →</Link>
              <Link href="/espace-educateurs" className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-black text-neutral-700 transition hover:bg-neutral-50">Ouvrir l’espace éducateurs</Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
