import { requireRole } from "@/lib/auth-guard";
import Container from "@/components/Container";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseParisDateTime } from "@/lib/paris-datetime";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

function splitLines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toLocalInput(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(" ", "T");
}

async function updatePlateau(id: string, formData: FormData) {
  "use server";
  await requireRole(["admin", "educateurs"]);

  const title = String(formData.get("title") || "").trim();
  const rawEventDate = String(formData.get("eventDate") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const status = String(formData.get("status") || "scheduled").trim();
  const notes = String(formData.get("notes") || "").trim();
  const participants = splitLines(formData.get("participants"));
  const newOpponents = splitLines(formData.get("newOpponents"));

  if (!rawEventDate || !location) throw new Error("Date et lieu sont obligatoires.");
  if (!["scheduled", "finished", "postponed", "cancelled"].includes(status)) throw new Error("Statut invalide.");

  const existing = await prisma.plateau.findUnique({ where: { id }, include: { games: true } });
  if (!existing) redirect("/admin/plateaux");

  const eventDate = parseParisDateTime(rawEventDate);

  await prisma.$transaction(async (tx) => {
    await tx.plateau.update({
      where: { id },
      data: { title: title || null, eventDate, location, status, notes: notes || null },
    });

    await tx.plateauParticipant.deleteMany({ where: { plateauId: id } });
    if (participants.length) {
      await tx.plateauParticipant.createMany({
        data: participants.map((name, index) => ({ plateauId: id, name, sortOrder: index })),
      });
    }

    for (const game of existing.games) {
      const opponent = String(formData.get(`opponent_${game.id}`) || game.opponent).trim();
      const scoreTeamRaw = String(formData.get(`scoreTeam_${game.id}`) || "").trim();
      const scoreOpponentRaw = String(formData.get(`scoreOpponent_${game.id}`) || "").trim();
      await tx.plateauGame.update({
        where: { id: game.id },
        data: {
          opponent,
          scoreTeam: scoreTeamRaw === "" ? null : Number(scoreTeamRaw),
          scoreOpponent: scoreOpponentRaw === "" ? null : Number(scoreOpponentRaw),
        },
      });
    }

    if (newOpponents.length) {
      const startOrder = existing.games.length;
      await tx.plateauGame.createMany({
        data: newOpponents.map((opponent, index) => ({ plateauId: id, opponent, scheduledAt: eventDate, sortOrder: startOrder + index })),
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/calendrier");
  revalidatePath("/admin/plateaux");
  revalidatePath(`/admin/plateaux/${id}/edit`);
  redirect("/admin/plateaux");
}

export default async function EditPlateauPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "educateurs"]);
  const { id } = await params;
  const plateau = await prisma.plateau.findUnique({
    where: { id },
    include: { team: { select: { category: true } }, participants: { orderBy: { sortOrder: "asc" } }, games: { orderBy: { sortOrder: "asc" } } },
  });
  if (!plateau) redirect("/admin/plateaux");

  const updateAction = updatePlateau.bind(null, id);

  return (
    <Container>
      <div className="pb-24 pt-6 md:py-14">
        <Link href="/admin/plateaux" className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-black"><ArrowLeft size={16}/> Retour aux plateaux</Link>

        <section className="mt-5 rounded-[2rem] bg-neutral-950 p-6 text-white md:p-9">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">{plateau.team.category}</p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">Gérer le plateau</h1>
          <p className="mt-3 text-sm text-white/70">Modifie l’organisation et, pour les U11, saisis les scores des petites rencontres.</p>
        </section>

        <form action={updateAction} className="mt-6 space-y-5">
          <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold">Titre
                <input name="title" defaultValue={plateau.title || ""} className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"/>
              </label>
              <label className="text-sm font-bold">Statut
                <select name="status" defaultValue={plateau.status} className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3">
                  <option value="scheduled">Programmé</option>
                  <option value="finished">Terminé</option>
                  <option value="postponed">Reporté</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </label>
              <label className="text-sm font-bold">Date / heure
                <input type="datetime-local" name="eventDate" required defaultValue={toLocalInput(plateau.eventDate)} className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"/>
              </label>
              <label className="text-sm font-bold">Lieu
                <input name="location" required defaultValue={plateau.location} className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"/>
              </label>
              <label className="text-sm font-bold md:col-span-2">Clubs participants <span className="font-normal text-neutral-500">(un par ligne)</span>
                <textarea name="participants" rows={5} defaultValue={plateau.participants.map((p) => p.name).join("\n")} className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"/>
              </label>
              <label className="text-sm font-bold md:col-span-2">Notes
                <textarea name="notes" rows={3} defaultValue={plateau.notes || ""} className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3"/>
              </label>
            </div>
          </section>

          {plateau.format === "matches" ? (
            <section className="rounded-[1.75rem] border border-orange-200 bg-orange-50/60 p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-black">Rencontres U11</h2>
              <p className="mt-1 text-sm text-neutral-600">Un plateau peut contenir plusieurs matchs. Les scores sont facultatifs.</p>
              <div className="mt-5 space-y-3">
                {plateau.games.map((game, index) => (
                  <div key={game.id} className="grid gap-3 rounded-2xl border border-orange-200 bg-white p-4 md:grid-cols-[1fr_110px_110px]">
                    <label className="text-sm font-bold">Adversaire {index + 1}
                      <input name={`opponent_${game.id}`} defaultValue={game.opponent} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5"/>
                    </label>
                    <label className="text-sm font-bold">CSV
                      <input type="number" min="0" name={`scoreTeam_${game.id}`} defaultValue={game.scoreTeam ?? ""} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5"/>
                    </label>
                    <label className="text-sm font-bold">Adversaire
                      <input type="number" min="0" name={`scoreOpponent_${game.id}`} defaultValue={game.scoreOpponent ?? ""} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5"/>
                    </label>
                  </div>
                ))}
                <label className="block text-sm font-bold">Ajouter d’autres adversaires <span className="font-normal text-neutral-500">(un par ligne)</span>
                  <textarea name="newOpponents" rows={3} className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-4 py-3"/>
                </label>
              </div>
            </section>
          ) : null}

          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white md:w-auto"><Save size={18}/> Enregistrer</button>
        </form>
      </div>
    </Container>
  );
}
