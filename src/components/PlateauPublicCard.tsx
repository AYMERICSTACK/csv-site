import { CalendarDays, MapPin, Users, Trophy } from "lucide-react";

export type PlateauPublicItem = {
  id: string;
  team: string;
  eventDate: string;
  location: string;
  format: string;
  status: string;
  title: string | null;
  participants: string[];
  games: Array<{
    id: string;
    opponent: string;
    scoreTeam: number | null;
    scoreOpponent: number | null;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function statusLabel(status: string) {
  if (status === "finished") return "Terminé";
  if (status === "cancelled") return "Annulé";
  if (status === "postponed") return "Reporté";
  return "Programmé";
}

export default function PlateauPublicCard({ plateau }: { plateau: PlateauPublicItem }) {
  const isU11 = plateau.format === "matches" || plateau.games.length > 0;
  const visibleClubs = plateau.participants.slice(0, 4);

  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-orange-200 bg-orange-50/50 p-4 text-neutral-900 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-orange-400">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-700">{plateau.team}</span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800">Plateau</span>
            </div>
            <h3 className="mt-2 text-base font-extrabold leading-tight sm:text-lg">
              {plateau.title || (isU11 ? `Plateau ${plateau.team}` : `Rassemblement ${plateau.team}`)}
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800">{statusLabel(plateau.status)}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-neutral-700"><CalendarDays size={14} className="text-orange-500" />{formatDate(plateau.eventDate)}</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-neutral-700"><MapPin size={14} className="text-orange-500" />{plateau.location}</span>
        </div>

        {isU11 && plateau.games.length > 0 ? (
          <div className="mt-4 space-y-2 rounded-[1.05rem] border border-orange-200 bg-neutral-950 p-3 text-white">
            {plateau.games.slice(0, 4).map((game) => (
              <div key={game.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
                <span className="font-extrabold">CSV {plateau.team}</span>
                <span className="text-orange-300">vs</span>
                <span className="text-right font-extrabold">{game.opponent}</span>
                {game.scoreTeam !== null && game.scoreOpponent !== null ? (
                  <span className="rounded-lg bg-orange-500 px-2 py-1 font-black">{game.scoreTeam}-{game.scoreOpponent}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : visibleClubs.length > 0 ? (
          <div className="mt-4 rounded-[1.05rem] border border-orange-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-orange-700"><Users size={15} /> Clubs présents</div>
            <p className="mt-2 text-sm font-semibold text-neutral-700">
              {visibleClubs.join(" · ")}{plateau.participants.length > visibleClubs.length ? ` · +${plateau.participants.length - visibleClubs.length}` : ""}
            </p>
          </div>
        ) : (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700"><Trophy size={14} className="text-orange-500" /> Programme à préciser</div>
        )}
      </div>
    </article>
  );
}
