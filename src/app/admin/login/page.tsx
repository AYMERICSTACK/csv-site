import Container from "@/components/Container";
import Badge from "@/components/Badge";
import LoginForm from "./LoginForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getHomePathByRole } from "@/lib/roles";
import Link from "next/link";

export default async function AdminLoginPage() {
  const session = await auth();

  if (session) {
    redirect(getHomePathByRole(session.user?.role));
  }

  return (
    <Container>
      <div className="py-20">
        <div className="mx-auto max-w-md">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Admin</Badge>
            <Badge>Connexion</Badge>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900">
            Connexion à l’administration
          </h1>

          <p className="mt-3 text-base leading-relaxed text-neutral-700">
            Accède à l’espace de gestion du CS Viriat.
          </p>

          <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <LoginForm />

            {/* 👉 INSCRIPTION */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500">
                Pas encore de compte interne ?
              </p>

              <Link
                href="/inscription-interne"
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
              >
                Créer un accès au club
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
