import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, LogOut } from "lucide-react";
import { AdhkarPage } from "@/components/AdhkarPage";
import { GirihStarPattern } from "@/components/HeaderPatterns";
import {
  CustomAdhkarForm,
  type CustomAdhkarFormValues,
} from "@/components/CustomAdhkarForm";
import { supabase } from "@/integrations/supabase/client";
import type { Dhikr } from "@/data/adhkar";

export const Route = createFileRoute("/_authenticated/my-adhkar")({
  head: () => ({
    meta: [
      { title: "My Adhkar — My Adhkar" },
      { name: "description", content: "Your own custom adhkar cards, saved to your account." },
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

function MyAdhkar() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CustomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from("custom_adhkar")
      .select(
        "id, title, arabic_text, transliteration, translation, source_reference, target_count, sort_order, created_at",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setRows((data ?? []) as CustomRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    load();
  }, [load]);

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

  const handleDelete = async (id: string) => {
    if (typeof window !== "undefined") {
      const row = rows.find((r) => r.id === id);
      const label = row?.title || "this adhkar";
      const confirmed = window.confirm(`Delete "${label}"? This cannot be undone.`);
      if (!confirmed) return;
    }
    const { error } = await supabase.from("custom_adhkar").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async (values: CustomAdhkarFormValues) => {
    if (!userId) {
      setError("You must be signed in to save adhkar.");
      return;
    }
    if (editing) {
      const { data, error } = await supabase
        .from("custom_adhkar")
        .update({
          title: values.title,
          arabic_text: values.arabic_text,
          transliteration: values.transliteration || null,
          translation: values.translation || null,
          source_reference: values.source_reference || null,
          target_count: values.target_count,
        })
        .eq("id", editing.id)
        .select()
        .single();
      if (error) {
        setError(error.message);
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === editing.id ? (data as CustomRow) : r)));
    } else {
      const nextOrder = rows.length
        ? Math.max(...rows.map((r) => r.sort_order)) + 1
        : 0;
      const { data, error } = await supabase
        .from("custom_adhkar")
        .insert({
          user_id: userId,
          title: values.title,
          arabic_text: values.arabic_text,
          transliteration: values.transliteration || null,
          translation: values.translation || null,
          source_reference: values.source_reference || null,
          target_count: values.target_count,
          sort_order: nextOrder,
        })
        .select()
        .single();
      if (error) {
        setError(error.message);
        return;
      }
      setRows((prev) => [...prev, data as CustomRow]);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/more", replace: true });
  };

  const headerAction = (
    <div className="flex items-center gap-2">
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
      <button
        type="button"
        onClick={signOut}
        aria-label="Sign out"
        className="flex items-center justify-center rounded-full transition-transform active:scale-90"
        style={{
          width: 36,
          height: 36,
          color: "currentColor",
          background: "color-mix(in oklab, currentColor 14%, transparent)",
          border: "none",
        }}
      >
        <LogOut size={16} />
      </button>
    </div>
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
        emptyState={loading ? undefined : emptyState}
        onEditItem={openEdit}
        onDeleteItem={handleDelete}
      />
      {error && (
        <div
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold shadow-lg"
          style={{ background: "#c0392b", color: "#fff" }}
        >
          {error}
        </div>
      )}
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
