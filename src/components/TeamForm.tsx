"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Trash2, Plus, CalendarDays } from "lucide-react";

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

const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export default function TeamForm({
  mode,
  action,
  groups,
  defaultValues,
}: TeamFormProps) {
  const [slots, setSlots] = useState<Schedule[]>(() => {
    if (!defaultValues?.schedules?.length) {
      return [{ day: "Mercredi", time: "" }];
    }

    return defaultValues.schedules;
  });

  function addSlot() {
    setSlots((prev) => [...prev, { day: "Mercredi", time: "" }]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ day: "Mercredi", time: "" }];
    });
  }

  function updateSlot(index: number, field: "day" | "time", value: string) {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    );
  }

  const serializedSchedules = useMemo(() => {
    return slots
      .filter((slot) => slot.day.trim() && slot.time.trim())
      .map((slot) => `${slot.day.trim()}|${slot.time.trim()}`)
      .join("\n");
  }, [slots]);

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-7">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
          <CalendarDays size={20} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-neutral-900">
            {mode === "create" ? "Créer une équipe" : "Modifier l’équipe"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {mode === "create"
              ? "Renseigne les informations principales et ajoute les créneaux d’entraînement."
              : "Mets à jour les informations de l’équipe et ajuste ses créneaux facilement."}
          </p>
        </div>
      </div>

      <form action={action} className="mt-7 space-y-5">
        {mode === "edit" && (
          <input type="hidden" name="id" value={defaultValues?.id} />
        )}

        <input type="hidden" name="schedules" value={serializedSchedules} />

        <div>
          <label className="label">Catégorie</label>
          <input
            name="category"
            required
            defaultValue={defaultValues?.category || ""}
            className="input"
            placeholder="Ex : U17"
          />
        </div>

        <div>
          <label className="label">Responsable</label>
          <input
            name="coach"
            required
            defaultValue={defaultValues?.coach || ""}
            className="input"
            placeholder="Ex : Jean Dupont"
          />
        </div>

        <div>
          <label className="label">Groupe</label>
          <select
            name="groupId"
            defaultValue={defaultValues?.groupId || groups[0]?.id || ""}
            className="input"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Ordre</label>
          <input
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={defaultValues?.sortOrder ?? 0}
            className="input"
          />
        </div>

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

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="label mb-0">Créneaux</label>
            <span className="text-xs text-neutral-400">
              {slots.length} {slots.length > 1 ? "créneaux" : "créneau"}
            </span>
          </div>

          <div className="space-y-3">
            {slots.map((slot, index) => (
              <div
                key={index}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="w-full md:w-48">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Jour
                    </label>
                    <select
                      value={slot.day}
                      onChange={(e) => updateSlot(index, "day", e.target.value)}
                      className="input bg-white"
                    >
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-0 flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Horaire
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : 16h00 – 17h00"
                      value={slot.time}
                      onChange={(e) =>
                        updateSlot(index, "time", e.target.value)
                      }
                      className="input bg-white"
                    />
                  </div>

                  <div className="md:pt-7">
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                      aria-label={`Supprimer le créneau ${index + 1}`}
                      title="Supprimer ce créneau"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSlot}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:border-csv-orange hover:text-csv-orange"
          >
            <Plus size={16} />
            Ajouter un créneau
          </button>

          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
            Chaque créneau est converti automatiquement au format attendu par le
            backend. Tu peux ajouter autant de lignes que nécessaire.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="btn-primary">
            {mode === "create"
              ? "Créer l’équipe"
              : "Enregistrer les modifications"}
          </button>

          <Link href="/espace-educateurs/equipes" className="btn-secondary">
            Retour
          </Link>
        </div>
      </form>
    </div>
  );
}
