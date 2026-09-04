import { requireRole } from "@/lib/auth-guard";
import Container from "@/components/Container";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MatchProgramImporter from "@/components/MatchProgramImporter";

export default async function ImportMatchProgramPage() {
  await requireRole(["admin", "educateurs"]);
  return <Container><div className="pb-20 pt-6 md:py-14">
    <Link href="/admin/matchs" className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-black"><ArrowLeft size={16}/> Retour aux matchs</Link>
    <section className="mt-5 rounded-[2rem] bg-neutral-950 px-5 py-7 text-white md:px-8 md:py-10">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Contrôle du week-end</p>
      <h1 className="mt-2 text-3xl font-black md:text-5xl">Importer le programme réseaux</h1>
      <p className="mt-3 max-w-3xl text-sm text-white/70 md:text-base">Dépose le PDF utilisé pour les réseaux. Le site détecte les rencontres, les compare à la base et te laisse valider uniquement les matchs manquants.</p>
    </section>
    <MatchProgramImporter />
  </div></Container>;
}
