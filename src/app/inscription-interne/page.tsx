import Link from "next/link";
import { prisma } from "@/lib/prisma";
import InternalSignupForm from "@/components/InternalSignupForm";

export default async function InscriptionInternePage() {
  const commissions = await prisma.commission.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm">
          <div className="bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%),linear-gradient(135deg,#111_0%,#000_100%)] px-6 py-8 text-white md:px-8 md:py-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                CS Viriat
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Inscription interne
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Créer un accès commission
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
              Remplis ce formulaire pour demander un accès à une ou plusieurs
              commissions du club. Ton compte devra être validé par un
              administrateur avant activation.
            </p>
          </div>

          <div className="px-6 py-8 md:px-8">
            <InternalSignupForm commissions={commissions} />

            <div className="mt-6 text-sm text-neutral-500">
              Déjà un compte ?{" "}
              <Link
                href="/admin/login"
                className="font-semibold text-neutral-900 underline underline-offset-2"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
