"use client";

import { useEffect, useState } from "react";
import { PenLine, Eye, Trash2 } from "lucide-react";
import { useSignature } from "@/hooks/useSignature";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function SignatureSettingsPage() {
  const { signature, isLoading, saveSignature, isSaving } = useSignature();
  const { showToast } = useToast();

  const [value, setValue] = useState("");
  const [preview, setPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setValue(signature ?? "");
      setIsDirty(false);
    }
  }, [signature, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setIsDirty(e.target.value !== (signature ?? ""));
  };

  const handleSave = async () => {
    try {
      await saveSignature(value.trim() || null);
      setIsDirty(false);
      showToast({ title: "Signature saved", variant: "success" });
    } catch {
      showToast({ title: "Failed to save signature", variant: "error" });
    }
  };

  const handleClear = async () => {
    setValue("");
    try {
      await saveSignature(null);
      setIsDirty(false);
      showToast({ title: "Signature removed", variant: "success" });
    } catch {
      showToast({ title: "Failed to remove signature", variant: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          <div className="h-40 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PenLine className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Email Signature
              </h2>
              <p className="text-sm text-muted-foreground">
                Automatically appended to every message you send.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors",
              preview
                ? "border-primary text-primary bg-primary/5"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
            )}
          >
            <Eye size={13} aria-hidden="true" />
            {preview ? "Edit" : "Preview"}
          </button>
        </div>

        {/* Editor / Preview */}
        {preview ? (
          <div
            className="min-h-[160px] rounded-lg border border-border bg-background p-4 prose prose-sm max-w-none text-sm text-foreground"
            dangerouslySetInnerHTML={{ __html: value || "<em class='text-muted-foreground'>No signature set.</em>" }}
          />
        ) : (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder="Enter your signature here. You can use simple HTML like <b>, <i>, <a href=...>..."
            rows={7}
            className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
          />
        )}

        <p className="text-xs text-muted-foreground">
          Supports basic HTML:{" "}
          <code className="bg-muted px-1 rounded text-xs">&lt;b&gt;</code>{" "}
          <code className="bg-muted px-1 rounded text-xs">&lt;i&gt;</code>{" "}
          <code className="bg-muted px-1 rounded text-xs">&lt;a href="..."&gt;</code>{" "}
          <code className="bg-muted px-1 rounded text-xs">&lt;br&gt;</code>
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save signature"}
          </button>

          {(signature || value) && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-danger hover:border-danger transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Live preview card */}
      {value.trim() && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            How it will appear in messages
          </p>
          <div className="border-t border-border pt-4">
            <div
              className="prose prose-sm max-w-none text-sm text-foreground"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
