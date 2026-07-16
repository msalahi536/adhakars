import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AdhkarPage } from "@/components/AdhkarPage";
import { GirihStarPattern } from "@/components/HeaderPatterns";
import {
  CustomAdhkarForm,
  type CustomAdhkarFormValues,
} from "@/components/CustomAdhkarForm";
import type { Dhikr } from "@/data/adhkar";

export const Route = createFileRoute("/my-adhkar")({
  head: () => ({
    meta: [
      { title: "My Adhkar, Sahih Al-Adhkar" },
      { name: "description", content: "Your own custom adhkar cards, saved on this device." },
    ],
  }),
  component: MyAdhkar,
});

type CustomRow = {
  id: string;
  title: string;
  arabic_text: string;
  transliteration: string | null;
  translation: string | null;
  source_reference: string | null;
  target_count: number;
  sort_order: number;
  created_at: string;
};

const STORAGE_KEY = "custom_adhkar";

function loadRows(): CustomRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CustomRow[];
  } catch {
    return [];
  }
}

function saveRows(rows: CustomRow[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ignore
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ca_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function rowToDhikr(row: CustomRow): Dhikr {
  return {
    id: row.id,
    title: row.title || "Adhkar",
    arabic: row.arabic_text,
    transliteration: row.transliteration ?? "",
    translation: row.translation ?? "",
    source: row.source_reference ?? "",
    target: row.target_count,
  };
}

function sortRows(rows: CustomRow[]): CustomRow[] {
  return [...rows].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.created_at.localeCompare(b.created_at);
  });
}

function MyAdhkar() {
  const [rows, setRows] = useState<CustomRow[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRow | null>(null);

  useEffect(() => {
    setRows(sortRows(loadRows()));
  }, []);

  const persist = useCallback((next: CustomRow[]) => {
    const sorted = sortRows(next);
    setRows(sorted);
    saveRows(sorted);
  }, []);

  const items = useMemo(() => rows.map((r) => ({ dhikr: rowToDhikr(r) })), [rows]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (row) {
      setEditing(row);
      setFormOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined") {
      const row = rows.find((r) => r.id === id);
      const label = row?.title || "this adhkar";
      const confirmed = window.confirm(`Delete "${label}"? This cannot be undone.`);
      if (!confirmed) return;
    }
    persist(rows.filter((r) => r.id !== id));
  };

  const handleSubmit = (values: CustomAdhkarFormValues) => {
    if (editing) {
      const updated: CustomRow = {
        ...editing,
        title: values.title,
        arabic_text: values.arabic_text,
        transliteration: values.transliteration || null,
        translation: values.translation || null,
        source_reference: values.source_reference || null,
        target_count: values.target_count,
      };
      persist(rows.map((r) => (r.id === editing.id ? updated : r)));
    } else {
      const nextOrder = rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
      const created: CustomRow = {
        id: makeId(),
        title: values.title,
        arabic_text: values.arabic_text,
        transliteration: values.transliteration || null,
        translation: values.translation || null,
        source_reference: values.source_reference || null,
        target_count: values.target_count,
        sort_order: nextOrder,
        created_at: new Date().toISOString(),
      };
      persist([...rows, created]);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const headerAction = (
    <button
      type="button"
      onClick={openAdd}
      aria-label="Add adhkar"
      className="flex items-center justify-center rounded-full transition-transform active:scale-90"
      style={{
        width: 36,
        height: 36,
        color: "currentColor",
        background: "color-mix(in oklab, currentColor 14%, transparent)",
        border: "none",
      }}
    >
      <Plus size={20} />
    </button>
  );

  const emptyState = (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-10 text-center">
      <div
        className="rounded-[24px] p-6"
        style={{
          background: "var(--surface, var(--card))",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          width: "100%",
        }}
      >
        <div className="text-base font-bold">No adhkar yet</div>
        <p
          className="mx-auto mt-1.5 max-w-xs text-xs"
          style={{ color: "var(--muted-foreground)" }}
        >
          Add your own adhkar to build a personal collection. They'll appear here just like the
          built-in Morning and Evening cards.
        </p>
        <button
          type="button"
          onClick={openAdd}
          className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          <Plus size={16} /> Add your first adhkar
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AdhkarPage
        storageKey="custom_adhkar"
        lifetimeCategory="custom"
        title="My Adhkar"
        subtitle="Your personal collection"
        items={items}
        headerPattern={<GirihStarPattern />}
        headerAction={headerAction}
        emptyState={emptyState}
        onEditItem={openEdit}
        onDeleteItem={handleDelete}
      />
      <CustomAdhkarForm
        open={formOpen}
        mode={editing ? "edit" : "create"}
        initial={
          editing
            ? {
                title: editing.title,
                arabic_text: editing.arabic_text,
                transliteration: editing.transliteration ?? "",
                translation: editing.translation ?? "",
                source_reference: editing.source_reference ?? "",
                target_count: editing.target_count,
              }
            : undefined
        }
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
