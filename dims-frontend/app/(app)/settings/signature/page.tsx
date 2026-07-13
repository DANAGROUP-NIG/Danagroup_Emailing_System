"use client";

import { useEffect, useState } from "react";
import { PenLine, Trash2, Wand2 } from "lucide-react";
import { useSignature } from "@/hooks/useSignature";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";
import { RichTextEditor } from "@/components/mail/RichTextEditor";

export default function SignatureSettingsPage() {
  const { signature, isLoading, saveSignature, isSaving } = useSignature();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [value, setValue] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setValue(signature ?? "");
      setIsDirty(false);
    }
  }, [signature, isLoading]);

  const handleChange = (html: string, _text: string) => {
    const empty = html === "<p></p>" || html === "";
    const next = empty ? "" : html;
    setValue(next);
    setIsDirty(next !== (signature ?? ""));
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

  const applyTemplate = () => {
    const name = user ? `${user.firstName} ${user.lastName}` : "Your Name";
    const title = user?.jobTitle ?? "Your Title";
    const email = user?.email ?? "you@danagroup.net";
    const html = [
      `<p><strong>${name}</strong></p>`,
      `<p>${title}</p>`,
      `<p>116 Dana House | Isolo | Lagos | Nigeria</p>`,
      `<p>Mob: +234 000 000 0000</p>`,
      `<p>Tel: +234 000 000 0000</p>`,
      `<p>Email: <a href="mailto:${email}">${email}</a></p>`,
      `<p><img src="/dana-logo.png" alt="Dana Group" height="50" style="height:50px;width:auto;display:block;margin-top:8px" /></p>`,
    ].join("");
    setValue(html);
    setIsDirty(html !== (signature ?? ""));
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <PenLine className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Email Signature</h2>
              <p className="text-sm text-muted-foreground">
                Automatically appended to every message you send.
              </p>
            </div>
          </div>
          {!value && (
            <button
              type="button"
              onClick={applyTemplate}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <Wand2 size={13} aria-hidden="true" />
              Use default template
            </button>
          )}
        </div>

        {/* Rich Text Editor */}
        <RichTextEditor
          value={value}
          onChange={handleChange}
          placeholder="Type your signature here — use the toolbar to format text, add links, and more..."
          minHeight="140px"
        />

        <p className="text-xs text-muted-foreground">
          Use the toolbar above to format your signature. No HTML knowledge required.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save signature"}
          </button>

          {(value || signature) && (
            <>
              {isDirty && value !== (signature ?? "") && signature && (
                <button
                  type="button"
                  onClick={() => { setValue(signature ?? ""); setIsDirty(false); }}
                  className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Discard
                </button>
              )}
              <button
                type="button"
                onClick={handleClear}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-danger hover:border-danger transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} aria-hidden="true" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live preview card */}
      {value.trim() && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Preview — how it appears in messages
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
