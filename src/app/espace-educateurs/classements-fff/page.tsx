import Link from "next/link";
import { redirect } from "next/navigation";
import Container from "@/components/Container";
import { getRankingAccess } from "@/lib/fff-ranking-access";
import FffRankingSyncClient from "@/app/admin/classements-fff/FffRankingSyncClient";

export default async function EducatorRankingsPage() {
  const access = await getRankingAccess();
  if (!access) redirect("/espace-club");
  return (
    <Container>
      <div className="py-10 sm:py-14">
        <Link href="/espace-educateurs" className="text-sm font-bold text-neutral-600">
          ← Retour à mon espace éducateur
        </Link>
        <section className="mt-5 rounded-[2rem] bg-neutral-950 p-6 text-white sm:p-8">
          <h1 className="text-3xl font-black">Classement de mon équipe</h1>
          <p className="mt-3 text-sm text-neutral-300">
            Actualise le classement officiel depuis ton navigateur. Seules les équipes qui te sont attribuées sont accessibles.
          </p>
        </section>
        <div className="mt-6"><FffRankingSyncClient /></div>
      </div>
    </Container>
  );
}
