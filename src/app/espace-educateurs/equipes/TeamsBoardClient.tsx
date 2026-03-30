"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type TeamSchedule = {
  id: string;
  day: string;
  time: string;
};

type Team = {
  id: string;
  category: string;
  coach: string;
  sortOrder: number;
  isPublished: boolean;
  schedules: TeamSchedule[];
};

type TeamGroup = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  sortOrder: number;
  teams: Team[];
};

type TeamsBoardClientProps = {
  groups: TeamGroup[];
};

function TeamCard({
  team,
  onDelete,
}: {
  team: Team;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition-all",
        isDragging
          ? "opacity-70 shadow-xl"
          : "hover:-translate-y-0.5 hover:shadow-md",
      ].join(" ")}
    >
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-400 transition hover:bg-neutral-100"
            aria-label={`Déplacer ${team.category}`}
            title="Glisser-déposer"
          >
            <GripVertical size={18} />
          </button>

          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-neutral-900">
              {team.category}
            </div>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            team.isPublished
              ? "bg-green-100 text-green-700"
              : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {team.isPublished ? "Publié" : "Masqué"}
        </span>
      </div>

      {/* META */}
      <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              Responsable
            </div>
            <div className="truncate text-sm font-semibold text-neutral-800">
              {team.coach}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              Ordre
            </div>
            <div className="text-sm font-semibold text-neutral-700">
              #{team.sortOrder}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/espace-educateurs/equipes/${team.id}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          <Pencil size={16} />
          Modifier
        </Link>

        <button
          type="button"
          onClick={() => onDelete(team.id)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Trash2 size={16} />
          Supprimer
        </button>
      </div>

      {/* SCHEDULES */}
      <div className="mt-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-400">
          Créneaux
        </div>

        <div className="space-y-3">
          {team.schedules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
              Aucun créneau
            </div>
          ) : (
            team.schedules.map((slot) => (
              <div
                key={slot.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3"
              >
                <div className="text-xs font-medium text-neutral-500">
                  {slot.day}
                </div>
                <div className="mt-1 text-base font-bold text-neutral-900">
                  {slot.time}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}

export default function TeamsBoardClient({ groups }: TeamsBoardClientProps) {
  const [mounted, setMounted] = useState(false);
  const [board, setBoard] = useState(groups);
  const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  async function handleDelete(teamId: string) {
    const confirmed = window.confirm(
      "Supprimer cette équipe ? Cette action est définitive.",
    );
    if (!confirmed) return;

    const formData = new FormData();
    formData.append("id", teamId);

    const response = await fetch("/espace-educateurs/equipes/delete", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      alert("Impossible de supprimer l’équipe.");
      return;
    }

    window.location.reload();
  }

  async function persistOrder(groupId: string, teamIds: string[]) {
    setLoadingGroupId(groupId);

    try {
      const res = await fetch("/api/teams/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId, teamIds }),
      });

      if (!res.ok) {
        throw new Error("Impossible d’enregistrer l’ordre.");
      }
    } catch (error) {
      console.error(error);
      alert("Impossible d’enregistrer le nouvel ordre.");
      window.location.reload();
    } finally {
      setLoadingGroupId(null);
    }
  }

  function handleDragEnd(groupId: string, event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const group = board.find((g) => g.id === groupId);
    if (!group) return;

    const oldIndex = group.teams.findIndex((team) => team.id === active.id);
    const newIndex = group.teams.findIndex((team) => team.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(group.teams, oldIndex, newIndex).map(
      (team, index) => ({
        ...team,
        sortOrder: index + 1,
      }),
    );

    setBoard((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, teams: reordered } : g)),
    );

    void persistOrder(
      groupId,
      reordered.map((team) => team.id),
    );
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-neutral-100" />
        <div className="h-40 animate-pulse rounded-3xl bg-neutral-100" />
        <div className="h-40 animate-pulse rounded-3xl bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {board.map((group) => (
        <section
          key={group.id}
          className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
        >
          <div className="relative overflow-hidden border-b border-neutral-200 bg-neutral-950 px-6 py-6 md:px-8">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-neutral-900 to-orange-500/20" />
            <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-csv-orange/20 blur-3xl" />

            <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {group.badge}
                </div>

                <h2 className="mt-3 text-2xl font-extrabold text-white">
                  {group.title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  {group.subtitle}
                </p>
              </div>

              <div className="text-xs font-semibold uppercase tracking-wide text-white/50">
                Ordre groupe : {group.sortOrder}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {loadingGroupId === group.id ? (
              <div className="mb-4 rounded-2xl border border-csv-orange/20 bg-csv-orange/5 px-4 py-3 text-sm text-neutral-700">
                Enregistrement du nouvel ordre...
              </div>
            ) : null}

            {group.teams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
                Aucune équipe dans ce groupe pour le moment.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(group.id, event)}
              >
                <SortableContext
                  items={group.teams.map((team) => team.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                    {group.teams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
