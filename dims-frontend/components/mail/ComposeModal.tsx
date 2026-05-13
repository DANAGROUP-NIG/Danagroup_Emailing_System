"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Send, Loader2, CornerUpLeft, Forward } from "lucide-react";
import { useMailStore } from "@/store/mailStore";
import toast from 'react-hot-toast';
import { useMail } from '@/hooks/useMail';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AttachmentUploader, { UploadedAttachment } from "./AttachmentUploader";
import { ComposeInput } from "../ui/Input";
import { Message } from "@/types/mail.types";
import type { ComposeData } from "@/types/mail.types";

// TODO: Implement ComposeModal Component
// - Floating compose modal (Gmail-style, bottom-right)
// - Controlled via mailStore (isComposeOpen, composeDefaults, closeCompose)
// - Fields: To (RecipientInput), CC, BCC, Subject, Body (rich text), Attachments
// - Rich text editor: TipTap or Quill
// - Save as Draft: POST /api/mail/draft
// - Send: POST /api/mail/send
// - Attachment uploader: AttachmentUploader component
// - Reply mode: pre-fills threadId, recipient, subject with "Re:"
// - Forward mode: pre-fills subject with "Fwd:", body with original message


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

const buildBodyHtml = (body: string) => `<p>${body.replace(/\n/g, '<br>')}</p>`;

const getRecipientAddress = (recipient: Message["recipients"][number]) =>
  recipient.email || recipient.recipient?.email || "";

const mapComposeValuesToPayload = (
  values: ComposeFormValues,
  draftId?: string | null,
): ComposeData => ({
  draftId: draftId || undefined,
  toEmails: parseEmailList(values.to),
  ccEmails: parseEmailList(values.cc),
  bccEmails: parseEmailList(values.bcc),
  subject: values.subject,
  body: values.body,
  bodyHtml: buildBodyHtml(values.body),
});

export default function ComposeModal() {
  const {
    isComposeOpen,
    closeCompose,
    composeDraftId,
    composeDefaults,
    setComposeDraftId,
  } =
    useMailStore();
  const { useSaveDraft, useSendMail, useGetMessage } = useMail();
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const isSendingRef = useRef(false);
  const isClosingRef = useRef(false);
  const saveDraftInFlightRef = useRef<Promise<Message | null> | null>(null);
  const lastSavedSignatureRef = useRef("");
  const currentDraftIdRef = useRef<string | null>(null);
  const currentThreadIdRef = useRef<string | null>(null);
  const initializedComposeKeyRef = useRef<string | null>(null);

  const { data } = useGetMessage(composeDraftId || "");

  const { mutate: sendEmail, isPending } = useSendMail();
  const { mutateAsync: saveDraft } = useSaveDraft();

  const { getValues, register, handleSubmit, reset, watch, formState: { errors } } = useForm<ComposeFormInput>({
    resolver: zodResolver(sendSchema),
    defaultValues: { to: '', cc: '', bcc: '', subject: '', body: '' }
  });

  const draftData = data as Message; 
  const composeMode = composeDefaults?.mode ?? (composeDraftId ? "draft" : "new");
  const composeTitle =
    composeMode === "reply"
      ? "Reply"
      : composeMode === "forward"
        ? "Forward"
        : composeMode === "draft"
          ? "Edit Draft"
          : "New Message";
  const watchedValues = watch();
  const attachmentIds = useMemo(
    () => uploadedAttachments.map((attachment) => attachment.id),
    [uploadedAttachments],
  );

  const initialAttachmentFiles = useMemo(
    () =>
      uploadedAttachments.map((attachment) => ({
        ...attachment,
        progress: attachment.progress ?? 100,
        isUploading: false,
      })),
    [uploadedAttachments],
  );

  const saveAsSentPayload = useCallback(
    (values: ComposeFormValues): ComposeData => ({
      ...mapComposeValuesToPayload(
        values,
        currentDraftIdRef.current || composeDraftId,
      ),
      threadId:
        currentDraftIdRef.current || composeDraftId || composeMode === "reply"
          ? currentThreadIdRef.current || composeDefaults?.threadId || undefined
          : undefined,
      attachmentIds: uploadedAttachments.map((attachment) => attachment.id),
    }),
    [composeDefaults?.threadId, composeDraftId, composeMode, uploadedAttachments],
  );

  const buildDraftPayload = useCallback(
    (values: Partial<ComposeFormValues>): ComposeData => ({
      draftId: currentDraftIdRef.current || composeDraftId || undefined,
      threadId: currentThreadIdRef.current || composeDefaults?.threadId || undefined,
      toEmails: parseEmailList(values.to),
      ccEmails: parseEmailList(values.cc),
      bccEmails: parseEmailList(values.bcc),
      subject: values.subject?.trim() || "(No Subject)",
      body: values.body || "",
      bodyHtml: buildBodyHtml(values.body || ""),
      attachmentIds,
    }),
    [attachmentIds, composeDefaults?.threadId, composeDraftId],
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
    async (values: Partial<ComposeFormValues>, showToast = false) => {
      if (!isComposeOpen || isSendingRef.current || !hasDraftContent(values)) {
        return null;
      }

      if (saveDraftInFlightRef.current) {
        return saveDraftInFlightRef.current;
      }

      const payload = buildDraftPayload(values);
      const signature = JSON.stringify(payload);

      if (signature === lastSavedSignatureRef.current) {
        return null;
      }

      const savePromise = saveDraft(payload)
        .then((savedDraft) => {
          if ((savedDraft as Partial<Message> | undefined)?.id) {
            currentDraftIdRef.current =
              (savedDraft as Partial<Message>).id ?? null;
          }

          if ((savedDraft as Partial<Message> | undefined)?.threadId) {
            currentThreadIdRef.current =
              (savedDraft as Partial<Message>).threadId ??
              currentThreadIdRef.current;
          }

          lastSavedSignatureRef.current = JSON.stringify({
            ...payload,
            draftId: currentDraftIdRef.current || payload.draftId,
          });

          if (showToast) {
            toast.success("Draft saved");
          }

          return (savedDraft as Message | undefined) ?? null;
        })
        .finally(() => {
          saveDraftInFlightRef.current = null;
        });

      saveDraftInFlightRef.current = savePromise;
      return savePromise;
    },
    [
      buildDraftPayload,
      hasDraftContent,
      isComposeOpen,
      saveDraft,
    ],
  );


  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isComposeOpen) handleCloseAndSaveDraft();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isComposeOpen, composeDraftId, draftData]);

  useEffect(() => {
    if (!isComposeOpen || isClosing || isSendingRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveDraftIfNeeded(getValues()).catch(() => {
        // Keep autosave quiet; explicit close still reports failures.
      });
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [
    attachmentIds,
    getValues,
    isClosing,
    isComposeOpen,
    saveDraftIfNeeded,
    watchedValues,
  ]);

  // Inside your useEffect in ComposeModal
  useEffect(() => {
    if (!isComposeOpen) {
      initializedComposeKeyRef.current = null;
      return;
    }

    const composeKey = composeDraftId || JSON.stringify(composeDefaults ?? {});
    if (initializedComposeKeyRef.current === composeKey) {
      return;
    }

    if (composeDraftId && !draftData) {
      return;
    }

    currentDraftIdRef.current = composeDraftId || null;
    currentThreadIdRef.current = composeDefaults?.threadId || null;
    initializedComposeKeyRef.current = composeKey;

    // If we are editing an EXISTING draft
    if (composeDraftId && draftData) {
      const toField = draftData.recipients
        ?.filter((r: any) => r.type === 'to')
        .map(getRecipientAddress)
        .filter(Boolean)
        .join(', ') || '';
        
      const ccField = draftData.recipients
        ?.filter((r: any) => r.type === 'cc')
        .map(getRecipientAddress)
        .filter(Boolean)
        .join(', ') || '';

      const bccField = draftData.recipients
        ?.filter((r: any) => r.type === 'bcc')
        .map(getRecipientAddress)
        .filter(Boolean)
        .join(', ') || '';

      reset({
        to: toField,
        cc: ccField,
        bcc: bccField,
        subject: draftData.subject || '',
        body: draftData.body || '',
      });
      currentThreadIdRef.current = draftData.threadId || composeDefaults?.threadId || null;
      setUploadedAttachments(
        (draftData.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          storageKey: attachment.storageKey,
          progress: 100,
          isUploading: false,
        })),
      );
      lastSavedSignatureRef.current = JSON.stringify(
        buildDraftPayload({
          to: toField,
          cc: ccField,
          bcc: bccField,
          subject: draftData.subject || '',
          body: draftData.body || '',
        }),
      );
    } 
    
    // If we are opening a FRESH compose modal
    if (!composeDraftId) {
      const defaults = composeDefaults ?? {};
      reset({
        to: defaults.to ?? '',
        cc: defaults.cc ?? '',
        bcc: defaults.bcc ?? '',
        subject: defaults.subject ?? '',
        body: defaults.body ?? '',
      });
      setUploadedAttachments(
        (defaults.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          storageKey: attachment.storageKey,
          progress: 100,
          isUploading: false,
        })),
      );
      lastSavedSignatureRef.current = "";
      isSendingRef.current = false;
    }
    
  }, [buildDraftPayload, composeDefaults, draftData, isComposeOpen, composeDraftId, reset]);



  

  // Function to handle saving before closing
  const handleCloseAndSaveDraft = async () => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    setIsClosing(true);
    const values = getValues();

    if (hasDraftContent(values)) {
      try {
        await saveDraftIfNeeded(values, true);
      } catch (err) {
        toast.error("Could not save draft");
        isClosingRef.current = false;
        setIsClosing(false);
        return;
      }
    }

    reset();
    setUploadedAttachments([]);
    lastSavedSignatureRef.current = "";
    currentDraftIdRef.current = null;
    currentThreadIdRef.current = null;
    isClosingRef.current = false;
    setIsClosing(false);
    closeCompose();
  };

  // Transformation Logic
  // Change 'data: ComposeFormValues' to 'data: any'
  const onSubmit = (data: ComposeFormValues) => {
    isSendingRef.current = true;
    const payload = saveAsSentPayload(data);

    sendEmail(payload, {
      onSuccess: () => {
        toast.success('Message sent!');
        reset();
        setUploadedAttachments([]);
        setComposeDraftId(null);
        lastSavedSignatureRef.current = "";
        currentThreadIdRef.current = null;
        closeCompose();
      },
      onError: (err: any) => {
        isSendingRef.current = false;
        const errorMessage = err.response?.data?.message || 'Failed to send';
        toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
      },
    });

  };



  if (!isComposeOpen) return null;

  return (
    <div className="relative flex justify-center items-center z-[100]">
     {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[3px] transition-opacity"
        onClick={handleCloseAndSaveDraft} // Optional: closes when clicking outside
      />

      {/* Blur background */}

      <div className=" flex justify-center items-center h-screen w-[100vw] z-[100]">
        {/* Header same as before */}
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 fixed top-[10%] flex-col z-[100] bg-white max-h-[80vh] min-w-[60vw] rounded-lg">

          <div className="flex justify-between items-center p-2 bg-dana-red-100/30 rounded-t-lg h-[12vh] lg:h-[14vh] border-b-dana-blue-500/60 border-b-4">
            <span className="flex items-center gap-2 px-2 text-sm font-bold">
              {composeMode === "reply" ? <CornerUpLeft size={16} /> : null}
              {composeMode === "forward" ? <Forward size={16} /> : null}
              {composeTitle}
            </span>
            <button 
              type="button" 
              onClick={handleCloseAndSaveDraft} 
              disabled={isClosing}
              className="hover:bg-red-100 p-1 rounded"
            >
              {isClosing ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
            </button>
          </div>

          <div className="px-4 py-4 gap-4 flex flex-col overflow-y-auto scrollbar-track-dana-blue-300  scrollbar-thin">
            <ComposeInput
              {...register("to")}
              type="text"
              label="To:"
              placeholder="To (comma separated)"
              errors={errors.to}
            />

            <ComposeInput
              type="text"
              {...register("cc")}
              placeholder="Add CC"
              label="Cc:"
              errors={errors.cc}

            />

            <ComposeInput
              type="text"
              label="Bcc:"
              {...register("bcc")}
              placeholder="Add BCC"
              errors={errors.bcc}

            />
            

            <ComposeInput
              type="text"
              label="subject"
              {...register("subject")} 
              placeholder="Subject"
              errors={errors.subject}
            />

            <textarea
              {...register("body")}
              placeholder="Write your message..."
              className="min-h-[210px] w-full flex-1 resize-none rounded-lg border border-gray-200 p-4 text-sm text-gray-700 outline-none"
            />
            {errors.body && <span className="text-xs text-red-500 px-1">{errors.body.message}</span>}

            <AttachmentUploader
              initialFiles={initialAttachmentFiles}
              onChange={setUploadedAttachments}
              onError={(message) => toast.error(message)}
            />
              
          </div>
          

          {/* Footer with Submit Button */}
         
          <div className="flex w-full relative justify-between py-2 h-[12vh] lg:h-[14vh] border-t-dana-blue-500/60 border-t-4 bg-dana-red-100/30 rounded-b-lg">
            <button type="submit" disabled={isPending} className="flex w-[100px] gap-2 absolute right-8 bg-gradient-to-br from-dana-blue-600 via-dana-blue-400 to-dana-red-500 text-white py-2 px-4 rounded hover:bg-dana-red-600 focus:outline-none focus:ring-2 focus:ring-dana-red-300">
              {isPending ? <Loader2 className="animate-spin" /> : <Send />} 
              <span>Send</span>
            </button>
          </div>
        </form> 
      </div>
    </div>
  );
}
