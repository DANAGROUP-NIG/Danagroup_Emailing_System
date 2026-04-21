"use client";

import { useState, useEffect } from "react";
import { X, Minimize2, Maximize2, Send, Paperclip, Loader2, Trash2 } from "lucide-react";
import { useMailStore } from "@/store/mailStore";
import toast from 'react-hot-toast';
import { useMail } from '@/hooks/useMail'; // Adjust path to where your useMail hook lives
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ComposeInput } from "../ui/Input";
import { Message } from "@/types/mail.types";

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


interface ComposeFormInput {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}

// Helper to validate comma-separated emails
const emailList = z.string()
  .transform((val) => val.split(',').map(e => e.trim()).filter(Boolean))
  .pipe(z.array(z.string().email("Invalid format"))
);

const composeSchema = z.object({
  to: emailList,
  // If empty, transform to empty string first, then to empty array
  cc: z.string().optional().default("").transform(v => v.split(',').map(e => e.trim()).filter(Boolean)),
  bcc: z.string().optional().default("").transform(v => v.split(',').map(e => e.trim()).filter(Boolean)),
  subject: z.string().min(1, "Required"),
  body: z.string().min(1, "Required"),
});



type ComposeFormValues = z.infer<typeof composeSchema>;

export default function ComposeModal() {
  const { isComposeOpen, closeCompose, composeDraftId } = useMailStore();
  const { useSaveDraft, useSendMail, useGetMessage, useMarkRead} = useMail()

  const { data, isLoading } = useGetMessage(composeDraftId || "");

  const { mutate: sendEmail, isPending } = useSendMail();
  const { mutateAsync: saveDraft } = useSaveDraft();
  const [isMaximized, setIsMaximized] = useState(false);

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
  }, [isComposeOpen]);

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
    }
    
  }, [draftData, isComposeOpen, composeDraftId, reset]);



  

  // Function to handle saving before closing
  const handleCloseAndSaveDraft = async () => {
    const values = getValues();
    // Check if there is anything worth saving
    const hasContent = values.to || values.subject || values.body;

    if (hasContent) {
      const draftPayload = {
        draftId: composeDraftId || undefined,
        toEmails: values.to ? values.to.split(',').map(e => e.trim()).filter(Boolean) : [],
        ccEmails: values.cc ? values.cc.split(',').map(e => e.trim()).filter(Boolean) : [],
        bccEmails: values.bcc ? values.bcc.split(',').map(e => e.trim()).filter(Boolean) : [],
        subject: values.subject || "(No Subject)",
        body: values.body || "",
        bodyHtml: `<p>${(values.body || "").replace(/\n/g, '<br>')}</p>`,
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
    closeCompose();
  };

  // Transformation Logic
  // Change 'data: ComposeFormValues' to 'data: any'
  const onSubmit = (data: any) => {
    // At this point, Zod has already transformed strings to arrays
    const validatedData = data as ComposeFormValues; 

    const payload = {
      draftId: composeDraftId || undefined,
      toEmails: validatedData.to,
      ccEmails: validatedData.cc.length > 0 ? validatedData.cc : undefined,
      bccEmails: validatedData.bcc.length > 0 ? validatedData.bcc : undefined,
      subject: validatedData.subject,
      body: validatedData.body,
      bodyHtml: `<p>${validatedData.body.replace(/\n/g, '<br>')}</p>`,
      // threadId and draftId can be added here if in reply/draft mode
    };

    sendEmail(payload, {
      onSuccess: () => {
        toast.success('Message sent!');
        reset();
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
              className="w-full flex-1 resize-none p-4 text-sm text-gray-700 outline-none"
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
