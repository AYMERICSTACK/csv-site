import Image from "next/image";

const featuredSection = "Bureau";

type StaffPerson = {
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  photo?: string | null;
};

type StaffSection = {
  title: string;
  note?: string;
  people: StaffPerson[];
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function OrgChart({
  sections,
  showContacts = true,
}: {
  sections: StaffSection[];
  showContacts?: boolean;
}) {
  return (
    <div className="space-y-6">
      {sections.map((sec) => {
        const isFeatured = sec.title === featuredSection;

        return (
          <section
            key={sec.title}
            className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_60px_-48px_rgba(0,0,0,0.42)] md:p-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={
                    isFeatured
                      ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-lg font-black text-orange-600"
                      : "flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-50 text-lg font-black text-neutral-500"
                  }
                >
                  {isFeatured ? "⚑" : "•"}
                </div>

                <div>
                  <p
                    className={
                      isFeatured
                        ? "text-xs font-extrabold uppercase tracking-[0.16em] text-orange-600"
                        : "text-xs font-extrabold uppercase tracking-[0.16em] text-neutral-500"
                    }
                  >
                    {isFeatured ? "Direction du club" : "Section"}
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">
                    {sec.title}
                  </h2>

                  {sec.note && (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      {sec.note}
                    </p>
                  )}
                </div>
              </div>

              <div className="inline-flex w-fit rounded-full bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-600">
                {sec.people.length} membre{sec.people.length > 1 ? "s" : ""}
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {sec.people.map((p) => (
                <article
                  key={`${sec.title}-${p.role}-${p.name}`}
                  className="group rounded-[1.4rem] border border-neutral-200 bg-white p-5 text-center transition duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_22px_65px_-48px_rgba(0,0,0,0.5)]"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-orange-50 text-lg font-black text-orange-600 ring-1 ring-orange-100">
                    {p.photo ? (
                      <Image
                        src={p.photo}
                        alt={`${p.name} — ${p.role}`}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(p.name)
                    )}
                  </div>

                  <p className="mt-5 min-h-[32px] text-[11px] font-extrabold uppercase leading-4 tracking-[0.12em] text-neutral-500">
                    {p.role}
                  </p>

                  <h3 className="mt-2 text-base font-black leading-snug text-neutral-950">
                    {p.name}
                  </h3>

                  <div className="mx-auto mt-4 h-px w-8 bg-orange-300" />

                  {showContacts && (p.email || p.phone) && (
                    <div className="mt-4 space-y-2 rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-700">
                      {p.email && (
                        <a
                          className="block truncate font-semibold text-neutral-900 underline decoration-orange-300 underline-offset-2"
                          href={`mailto:${p.email}`}
                        >
                          {p.email}
                        </a>
                      )}

                      {p.phone && (
                        <a
                          className="block font-semibold text-neutral-900 underline decoration-orange-300 underline-offset-2"
                          href={`tel:${p.phone.replace(/\s+/g, "")}`}
                        >
                          {p.phone}
                        </a>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
