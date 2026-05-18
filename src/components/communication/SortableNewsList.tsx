"use client";

import { useEffect, useMemo, useState } from "react";
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
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import NewsListItem from "@/components/communication/NewsListItem";
import { useToast } from "@/components/ui/ToastProvider";

type SortableNewsItem = {
  id: string;
  title: string;
  typeLabel: string;
  typeClasses: string;
  isPublished: boolean;
  excerpt: string | null;
  fileUrl: string | null;
  externalUrl: string | null;
  displayDate: string;
};

type SortableNewsListProps = {
  items: SortableNewsItem[];
  togglePublishAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

type SortableRowProps = {
  item: SortableNewsItem;
  togglePublishAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
};

function SortableRow({
  item,
  togglePublishAction,
  deleteAction,
  disabled = false,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-60" : ""}
    >
      <div className="group relative">
        <div
          className={`absolute left-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-white text-neutral-500 shadow-sm transition hover:bg-orange-50 hover:text-csv-orange ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
          {...attributes}
          {...listeners}
          aria-label={`Réordonner ${item.title}`}
          title={
            disabled ? "Enregistrement en cours..." : "Glisser pour réordonner"
          }
        >
          <GripVertical size={16} />
        </div>

        <div className="pl-14">
          <NewsListItem
            item={item}
            togglePublishAction={togglePublishAction}
            deleteAction={deleteAction}
          />
        </div>
      </div>
    </div>
  );
}

export default function SortableNewsList({
  items,
  togglePublishAction,
  deleteAction,
}: SortableNewsListProps) {
  const [orderedItems, setOrderedItems] = useState(items);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const itemIds = useMemo(
    () => orderedItems.map((item) => item.id),
    [orderedItems],
  );

  async function persistOrder(nextItems: SortableNewsItem[]) {
    const payload = nextItems.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }));

    const response = await fetch("/api/news/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: payload }),
    });

    if (!response.ok) {
      throw new Error("Impossible d’enregistrer le nouvel ordre.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (saving) return;

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const previousItems = orderedItems;

    const oldIndex = orderedItems.findIndex((item) => item.id === active.id);
    const newIndex = orderedItems.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const nextItems = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(nextItems);
    setSaving(true);

    toast.brand(
      "Réorganisation en cours...",
      "Le nouvel ordre est en train d’être sauvegardé.",
    );

    try {
      await persistOrder(nextItems);

      toast.success(
        "Ordre enregistré ✅",
        "L’ordre des contenus a bien été mis à jour.",
      );
    } catch (error) {
      console.error(error);
      setOrderedItems(previousItems);

      toast.error(
        "Réorganisation impossible",
        "Le nouvel ordre n’a pas pu être enregistré. L’ordre précédent a été restauré.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm">
          <div className="text-neutral-700">
            Glisse les contenus via la poignée pour modifier l’ordre d’affichage.
          </div>
          <div className="font-semibold text-neutral-500">
            Chargement du tri...
          </div>
        </div>

        <div className="space-y-4">
          {orderedItems.map((item) => (
            <div key={item.id} className="pl-14">
              <NewsListItem
                item={item}
                togglePublishAction={togglePublishAction}
                deleteAction={deleteAction}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm">
        <div className="text-neutral-700">
          Glisse les contenus via la poignée pour modifier l’ordre d’affichage.
        </div>
        <div className="font-semibold text-neutral-500">
          {saving ? "Enregistrement..." : "Ordre manuel actif"}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {orderedItems.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                togglePublishAction={togglePublishAction}
                deleteAction={deleteAction}
                disabled={saving}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
