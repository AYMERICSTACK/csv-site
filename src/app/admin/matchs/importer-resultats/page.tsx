import { requireRole } from "@/lib/auth-guard";
import Container from "@/components/Container";
import Link from "next/link";
import MatchResultsImporter from "@/components/MatchResultsImporter";
export default async function ImportResultsPage() {
  await requireRole(["admin", "educateurs"]);
  return <Container><div className="pb-20 pt-6 md:py-14"><Link href="/admin/matchs" className="text-sm font-bold text-orange-700">← Retour aux matchs</Link><section className="mt-5 rounded-3xl bg-neutral-950 px-6 py-9 text-white"><p className="text-xs font-black uppercase tracking-widest text-orange-300">V19.30 · Résultats du week-end</p><h1 className="mt-2 text-3xl font-black">Importer les résultats depuis Canva</h1><p className="mt-3 text-sm text-white/70">Import PDF, vérification des matchs et des scores, puis validation. Buteurs et passeurs facultatifs depuis les fiches matchs.</p></section><MatchResultsImporter/></div></Container>;
}
