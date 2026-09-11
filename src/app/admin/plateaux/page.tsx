import { requireRole } from "@/lib/auth-guard";
import Container from "@/components/Container";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Plus, CalendarDays, MapPin, Users } from "lucide-react";

async function deletePlateau(formData: FormData) {
  "use server";
  await requireRole(["admin", "educateurs"]);
  const id = String(formData.get("id") || "").trim();
  if (!id) return;
  await prisma.plateau.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/calendrier");
  revalidatePath("/admin/plateaux");
}

function fmt(value: Date) {
  return value.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}

export default async function AdminPlateauxPage() {
  await requireRole(["admin", "educateurs"]);
  const plateaux = await prisma.plateau.findMany({
    orderBy: { eventDate: "desc" },
    include: { team: { select: { category: true } }, participants: { orderBy: { sortOrder: "asc" } }, games: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <Container>
      <div className="pb-24 pt-6 md:py-14">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/matchs" className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-black"><ArrowLeft size={16}/> Gestion des matchs</Link>
          <Link href="/espace-educateurs" className="inline-flex items-center gap-2 rounded-full border border-neutral-900 bg-neutral-950 px-4 py-2 text-sm font-black text-white">Tableau de bord sportif</Link>
        </div>

        <section className="mt-5 flex flex-col gap-5 rounded-[2rem] bg-neutral-950 p-6 text-white md:flex-row md:items-center md:justify-between md:p-9">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">École de foot</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">Plateaux U7 · U9 · U11</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">Un plateau regroupe plusieurs clubs. En U11, il peut aussi contenir plusieurs rencontres avec leurs scores.</p>
          </div>
          <Link href="/admin/plateaux/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white"><Plus size={18}/> Ajouter un plateau</Link>
        </section>

        {plateaux.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-6 text-sm text-neutral-700">Aucun plateau enregistré pour le moment.</div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plateaux.map((plateau) => (
              <article key={plateau.id} className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-black uppercase text-orange-700">{plateau.team.category}</div>
                    <h2 className="mt-3 text-xl font-black">{plateau.title || `Plateau ${plateau.team.category}`}</h2>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-600">{plateau.format === "matches" ? "Rencontres" : "Rassemblement"}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-neutral-600">
                  <div className="flex items-center gap-2"><CalendarDays size={15} className="text-orange-500"/>{fmt(plateau.eventDate)}</div>
                  <div className="flex items-center gap-2"><MapPin size={15} className="text-orange-500"/>{plateau.location}</div>
                  <div className="flex items-center gap-2"><Users size={15} className="text-orange-500"/>{plateau.participants.length} club(s) · {plateau.games.length} rencontre(s)</div>
                </div>
                <div className="mt-5 flex gap-2">
                  <Link href={`/admin/plateaux/${plateau.id}/edit`} className="flex-1 rounded-xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white">Gérer</Link>
                  <form action={deletePlateau}>
                    <input type="hidden" name="id" value={plateau.id}/>
                    <button className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">Supprimer</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
