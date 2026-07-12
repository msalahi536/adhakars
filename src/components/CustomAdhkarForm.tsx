import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DhikrCard } from "./DhikrCard";
import type { Dhikr } from "@/data/adhkar";

export type CustomAdhkarFormValues = {
  title: string;
  arabic_text: string;
  transliteration: string;
  translation: string;
  source_reference: string;
  target_count: number;
};

const schema = z.object({
  title: z.string().trim().max(120, "Title is too long"),
  arabic_text: z
    .string()
    .trim()
    .min(1, "Arabic text is required")
    .max(2000, "Arabic text is too long"),
  transliteration: z.string().trim().max(500, "Too long"),
  translation: z.string().trim().max(1000, "Too long"),
  source_reference: z.string().trim().max(200, "Too long"),
  target_count: z
    .number({ invalid_type_error: "Target must be a number" })
    .int("Target must be a whole number")
    .min(1, "Target must be at least 1")
    .max(10000, "Target is too large"),
});

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<CustomAdhkarFormValues>;
  onCancel: () => void;
  onSubmit: (values: CustomAdhkarFormValues) => Promise<void> | void;
};

const emptyValues: CustomAdhkarFormValues = {
  title: "",
  arabic_text: "",
  transliteration: "",
  translation: "",
  source_reference: "",
  target_count: 1,
};

export function CustomAdhkarForm({ open, mode, initial, onCancel, onSubmit }: Props) {
  const [values, setValues] = useState<CustomAdhkarFormValues>({
    ...emptyValues,
    ...(initial ?? {}),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomAdhkarFormValues, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({ ...emptyValues, ...(initial ?? {}) });
      setErrors({});
      setSaving(false);
    }
  }, [open, initial]);

  const update = <K extends keyof CustomAdhkarFormValues>(k: K, v: CustomAdhkarFormValues[K]) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<keyof CustomAdhkarFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof CustomAdhkarFormValues;
        if (!next[field]) next[field] = issue.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(parsed.data);
    } finally {
      setSaving(false);
    }
  };

  const previewDhikr: Dhikr = {
    id: "preview",
    title: values.title || "Untitled",
    arabic: values.arabic_text || "…",
    transliteration: values.transliteration,
    translation: values.translation,
    source: values.source_reference,
    target: Math.max(1, Number.isFinite(values.target_count) ? values.target_count : 1),
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !saving) onCancel();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add adhkar" : "Edit adhkar"}</DialogTitle>
          <DialogDescription>
            Save an adhkar you want to recite regularly. Only Arabic text and a target count are
            required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Title (optional)" error={errors.title}>
            <Input
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Morning Istighfar"
              maxLength={120}
            />
          </Field>

          <Field label="Arabic text" required error={errors.arabic_text}>
            <Textarea
              dir="rtl"
              lang="ar"
              value={values.arabic_text}
              onChange={(e) => update("arabic_text", e.target.value)}
              placeholder="أدخل الذكر باللغة العربية"
              rows={3}
              style={{
                fontFamily: "'Scheherazade New', 'Amiri', serif",
                fontSize: 22,
                lineHeight: 1.7,
                textAlign: "right",
              }}
            />
          </Field>

          <Field label="Transliteration (optional)" error={errors.transliteration}>
            <Input
              value={values.transliteration}
              onChange={(e) => update("transliteration", e.target.value)}
              placeholder="e.g. Subhaanallaahi wa bi hamdihi"
            />
          </Field>

          <Field label="Translation (optional)" error={errors.translation}>
            <Textarea
              value={values.translation}
              onChange={(e) => update("translation", e.target.value)}
              placeholder="English meaning"
              rows={2}
            />
          </Field>

          <Field label="Source (optional)" error={errors.source_reference}>
            <Input
              value={values.source_reference}
              onChange={(e) => update("source_reference", e.target.value)}
              placeholder="e.g. Sahih al-Bukhari 6405"
            />
          </Field>

          <Field label="Target count" required error={errors.target_count}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={10000}
              value={Number.isFinite(values.target_count) ? values.target_count : ""}
              onChange={(e) => update("target_count", parseInt(e.target.value, 10) || 0)}
            />
          </Field>

          <div>
            <div
              className="label-caps mb-2"
              style={{ color: "var(--muted-foreground)", opacity: 1 }}
            >
              Live preview
            </div>
            <div
              className="rounded-2xl p-1"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                minHeight: 220,
              }}
            >
              <DhikrCard
                dhikr={previewDhikr}
                count={0}
                onIncrement={() => {}}
                index={1}
                total={1}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-60"
              style={{
                background: "var(--surface, var(--card))",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 disabled:opacity-60"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              {saving ? "Saving…" : mode === "create" ? "Add adhkar" : "Save changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="label-caps mb-1.5" style={{ opacity: 1 }}>
        {label}
        {required && <span style={{ color: "#c0392b" }}> *</span>}
      </div>
      {children}
      {error && (
        <div className="mt-1 text-xs" style={{ color: "#c0392b" }}>
          {error}
        </div>
      )}
    </label>
  );
}
