"use client";

import FormSubmitButton from "@/components/ui/FormSubmitButton";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Trash2, Plus, CalendarDays } from "lucide-react";
import { loosePersonIdentityKey } from "@/lib/person-select";

type Group = {
  id: string;
  title: string;
};

type Schedule = {
  day: string;
  time: string;
};

type StaffMember = {
  role: string;
  name: string;
};

type StaffDirectoryEntry = {
  name: string;
  label: string;
};

type EditableStaffMember = StaffMember & {
  nameSource: "known" | "custom";
};

type TeamFormProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void;
  groups: Group[];
  staffDirectory?: StaffDirectoryEntry[];
  defaultValues?: {
    id?: string;
    category?: string;
    coach?: string;
    staff?: StaffMember[];
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
  staffDirectory = [],
  defaultValues,
}: TeamFormProps) {
  const [staff, setStaff] = useState<EditableStaffMember[]>(() => {
    const withSource = (member: StaffMember): EditableStaffMember => {
      const matchingEntry = member.name
        ? staffDirectory.find(
            (entry) =>
              loosePersonIdentityKey(entry.name) === loosePersonIdentityKey(member.name),
          )
        : undefined;

      return {
        ...member,
        name: matchingEntry?.name || member.name,
        nameSource: matchingEntry ? "known" : member.name ? "custom" : "known",
      };
    };

    if (defaultValues?.staff?.length) return defaultValues.staff.map(withSource);
    if (defaultValues?.coach) {
      return [withSource({ role: "Entraîneur principal", name: defaultValues.coach })];
    }
    return [{ role: "Entraîneur principal", name: "", nameSource: "known" }];
  });

  const [slots, setSlots] = useState<Schedule[]>(() => {
    if (!defaultValues?.schedules?.length) {
      return [{ day: "Mercredi", time: "" }];
    }

    return defaultValues.schedules;
  });

  function addStaffMember() {
    setStaff((prev) => [...prev, { role: "Adjoint", name: "", nameSource: "known" }]);
  }

  function removeStaffMember(index: number) {
    setStaff((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0
        ? next
        : [{ role: "Entraîneur principal", name: "", nameSource: "known" }];
    });
  }

  function updateStaffMember(index: number, field: "role" | "name", value: string) {
    setStaff((prev) =>
      prev.map((member, i) => (i === index ? { ...member, [field]: value } : member)),
    );
  }

  function updateStaffNameSource(index: number, value: string) {
    setStaff((prev) =>
      prev.map((member, i) => {
        if (i !== index) return member;
        if (value === "__other__") {
          return { ...member, name: "", nameSource: "custom" };
        }
        return { ...member, name: value, nameSource: "known" };
      }),
    );
  }

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

  const serializedStaff = useMemo(() => {
    return staff
      .filter((member) => member.role.trim() && member.name.trim())
      .map((member) => `${member.role.trim()}|${member.name.trim()}`)
      .join("\n");
  }, [staff]);

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
        <input type="hidden" name="staff" value={serializedStaff} />

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
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="label mb-0">Staff de l’équipe</label>
            <span className="text-xs text-neutral-400">
              {staff.length} {staff.length > 1 ? "membres" : "membre"}
            </span>
          </div>

          <div className="space-y-3">
            {staff.map((member, index) => (
              <div
                key={index}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="w-full md:w-56">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Rôle
                    </label>
                    <input
                      list="team-staff-roles"
                      value={member.role}
                      onChange={(e) => updateStaffMember(index, "role", e.target.value)}
                      className="input bg-white"
                      placeholder="Ex : Entraîneur principal"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Nom
                    </label>
                    <select
                      value={member.nameSource === "custom" ? "__other__" : member.name}
                      onChange={(e) => updateStaffNameSource(index, e.target.value)}
                      className="input bg-white"
                    >
                      <option value="">Choisir une personne</option>
                      {staffDirectory.map((entry) => (
                        <option key={entry.name} value={entry.name}>
                          {entry.label}
                        </option>
                      ))}
                      <option value="__other__">Autre personne…</option>
                    </select>

                    {member.nameSource === "custom" ? (
                      <input
                        value={member.name}
                        onChange={(e) => updateStaffMember(index, "name", e.target.value)}
                        className="input mt-2 bg-white"
                        placeholder="Nom et prénom"
                        autoFocus
                      />
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeStaffMember(index)}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                    aria-label={`Supprimer le membre ${index + 1}`}
                    title="Supprimer ce membre"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <datalist id="team-staff-roles">
            <option value="Entraîneur principal" />
            <option value="Entraîneur adjoint" />
            <option value="Adjoint" />
            <option value="Entraîneur gardiens" />
            <option value="Préparateur physique" />
            <option value="Dirigeant" />
            <option value="Responsable d’équipe" />
          </datalist>

          <button
            type="button"
            onClick={addStaffMember}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:border-csv-orange hover:text-csv-orange"
          >
            <Plus size={16} />
            Ajouter un membre du staff
          </button>

          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
            Sélectionne une personne déjà connue du club ou choisis « Autre personne » si elle n’a pas encore de compte. Le premier membre reste utilisé comme responsable principal dans les anciens affichages du site.
          </p>
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
          <FormSubmitButton
            idleLabel={mode === "create" ? "Créer l’équipe" : "Enregistrer les modifications"}
            pendingLabel={mode === "create" ? "Création en cours…" : "Enregistrement en cours…"}
            successLabel={mode === "create" ? "Équipe créée ✓" : "Enregistré ✓"}
            successTitle={mode === "create" ? "Équipe créée" : "Enregistrement validé"}
            className="btn-primary disabled:cursor-wait disabled:opacity-70"
          />

          <Link href="/espace-educateurs/equipes" className="btn-secondary">
            Retour
          </Link>
        </div>
      </form>
    </div>
  );
}
