"use client";

import { useEffect, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
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

const composeSchema = z.object({
  to: emailListField(true),
  cc: emailListField(),
  bcc: emailListField(),
  subject: z.string().min(1, "Required"),
  body: z.string().min(1, "Required"),
});

type ComposeFormInput = z.input<typeof composeSchema>;
type ComposeFormValues = ComposeFormInput;

const buildBodyHtml = (body: string) => `<p>${body.replace(/\n/g, '<br>')}</p>`;

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
  const { isComposeOpen, closeCompose, composeDraftId } = useMailStore();
  const { useSaveDraft, useSendMail, useGetMessage } = useMail();
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([]);

  const { data } = useGetMessage(composeDraftId || "");

  const { mutate: sendEmail, isPending } = useSendMail();
  const { mutateAsync: saveDraft } = useSaveDraft();

  const { getValues, register, handleSubmit, reset, formState: { errors } } = useForm<ComposeFormInput>({
    resolver: zodResolver(composeSchema),
    defaultValues: { to: '', cc: '', bcc: '', subject: '', body: '' }
  });

  const draftData = data as Message; 


  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isComposeOpen) handleCloseAndSaveDraft();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isComposeOpen, composeDraftId, draftData]);

  // Inside your useEffect in ComposeModal
  useEffect(() => {
    // If we are editing an EXISTING draft
    if (isComposeOpen && composeDraftId && draftData) {
      const toField = draftData.recipients
        ?.filter((r: any) => r.type === 'to')
        .map((r: any) => r.recipient?.email)
        .join(', ') || '';
        
      const ccField = draftData.recipients
        ?.filter((r: any) => r.type === 'cc')
        .map((r: any) => r.recipient?.email)
        .join(', ') || '';

      const bccField = draftData.recipients
        ?.filter((r: any) => r.type === 'bcc')
        .map((r: any) => r.recipient?.email)
        .join(', ') || '';

      reset({
        to: toField,
        cc: ccField,
        bcc: bccField,
        subject: draftData.subject || '',
        body: draftData.body || '',
      });
    } 
    
    // If we are opening a FRESH compose modal
    if (isComposeOpen && !composeDraftId) {
      reset({ to: '', cc: '', bcc: '', subject: '', body: '' });
      setUploadedAttachments([]);
    }
    
  }, [draftData, isComposeOpen, composeDraftId, reset]);



  

  // Function to handle saving before closing
  const handleCloseAndSaveDraft = async () => {
    const values = getValues();
    // Check if there is anything worth saving
    const hasContent = values.to || values.cc || values.bcc || values.subject || values.body;

    if (hasContent) {
      const draftPayload: ComposeData = {
        draftId: composeDraftId || undefined,
        toEmails: parseEmailList(values.to),
        ccEmails: parseEmailList(values.cc),
        bccEmails: parseEmailList(values.bcc),
        subject: values.subject || "(No Subject)",
        body: values.body || "",
        bodyHtml: buildBodyHtml(values.body || ""),
        attachmentIds: uploadedAttachments.map((attachment) => attachment.id),
        isDraft: true,
      };

      try {
        // Use mutateAsync so the function waits for the server response
        await saveDraft(draftPayload);
        toast.success("Draft saved");
      } catch (err) {
        // Mutation failed (e.g., network error)
        toast.error("Could not save draft");
      }
    }

    // Close the modal regardless of whether a draft was saved or failed
    reset();
    setUploadedAttachments([]);
    closeCompose();
  };

  // Transformation Logic
  // Change 'data: ComposeFormValues' to 'data: any'
  const onSubmit = (data: ComposeFormValues) => {
    const payload = {
      ...mapComposeValuesToPayload(data, composeDraftId),
      attachmentIds: uploadedAttachments.map((attachment) => attachment.id),
    };

    sendEmail(payload, {
      onSuccess: () => {
        toast.success('Message sent!');
        reset();
        setUploadedAttachments([]);
        closeCompose();
      },
      onError: (err: any) => {
        const errorMessage = err.response?.data?.message || 'Failed to send';
        toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
      },
    });

  };



  if (!isComposeOpen) return null;

  return (
    <div className="relative">
     {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[3px] transition-opacity"
        onClick={handleCloseAndSaveDraft} // Optional: closes when clicking outside
      />
      
      <div className=" flex justify-center items-center fixed top-0 h-screen w-screen z-[100] ">
        {/* Header same as before */}
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col py-16 z-[100] bg-dana-red-200/90 maxh-[70vh] max-w-[60vw] rounded-lg">

          <div className="flex justify-between p-2 bg-gray-100 rounded-t-lg">
            <span className="text-sm font-bold px-2">New Message</span>
            <button 
              type="button" 
              onClick={handleCloseAndSaveDraft} 
              className="hover:bg-red-100 p-1 rounded"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-4 gap-4 flex flex-col">
            <ComposeInput
              {...register("to")}
              type="text"
              label="to"
              placeholder="To (comma separated)"
              errors={errors.to}
            />

            <ComposeInput
              type="text"
              {...register("cc")}
              placeholder="CC"
              label="cc"
              errors={errors.cc}

            />

            <ComposeInput
              type="text"
              label="bcc"
              {...register("bcc")}
              placeholder="BCC"
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
              className="min-h-[220px] w-full flex-1 resize-none rounded-lg border border-gray-200 p-4 text-sm text-gray-700 outline-none"
            />
            {errors.body && <span className="text-xs text-red-500 px-1">{errors.body.message}</span>}

            <AttachmentUploader
              onChange={setUploadedAttachments}
              onError={(message) => toast.error(message)}
            />
              
          </div>
          

          {/* Footer with Submit Button */}
          <button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Send />} Send
          </button>
        </form>
      </div>
    </div>
  );
}
