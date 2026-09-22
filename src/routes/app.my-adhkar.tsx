import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AdhkarPage } from "@/components/AdhkarPage";
import {
  CustomAdhkarForm,
  type CustomAdhkarFormValues,
} from "@/components/CustomAdhkarForm";
import type { Dhikr } from "@/data/adhkar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/app/my-adhkar")({
  head: () => ({
    meta: [
      { title: "My Adhkar, Sahih Al-Adhkar" },
      { name: "description", content: "Your own custom adhkar cards, saved on this device." },
      { property: "og:title", content: "My Adhkar, Sahih Al-Adhkar" },
      { property: "og:description", content: "Create personal adhkar cards saved on your device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
    return parsed.flatMap((value, index): CustomRow[] => {
      if (!value || typeof value !== "object") return [];
      const row = value as Partial<CustomRow>;
      const target = Number(row.target_count);
      const createdAt = typeof row.created_at === "string" ? row.created_at : new Date(index).toISOString();
      return [{
        id: typeof row.id === "string" && row.id ? row.id : `legacy_${index}_${createdAt}`,
        title: typeof row.title === "string" ? row.title : "Adhkar",
        arabic_text: typeof row.arabic_text === "string" ? row.arabic_text : "",
        transliteration: typeof row.transliteration === "string" ? row.transliteration : null,
        translation: typeof row.translation === "string" ? row.translation : null,
        source_reference: typeof row.source_reference === "string" ? row.source_reference : null,
        target_count: Number.isFinite(target) ? Math.max(1, Math.round(target)) : 1,
        sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : index,
        created_at: createdAt,
      }];
    });
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
  const [deleting, setDeleting] = useState<CustomRow | null>(null);

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
    setDeleting(rows.find((r) => r.id === id) ?? null);
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

  const emptyState = (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-10 text-center">
      <div
        className="glass-card p-6"
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
        headerPattern={null}
        emptyState={emptyState}
        onAddItem={openAdd}
        onEditItem={openEdit}
        onDeleteItem={handleDelete}
        dailyLayout
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
      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent
          className="w-[calc(100%-40px)] max-w-sm rounded-[22px] border p-5"
          style={{ background: "var(--surface, var(--card))", borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Delete this adhkar?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--muted-foreground)" }}>
              {deleting?.title ? `“${deleting.title}” will be removed from your collection.` : "This adhkar will be removed from your collection."} This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 grid grid-cols-2 gap-2">
            <AlertDialogCancel className="m-0 rounded-full" style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              style={{ background: "var(--destructive)", color: "var(--destructive-foreground)" }}
              onClick={() => {
                if (deleting) persist(rows.filter((row) => row.id !== deleting.id));
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
