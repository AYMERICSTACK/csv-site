import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Container from "@/components/Container";
import FffResultsDiagnostic from "./FffResultsDiagnostic";

export default async function FffResultsDiagnosticPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, isActive: true },
  });
  if (!user?.isActive || user.role !== "admin") redirect("/espace-club");
  return (
    <Container>
      <div className="py-10">
        <Link href="/admin/classements-fff" className="text-sm font-bold text-neutral-600">
          ← Retour aux classements
        </Link>
        <h1 className="mt-5 text-3xl font-black">Test des résultats FFF</h1>
        <FffResultsDiagnostic />
      </div>
    </Container>
  );
}
