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

  // 🔥 regroupement par section
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
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900">
          Staff & organigramme
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-700 leading-relaxed">
          Retrouvez l’organisation du club : bureau, référents et responsables
          par catégories.
        </p>

        <div className="mt-10">
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="text-sm font-extrabold text-neutral-900">
              Contact officiel du club
            </div>
            <div className="mt-2 text-sm text-neutral-700">
              Pour toute demande, merci de passer par l’adresse officielle :
            </div>
            <div className="mt-3 text-sm font-semibold">
              <a
                className="underline"
                href="mailto:csviriat-football@orange.fr"
              >
                csviriat-football@orange.fr
              </a>
            </div>
          </div>

          <OrgChart sections={sections} />
        </div>
      </div>
    </Container>
  );
}
