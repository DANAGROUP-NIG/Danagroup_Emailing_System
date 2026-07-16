"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Clock3,
  Loader2,
  Minus,
  Save,
  Send,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { RichTextEditor, type EditorAttachment } from "@/components/mail/RichTextEditor";
import { useMail } from "@/hooks/useMail";
import { cn } from "@/lib/utils";
import { useMailStore } from "@/store/mailStore";
import type { ComposeData, Message } from "@/types/mail.types";
import { useToast } from "@/components/ui/Toast";
import { useSignature } from "@/hooks/useSignature";
import { useAuthStore } from "@/store/authStore";

const parseEmailList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const emailListField = (required = false) =>
  z
    .string()
    .default("")
    .superRefine((value, ctx) => {
      const emails = parseEmailList(value);

      if (required && emails.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one recipient is required",
        });
      }

      const seen = new Set<string>();
      for (const email of emails) {
        const result = z.string().email("Invalid email address").safeParse(email);
        if (!result.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid email: ${email}`,
          });
        }

        if (seen.has(email)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate email: ${email}`,
          });
        }

        seen.add(email);
      }
    });

const sendSchema = z.object({
  to: emailListField(true),
  cc: emailListField(),
  bcc: emailListField(),
  subject: z.string().min(1, "Required"),
  body: z.string().min(1, "Required"),
});

type ComposeFormInput = z.input<typeof sendSchema>;
type ComposeFormValues = ComposeFormInput;

const buildBodyHtml = (body: string) =>
  `<p>${body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g, "<br>")}</p>`;

const normalizeEditorHtml = (html: string) => html.trim() || "<p><br></p>";

const getRecipientAddress = (recipient: Message["recipients"][number]) =>
  recipient.email || recipient.recipient?.email || "";

const resolveSignatureAssets = (signature: string) => {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  if (!origin) return signature;
  return signature.replace(
    /src=["']?\/dana-logo\.png["']?/gi,
    `src="${origin}/dana-logo.png"`,
  );
};

const buildSignatureBlock = (signature: string | null) => {
  if (!signature) return "";
  return `<br><hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">${resolveSignatureAssets(signature)}`;
};

const mapComposeValuesToPayload = (
  values: ComposeFormValues,
  threadId?: string,
  draftId?: string | null,
  bodyHtml?: string,
): ComposeData => ({
  draftId: draftId || undefined,
  threadId: threadId || undefined,
  toEmails: parseEmailList(values.to),
  ccEmails: parseEmailList(values.cc),
  bccEmails: parseEmailList(values.bcc),
  subject: values.subject,
  body: values.body,
  bodyHtml: bodyHtml || buildBodyHtml(values.body),
});

export default function ComposeModal() {
  const titleId = useId();
  const bodyId = useId();
  const { showToast } = useToast();
  const { signature } = useSignature();
  const { isComposeOpen, closeCompose, composeDraftId, composeDefaults, setComposeDraftId } =
    useMailStore();
  const { useSaveDraft, useSendMail, useGetMessage } = useMail();
  const [isClosing, setIsClosing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [bodyHtml, setBodyHtml] = useState("");
  const [editorValue, setEditorValue] = useState("");
  const [editorAttachments, setEditorAttachments] = useState<EditorAttachment[]>([]);
  const isSendingRef = useRef(false);
  const isClosingRef = useRef(false);
  const lastSavedSignatureRef = useRef("");
  const currentDraftIdRef = useRef<string | null>(null);
  const initializedComposeKeyRef = useRef<string | null>(null);

  const attachmentIds = useMemo(() => {
    const ids = new Set<string>();
    const matches = bodyHtml.matchAll(/data-attachment-id=["']([^"']+)["']/g);
    for (const match of matches) {
      if (match[1]) ids.add(match[1]);
    }
    for (const att of editorAttachments) {
      ids.add(att.id);
    }
    return Array.from(ids);
  }, [bodyHtml, editorAttachments]);

  const { data } = useGetMessage(composeDraftId || "");
  const { mutate: sendEmail, isPending } = useSendMail();
  const { mutateAsync: saveDraft } = useSaveDraft();

  const {
    getValues,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ComposeFormInput>({
    resolver: zodResolver(sendSchema),
    defaultValues: { to: "", cc: "", bcc: "", subject: "", body: "" },
  });

  const draftData = data as Message | undefined;
  const watchedValues = watch();
  const recipientPreview = parseEmailList(watchedValues.to).join(", ");

  const buildDraftPayload = useCallback(
    (values: Partial<ComposeFormValues>): ComposeData => ({
      draftId: currentDraftIdRef.current || composeDraftId || undefined,
      threadId: composeDefaults?.threadId,
      toEmails: parseEmailList(values.to),
      ccEmails: parseEmailList(values.cc),
      bccEmails: parseEmailList(values.bcc),
      subject: values.subject?.trim() || "(No Subject)",
      body: values.body || "",
      bodyHtml: normalizeEditorHtml(bodyHtml || buildBodyHtml(values.body || "")),
      attachmentIds,
    }),
    [attachmentIds, bodyHtml, composeDefaults?.threadId, composeDraftId],
  );

  const hasDraftContent = useCallback(
    (values: Partial<ComposeFormValues>) =>
      Boolean(
        values.to ||
          values.cc ||
          values.bcc ||
          values.subject ||
          values.body ||
          attachmentIds.length,
      ),
    [attachmentIds.length],
  );

  const saveDraftIfNeeded = useCallback(
    async (values: Partial<ComposeFormValues>, shouldShowToast = false) => {
      if (!isComposeOpen || isSendingRef.current || !hasDraftContent(values)) {
        return null;
      }

      const payload = buildDraftPayload(values);
      const signature = JSON.stringify(payload);

      if (signature === lastSavedSignatureRef.current) {
        return null;
      }

      const savedDraft = await saveDraft(payload);
      if ((savedDraft as Partial<Message> | undefined)?.id) {
        currentDraftIdRef.current = (savedDraft as Partial<Message>).id ?? null;
      }

      lastSavedSignatureRef.current = JSON.stringify({
        ...payload,
        draftId: currentDraftIdRef.current || payload.draftId,
      });

      if (shouldShowToast) {
        showToast({ title: "Draft saved", variant: "success" });
      }

      return savedDraft;
    },
    [buildDraftPayload, hasDraftContent, isComposeOpen, saveDraft, showToast],
  );

  const resetComposeState = useCallback(() => {
    reset();
    setShowCc(false);
    setShowBcc(false);
    setIsMinimized(false);
    setBodyHtml("");
    setEditorValue("");
    lastSavedSignatureRef.current = "";
    currentDraftIdRef.current = null;
    isSendingRef.current = false;
  }, [reset]);

  const handleEditorChange = useCallback(
    (html: string, text: string) => {
      const normalized = normalizeEditorHtml(html);
      setBodyHtml(normalized);
      setValue("body", text.trim(), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const handleCloseAndSaveDraft = useCallback(async () => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    setIsClosing(true);
    const values = getValues();

    if (hasDraftContent(values)) {
      try {
        await saveDraftIfNeeded(values, true);
      } catch {
        showToast({ title: "Could not save draft", variant: "error" });
        isClosingRef.current = false;
        setIsClosing(false);
        return;
      }
    }

    resetComposeState();
    isClosingRef.current = false;
    setIsClosing(false);
    closeCompose();
  }, [closeCompose, getValues, hasDraftContent, resetComposeState, saveDraftIfNeeded, showToast]);

  const handleDiscard = useCallback(() => {
    resetComposeState();
    setComposeDraftId(null);
    closeCompose();
  }, [closeCompose, resetComposeState, setComposeDraftId]);

  const handleManualSaveDraft = useCallback(async () => {
    try {
      await saveDraftIfNeeded(getValues(), true);
    } catch {
      showToast({ title: "Could not save draft", variant: "error" });
    }
  }, [getValues, saveDraftIfNeeded, showToast]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isComposeOpen) {
        void handleCloseAndSaveDraft();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleCloseAndSaveDraft, isComposeOpen]);

  useEffect(() => {
    if (!isComposeOpen || isClosing || isSendingRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveDraftIfNeeded(getValues()).catch(() => {
        // Autosave stays quiet; explicit close/manual save reports failures.
      });
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [attachmentIds, getValues, isClosing, isComposeOpen, saveDraftIfNeeded, watchedValues]);

  useEffect(() => {
    if (!isComposeOpen) {
      initializedComposeKeyRef.current = null;
      return;
    }

    const composeKey = composeDraftId || JSON.stringify(composeDefaults || "new");
    if (initializedComposeKeyRef.current === composeKey) {
      return;
    }

    if (composeDraftId && !draftData) {
      return;
    }

    currentDraftIdRef.current = composeDraftId || null;
    initializedComposeKeyRef.current = composeKey;
    setIsMinimized(false);

    if (composeDraftId && draftData) {
      const toField =
        draftData.recipients
          ?.filter((recipient) => recipient.type === "to")
          .map(getRecipientAddress)
          .filter(Boolean)
          .join(", ") || "";
      const ccField =
        draftData.recipients
          ?.filter((recipient) => recipient.type === "cc")
          .map(getRecipientAddress)
          .filter(Boolean)
          .join(", ") || "";
      const bccField =
        draftData.recipients
          ?.filter((recipient) => recipient.type === "bcc")
          .map(getRecipientAddress)
          .filter(Boolean)
          .join(", ") || "";

      reset({
        to: toField,
        cc: ccField,
        bcc: bccField,
        subject: draftData.subject || "",
        body: draftData.body || "",
      });
      const draftHtml = draftData.bodyHtml || buildBodyHtml(draftData.body || "");
      const draftText = draftData.body || "";
      setEditorValue(draftHtml);
      setBodyHtml(normalizeEditorHtml(draftHtml));
      setValue("body", draftText, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
      setShowCc(Boolean(ccField));
      setShowBcc(Boolean(bccField));
      lastSavedSignatureRef.current = JSON.stringify(
        buildDraftPayload({
          to: toField,
          cc: ccField,
          bcc: bccField,
          subject: draftData.subject || "",
          body: draftData.body || "",
        }),
      );
      return;
    }

    const toValue = composeDefaults?.to
      ? Array.isArray(composeDefaults.to)
        ? composeDefaults.to.map((recipient) => recipient.email).join(", ")
        : composeDefaults.to
      : "";

    reset({
      to: toValue,
      cc: composeDefaults?.cc || "",
      bcc: composeDefaults?.bcc || "",
      subject: composeDefaults?.subject || "",
      body: composeDefaults?.body || "",
    });
    const user = useAuthStore.getState().user;
    const baseHtml = composeDefaults?.bodyHtml || buildBodyHtml(composeDefaults?.body || "");
    const sigBlock = buildSignatureBlock(signature);
    
    const injectSignatureBeforeQuote = (html: string, signatureBlock: string) => {
      const quoteIndex = html.indexOf('<div class="dims-quoted-message');
      if (quoteIndex !== -1) {
        return html.slice(0, quoteIndex) + signatureBlock + html.slice(quoteIndex);
      }
      return `${html}${signatureBlock}`;
    };

    const htmlWithSig = user?.signatureBeforeQuote
      ? injectSignatureBeforeQuote(baseHtml, sigBlock)
      : `${baseHtml}${sigBlock}`;

    const defaultText = composeDefaults?.body || "";
    setEditorValue(htmlWithSig);
    setBodyHtml(normalizeEditorHtml(htmlWithSig));
    setValue("body", defaultText, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setShowCc(Boolean(composeDefaults?.cc));
    setShowBcc(Boolean(composeDefaults?.bcc));
    lastSavedSignatureRef.current = "";
    isSendingRef.current = false;
  }, [buildDraftPayload, composeDefaults, composeDraftId, draftData, isComposeOpen, reset, setValue, signature]);

  const onSubmit = (data: ComposeFormValues) => {
    isSendingRef.current = true;
    const payload = {
      ...mapComposeValuesToPayload(
        data,
        composeDefaults?.threadId,
        currentDraftIdRef.current || composeDraftId,
        bodyHtml,
      ),
      attachmentIds,
    };

    sendEmail(payload, {
      onSuccess: () => {
        showToast({ title: "Message sent", variant: "success" });
        resetComposeState();
        setComposeDraftId(null);
        closeCompose();
      },
      onError: (err: unknown) => {
        isSendingRef.current = false;
        const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
        const errorMessage = axiosErr.response?.data?.message || "Failed to send";
        showToast({
          title: Array.isArray(errorMessage) ? (errorMessage[0] ?? "Failed to send") : errorMessage,
          variant: "error",
        });
      },
    });
  };

  if (!isComposeOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close compose and save draft"
        className="absolute inset-0 cursor-default bg-slate-950/20 backdrop-blur-[3px]"
        onClick={() => void handleCloseAndSaveDraft()}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-all duration-200",
          isMinimized ? "max-w-[520px]" : "max-h-[92vh] max-w-[980px]",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-dana-blue-50 text-dana-blue-700">
              <Send className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-xl font-semibold text-slate-950">
                {composeDefaults?.mode === "reply"
                  ? "Reply"
                  : composeDefaults?.mode === "forward"
                    ? "Forward"
                    : "New Message"}
              </h2>
              {isMinimized && (
                <p className="truncate text-sm text-slate-500">
                  {recipientPreview || watchedValues.subject || "Draft message"}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <button
              type="button"
              aria-label={isMinimized ? "Restore compose" : "Minimize compose"}
              onClick={() => setIsMinimized((value) => !value)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Close and save draft"
              onClick={() => void handleCloseAndSaveDraft()}
              disabled={isClosing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {isClosing ? <Loader2 size={18} className="animate-spin" /> : <X size={20} />}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-7 scrollbar-thin">
              <div className="space-y-3">
                <FieldShell
                  icon={<Users className="h-5 w-5" aria-hidden="true" />}
                  label="To"
                  error={errors.to?.message}
                  actions={
                    <div className="flex items-center gap-4 text-sm font-medium text-dana-blue-700">
                      <button type="button" onClick={() => setShowCc((value) => !value)} className="hover:text-dana-blue-900">
                        Cc
                      </button>
                      <button type="button" onClick={() => setShowBcc((value) => !value)} className="hover:text-dana-blue-900">
                        Bcc
                      </button>
                      <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    </div>
                  }
                >
                  <input
                    {...register("to")}
                    type="text"
                    placeholder="Add recipients..."
                    className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </FieldShell>

                {(showCc || errors.cc) && (
                  <FieldShell label="Cc" error={errors.cc?.message}>
                    <input
                      {...register("cc")}
                      type="text"
                      placeholder="Add carbon copy recipients..."
                      className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </FieldShell>
                )}

                {(showBcc || errors.bcc) && (
                  <FieldShell label="Bcc" error={errors.bcc?.message}>
                    <input
                      {...register("bcc")}
                      type="text"
                      placeholder="Add blind copy recipients..."
                      className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </FieldShell>
                )}

                <FieldShell
                  icon={<Tag className="h-5 w-5" aria-hidden="true" />}
                  label="Subject"
                  error={errors.subject?.message}
                >
                  <input
                    {...register("subject")}
                    type="text"
                    placeholder="Add a subject..."
                    className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </FieldShell>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <RichTextEditor
                    value={editorValue}
                    onChange={handleEditorChange}
                    placeholder="Write your message..."
                    minHeight="260px"
                    className="md:min-h-[300px]"
                    onAttachmentsChange={setEditorAttachments}
                  />
                  {errors.body && (
                    <span id={`${bodyId}-err`} role="alert" className="block px-6 pb-4 text-xs text-danger">
                      {errors.body.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div className="flex min-w-0 items-center gap-3 text-dana-blue-900">
                <button
                  type="button"
                  aria-label="Discard message"
                  onClick={handleDiscard}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-dana-blue-900">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
                <button
                  type="button"
                  onClick={() => void handleManualSaveDraft()}
                  className="inline-flex min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Save className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Save draft</span>
                </button>
              </div>

              <button
                type="submit"
                aria-label={isPending ? "Sending message..." : "Send message"}
                disabled={isPending}
                className="inline-flex h-12 min-w-[150px] items-center justify-center overflow-hidden rounded-xl bg-dana-blue-700 text-white shadow-dana transition-colors hover:bg-dana-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              >
                <span className="inline-flex flex-1 items-center justify-center gap-3 px-5">
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-5 w-5" aria-hidden="true" />
                  )}
                  <span className="font-semibold">Send</span>
                </span>
                <span className="flex h-full w-12 items-center justify-center border-l border-white/20">
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                </span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function FieldShell({
  children,
  error,
  icon,
  label,
  actions,
}: {
  children: React.ReactNode;
  error?: string | undefined;
  icon?: React.ReactNode | undefined;
  label: string;
  actions?: React.ReactNode | undefined;
}) {
  return (
    <div>
      <div
        className={cn(
          "flex min-h-[72px] items-center gap-4 rounded-xl border bg-white px-4 transition-colors focus-within:border-dana-blue-500 focus-within:ring-2 focus-within:ring-dana-blue-500/10",
          error ? "border-danger" : "border-slate-200",
        )}
      >
        {icon && (
          <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dana-blue-50 text-dana-blue-700 sm:flex">
            {icon}
          </span>
        )}
        <label className="w-16 shrink-0 text-base font-semibold text-slate-950">{label}</label>
        {children}
        {actions}
      </div>
      {error && <p className="mt-1 px-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

