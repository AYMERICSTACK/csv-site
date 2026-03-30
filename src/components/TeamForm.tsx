"use client";

import Link from "next/link";

type Group = {
  id: string;
  title: string;
};

type Schedule = {
  day: string;
  time: string;
};

type TeamFormProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void;
  groups: Group[];
  defaultValues?: {
    id?: string;
    category?: string;
    coach?: string;
    groupId?: string;
    sortOrder?: number;
    isPublished?: boolean;
    schedules?: Schedule[];
  };
};

function schedulesToTextarea(schedules?: Schedule[]) {
  if (!schedules) return "";
  return schedules.map((s) => `${s.day}|${s.time}`).join("\n");
}

export default function TeamForm({
  mode,
  action,
  groups,
  defaultValues,
}: TeamFormProps) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-neutral-900">
        {mode === "create" ? "Créer une équipe" : "Modifier l’équipe"}
      </h2>

      <form action={action} className="mt-6 space-y-5">
        {mode === "edit" && (
          <input type="hidden" name="id" value={defaultValues?.id} />
        )}

        {/* Catégorie */}
        <div>
          <label className="label">Catégorie</label>
          <input
            name="category"
            required
            defaultValue={defaultValues?.category || ""}
            className="input"
          />
        </div>

        {/* Coach */}
        <div>
          <label className="label">Responsable</label>
          <input
            name="coach"
            required
            defaultValue={defaultValues?.coach || ""}
            className="input"
          />
        </div>

        {/* Groupe */}
        <div>
          <label className="label">Groupe</label>
          <select
            name="groupId"
            defaultValue={defaultValues?.groupId || groups[0]?.id}
            className="input"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        {/* Ordre */}
        <div>
          <label className="label">Ordre</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={defaultValues?.sortOrder ?? 0}
            className="input"
          />
        </div>

        {/* Visibilité */}
        <div>
          <label className="label">Visibilité</label>
          <select
            name="isPublished"
            defaultValue={defaultValues?.isPublished ? "true" : "false"}
            className="input"
          >
            <option value="true">Publié</option>
            <option value="false">Masqué</option>
          </select>
        </div>

        {/* Créneaux */}
        <div>
          <label className="label">Créneaux</label>
          <textarea
            name="schedules"
            rows={5}
            defaultValue={schedulesToTextarea(defaultValues?.schedules)}
            className="input"
            placeholder={`Mercredi 16h00 – 17h00\nVendredi 17h30 – 19h00`}
          />
          <p className="text-xs text-neutral-500 mt-2">
            Une ligne = un créneau
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button className="btn-primary">
            {mode === "create" ? "Créer" : "Enregistrer"}
          </button>

          <Link href="/espace-educateurs/equipes" className="btn-secondary">
            Retour
          </Link>
        </div>
      </form>
    </div>
  );
}
