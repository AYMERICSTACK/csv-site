import Image from "next/image";

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
    <div className="grid gap-8">
      {sections.map((sec) => (
        <section
          key={sec.title}
          className="relative rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm"
        >
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-3xl bg-csv-orange" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900">
                {sec.title}
              </h2>
              {sec.note && (
                <p className="mt-2 text-sm text-neutral-600">{sec.note}</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sec.people.map((p) => (
              <div
                key={`${sec.title}-${p.role}-${p.name}`}
                className="rounded-2xl border border-neutral-200 p-5"
              >
                <div className="flex items-center gap-3">
                  {p.photo ? (
                    <Image
                      src={p.photo}
                      alt={`${p.name} — ${p.role}`}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full border border-neutral-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-sm font-extrabold text-neutral-700">
                      {initials(p.name)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-neutral-500">
                      {p.role}
                    </div>
                    <div className="truncate text-sm font-extrabold text-neutral-900">
                      {p.name}
                    </div>
                  </div>
                </div>

                {(p.email || p.phone) && (
                  <div className="mt-4 space-y-1 text-sm text-neutral-700">
                    {p.email && (
                      <div>
                        <span className="text-neutral-500">Email :</span>{" "}
                        <a className="underline" href={`mailto:${p.email}`}>
                          {p.email}
                        </a>
                      </div>
                    )}
                    {p.phone && (
                      <div>
                        <span className="text-neutral-500">Tél :</span>{" "}
                        <a
                          className="underline"
                          href={`tel:${p.phone.replace(/\s+/g, "")}`}
                        >
                          {p.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
