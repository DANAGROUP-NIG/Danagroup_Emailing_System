"use client";

import { useState, useEffect } from "react";
import { X, Minimize2, Maximize2, Send, Paperclip, Loader2, Trash2 } from "lucide-react";
import { useMailStore } from "@/store/mailStore";
import RecipientInput from "./RecipientInput";
import AttachmentUploader from "./AttachmentUploader";
import AttachmentList from "./AttachmentList";
import Button from "../ui/Button";
import { User } from "@/types/user.types";
import toast from 'react-hot-toast';
import { useMail } from '@/hooks/useMail'; // Adjust path to where your useMail hook lives



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


export default function ComposeModal() {
  const { isComposeOpen, closeCompose } = useMailStore();
  const { useSendMail } = useMail();
  const { mutate: sendEmail, isPending } = useSendMail();
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
  });


  useEffect(() => {
    setMounted(true);
  }, []);


  
  if (!mounted || !isComposeOpen) return null;


 

  console.log('Is Compose Open?', isComposeOpen);


  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.to || !formData.subject) {
      return toast.error('Please add a recipient UUID and subject');
    }

    // IMPORTANT: Since recipient_id is a UUID, users should ideally select 
    // from a dropdown. If they are typing UUIDs manually:
    const recipientList = formData.to.split(',').map((uuid) => ({
      recipient_id: uuid.trim(), // Must be a valid UUID string
      type: 'to' as const,
    }));

    sendEmail(
      {
        recipients: recipientList, // Check: is this key 'recipients' in your ComposeData?
        subject: formData.subject,
        body: formData.body,
        bodyHtml: `<p>${formData.body.replace(/\n/g, '<br>')}</p>`,
        isDraft: false,
      },
      {
        onSuccess: () => {
          toast.success('Message sent!');
          setFormData({ to: '', subject: '', body: '' });
          closeCompose();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Check recipient UUIDs');
        },
      }
    );
  };


  return (
    <div
      className={`fixed bottom-0 right-8 z-[100] flex flex-col overflow-hidden rounded-t-xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 ${
        isMaximized ? 'h-[90vh] w-[80vw]' : 'h-[600px] w-[540px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-dana-blue-900 px-4 py-3 text-white">
        <span className="text-sm font-semibold text-blue-50">New Message</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMaximized(!isMaximized)} className="hover:text-blue-200">
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={closeCompose} className="hover:text-red-300">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSend} className="flex flex-1 flex-col">
        <div className="px-4">
          <input
            type="text"
            placeholder="Recipients (comma separated)"
            className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-dana-blue-500"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            disabled={isPending}
          />
          <input
            type="text"
            placeholder="Subject"
            className="w-full border-b border-gray-100 py-3 text-sm outline-none focus:border-dana-blue-500"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            disabled={isPending}
          />
        </div>

        <textarea
          placeholder="Write your message..."
          className="w-full flex-1 resize-none p-4 text-sm text-gray-700 outline-none"
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          disabled={isPending}
        />

        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
          <button type="button" className="rounded-md p-2 text-gray-400 hover:bg-gray-200">
            <Paperclip className="h-5 w-5" />
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-dana-blue-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-dana-blue-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
