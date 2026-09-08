import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Container from "@/components/Container";
import FffRankingSyncClient from "./FffRankingSyncClient";

export default async function AdminClassementsFffPage() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "admin") {
    redirect("/");
  }

  return (
    <Container>
      <div className="py-10 sm:py-14">
        <Link
          href="/admin"
          className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50"
        >
          ← Retour à l’administration
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-neutral-950 px-5 py-7 text-white shadow-[0_24px_80px_-45px_rgba(0,0,0,0.75)] sm:px-8 sm:py-9">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
            Classements FFF
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Synchronisation des classements
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-300 sm:text-base">
            Mets à jour les snapshots Neon depuis ton navigateur lorsque les serveurs FFF bloquent les requêtes Vercel.
          </p>
        </section>

        <div className="mt-6">
          <FffRankingSyncClient />
        </div>
      </div>
    </Container>
  );
}
