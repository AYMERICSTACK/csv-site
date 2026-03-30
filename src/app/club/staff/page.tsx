import Container from "@/components/Container";
import OrgChart from "@/components/OrgChart";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export default async function StaffPage() {
  const session = await auth();

  const isAdmin = session?.user?.role === "admin";
  const isLogged = !!session;

  const staffMembers = await prisma.staffMember.findMany({
    include: {
      user: true,
    },
    orderBy: {
      sectionTitle: "asc",
    },
  });

  const sectionsMap = new Map();

  for (const member of staffMembers) {
    if (!sectionsMap.has(member.sectionTitle)) {
      sectionsMap.set(member.sectionTitle, {
        title: member.sectionTitle,
        people: [],
      });
    }

    const user = member.user;

    const canSeeEmail = isAdmin || (isLogged && user?.showEmailToMembers);
    const canSeePhone = isAdmin || (isLogged && user?.showPhoneToMembers);

    sectionsMap.get(member.sectionTitle).people.push({
      name: member.name,
      role: member.roleLabel,
      email: canSeeEmail ? member.email : null,
      phone: canSeePhone ? member.phone : null,
      photo: null,
    });
  }

  const sections = Array.from(sectionsMap.values());

  return (
    <Container>
      <div className="py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/35 to-white px-6 py-8 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.18)] md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.14),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.06),transparent_28%)]" />
          <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-csv-orange/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
              Staff & organigramme
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
              Staff & organigramme
            </h1>

            <p className="mt-3 max-w-2xl leading-relaxed text-neutral-700">
              Retrouvez l’organisation du club : bureau, référents et
              responsables par catégories.
            </p>
          </div>
        </section>

        <div className="mt-10">
          <div className="rounded-[1.75rem] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">
              Contact officiel
            </div>

            <div className="mt-4 text-sm font-extrabold text-neutral-900">
              Contact officiel du club
            </div>

            <div className="mt-2 text-sm leading-relaxed text-neutral-700">
              Pour toute demande, merci de passer par l’adresse officielle :
            </div>

            <div className="mt-3 text-sm font-semibold">
              <a
                className="underline decoration-orange-300 underline-offset-2"
                href="mailto:csviriat-football@orange.fr"
              >
                csviriat-football@orange.fr
              </a>
            </div>
          </div>

          <div className="mt-8">
            <OrgChart sections={sections} />
          </div>
        </div>
      </div>
    </Container>
  );
}
