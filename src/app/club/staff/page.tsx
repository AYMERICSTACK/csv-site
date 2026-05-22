import Container from "@/components/Container";
import OrgChart from "@/components/OrgChart";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const sectionOrder = [
  "Bureau",
  "Responsables par catégories",
  "Référents",
  "Technique / Pôle sportif",
];

const sectionWeight = (title: string) => {
  const index = sectionOrder.indexOf(title);
  return index === -1 ? 999 : index;
};

export default async function StaffPage() {
  const session = await auth();

  const isAdmin = session?.user?.role === "admin";
  const isLogged = !!session;

  const staffMembers = await prisma.staffMember.findMany({
    where: {
      isPublished: true,
    },
    include: {
      user: true,
    },
    orderBy: [{ sectionTitle: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const sectionsMap = new Map<
    string,
    {
      title: string;
      people: {
        name: string;
        role: string;
        email: string | null;
        phone: string | null;
        photo: string | null;
      }[];
    }
  >();

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

    sectionsMap.get(member.sectionTitle)?.people.push({
      name: member.name,
      role: member.roleLabel,
      email: canSeeEmail ? member.email : null,
      phone: canSeePhone ? member.phone : null,
      photo: member.photo,
    });
  }

  const sections = Array.from(sectionsMap.values()).sort(
    (a, b) => sectionWeight(a.title) - sectionWeight(b.title),
  );

  return (
    <Container>
      <main className="py-8 md:py-12">
        <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_18px_60px_-45px_rgba(0,0,0,0.45)]">
          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-orange-50/70 to-transparent md:block" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
              <div>
                <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500">
                  <span>Accueil</span>
                  <span className="text-neutral-300">/</span>
                  <span>Le club</span>
                  <span className="text-neutral-300">/</span>
                  <span className="text-neutral-900">Staff & organigramme</span>
                </nav>

                <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.18em] text-orange-600">
                  Organisation du club
                </p>

                <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-neutral-950 md:text-5xl">
                  Staff & organigramme
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-600 md:text-lg">
                  Découvrez les membres du bureau, les responsables, les
                  référents et les encadrants qui font vivre le CS Viriat au
                  quotidien.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            {sections.length > 0 ? (
              <OrgChart sections={sections} />
            ) : (
              <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
                <h2 className="text-xl font-black text-neutral-950">
                  Organigramme en cours de préparation
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Les membres du staff seront affichés ici prochainement.
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-[0_18px_55px_-42px_rgba(0,0,0,0.38)]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-lg font-black text-orange-600">
                  @
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-600">
                    Contact officiel
                  </p>
                  <h2 className="mt-1 text-lg font-black text-neutral-950">
                    Une question pour le club ?
                  </h2>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-neutral-600">
                Pour toute demande générale, merci de passer par l’adresse
                officielle du CS Viriat.
              </p>

              <a
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                href="mailto:csviriat-football@orange.fr"
              >
                csviriat-football@orange.fr
              </a>
            </div>
          </aside>
        </div>
      </main>
    </Container>
  );
}
