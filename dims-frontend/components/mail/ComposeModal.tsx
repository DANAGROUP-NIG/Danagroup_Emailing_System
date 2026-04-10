"use client";

import { useState, useEffect } from "react";
import { X, Minimize2, Maximize2, Send, Paperclip, Trash2 } from "lucide-react";
import { useMailStore } from "@/store/mailStore";
import RecipientInput from "./RecipientInput";
import AttachmentUploader from "./AttachmentUploader";
import AttachmentList from "./AttachmentList";
import Button from "../ui/Button";
import { User } from "@/types/user.types";

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

interface ComposeModalProps {
  inline?: boolean;
  mode?: "compose" | "reply" | "forward";
  threadId?: string;
  parentMessage?: any;
}

export default function ComposeModal({ 
  inline = false, 
  mode = "compose", 
  threadId, 
  parentMessage 
  }: ComposeModalProps
) {
  const { isComposeOpen, composeDefaults, closeCompose } = useMailStore();
  
  const [to, setTo] = useState<User[]>([]);
  const [cc, setCc] = useState<User[]>([]);
  const [bcc, setBcc] = useState<User[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Handle Reply/Forward Mode Pre-fills
  useEffect(() => {
    // 1. If we are in "inline reply" mode (passed via props)
    if (mode === "reply" && parentMessage) {
      setTo([parentMessage.sender]);
      setSubject(`Re: ${parentMessage.subject}`);
    } 
    // 2. If we are using the "floating compose" (passed via store)
    else if (composeDefaults) {
      if (composeDefaults.to) {
        setTo(Array.isArray(composeDefaults.to) ? composeDefaults.to : [composeDefaults.to]);
      }
      setSubject(composeDefaults.subject || "");
      setBody(composeDefaults.bodyHtml || composeDefaults.body || "");
    }
  }, [composeDefaults, mode, parentMessage]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await fetch("/api/mail/send", {
        method: "POST",
        body: JSON.stringify({ to, cc, bcc, subject, body, attachments, threadId: composeDefaults?.threadId }),
      });
      closeCompose();
    } catch (error) {
      console.error("Failed to send", error);
    } finally {
      setIsSending(false);
    }
  };

  const saveDraft = async () => {
    await fetch("/api/mail/draft", {
      method: "POST",
      body: JSON.stringify({ to, subject, body, attachments }),
    });
  };

  if (!isComposeOpen && !inline) return null;

  const containerClasses = inline 
    ? "w-full border rounded-lg bg-white shadow-sm" 
    : "fixed bottom-0 right-8 w-[600px] bg-white shadow-2xl rounded-t-xl border border-border z-50 animate-in slide-in-from-bottom-4";

  return (
    <div className={containerClasses}>
      {/* Header */}
      {!inline && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white rounded-t-xl">
          <span className="text-sm font-medium">New Message</span>
          <div className="flex items-center gap-2">
            <Minimize2 className="h-4 w-4 cursor-pointer opacity-70 hover:opacity-100" />
            <X onClick={closeCompose} className="h-4 w-4 cursor-pointer opacity-70 hover:opacity-100" />
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="flex flex-col p-2">
        <div className="flex items-center border-b px-2 py-1">
          <span className="text-sm text-muted-foreground w-12">To</span>
          <RecipientInput value={to} onChange={setTo} />
          {!showCcBcc && (
            <button onClick={() => setShowCcBcc(true)} className="text-xs text-muted-foreground hover:text-dana-blue">
              Cc/Bcc
            </button>
          )}
        </div>

        {showCcBcc && (
          <>
            <div className="flex items-center border-b px-2 py-1">
              <span className="text-sm text-muted-foreground w-12">Cc</span>
              <RecipientInput value={cc} onChange={setCc} />
            </div>
            <div className="flex items-center border-b px-2 py-1">
              <span className="text-sm text-muted-foreground w-12">Bcc</span>
              <RecipientInput value={bcc} onChange={setBcc} />
            </div>
          </>
        )}

        <div className="flex items-center border-b px-2 py-2">
          <input
            placeholder="Subject"
            className="flex-1 text-sm outline-none placeholder:text-muted-foreground"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Body Editor placeholder - In production, replace with Tiptap/Quill */}
        <textarea
          className="flex-1 min-h-[250px] p-3 text-sm outline-none resize-none"
          placeholder="Write your message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {/* <AttachmentList attachments={attachments} onRemove={(id) => setAttachments(a => a.filter(f => f.id !== id))} /> */}
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Button onClick={handleSend} disabled={isSending} btnStyle="bg-dana-blue hover:bg-dana-blue-dark">
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : "Send"}
          </Button>
          {/* <AttachmentUploader onUpload={(files) => setAttachments([...attachments, ...files])}>
            <button className="p-2 hover:bg-muted rounded-full">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </button>
          </AttachmentUploader> */}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={saveDraft} className="p-2 hover:bg-muted rounded-full" title="Save Draft">
            <Trash2 className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
