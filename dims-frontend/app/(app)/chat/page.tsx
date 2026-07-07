"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MessageSquare, ArrowLeft, Plus } from "lucide-react";
import {
  useConversations,
  useMessages,
  useGetOrCreateConversation,
  useMarkChatRead,
  useChatSocket,
} from "@/hooks/useChat";
import { useAuthStore } from "@/store/authStore";
import { chatApi } from "@/lib/api/chat";
import ConversationList from "@/components/chat/ConversationList";
import MessageThread from "@/components/chat/MessageThread";
import MessageInput from "@/components/chat/MessageInput";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { ChatConversation } from "@/types/chat.types";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [isSending, setIsSending] = useState(false);

  const { data: conversations = [], isLoading: convsLoading } = useConversations();
  const getOrCreate = useGetOrCreateConversation();
  const markRead = useMarkChatRead();
  const { sendViaSocket, markReadViaSocket } = useChatSocket(activeConversation?.id ?? null);

  const {
    data: messagesData,
    isLoading: msgsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessages(activeConversation?.id ?? null);

  // Flatten pages — oldest first (pages are fetched newest-first)
  const messages = messagesData?.pages.flat() ?? [];

  // Handle ?with=userId deep link from directory
  useEffect(() => {
    const withUserId = searchParams.get("with");
    if (withUserId && user?.id && !activeConversation) {
      getOrCreate.mutate(withUserId, {
        onSuccess: (conv) => setActiveConversation(conv),
      });
    }
  }, [searchParams, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark messages read when switching to a conversation
  useEffect(() => {
    if (!activeConversation?.id) return;
    markReadViaSocket(activeConversation.id);
    markRead.mutate(activeConversation.id);
  }, [activeConversation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectConversation = useCallback((conv: ChatConversation) => {
    setActiveConversation(conv);
    // Clear ?with param if present
    router.replace("/chat");
  }, [router]);

  const handleSend = useCallback(
    async (body: string) => {
      if (!activeConversation || !user?.id) return;

      const other =
        activeConversation.participantAId === user.id
          ? activeConversation.participantBId
          : activeConversation.participantAId;

      const sentViaWs = sendViaSocket(other, body);

      if (!sentViaWs) {
        // Fallback to REST
        setIsSending(true);
        try {
          await chatApi.sendMessage(other, body);
        } finally {
          setIsSending(false);
        }
      }
    },
    [activeConversation, user?.id, sendViaSocket],
  );

  if (!user) return null;

  const otherParticipant = activeConversation
    ? activeConversation.participantAId === user.id
      ? activeConversation.participantB
      : activeConversation.participantA
    : null;

  return (
    <div className="flex h-[calc(100vh-73px)] overflow-hidden">
      {/* ── Conversation list (sidebar) ── */}
      <aside
        className={`
          flex flex-col border-r border-border bg-background
          w-full md:w-80 lg:w-96 flex-shrink-0
          ${activeConversation ? "hidden md:flex" : "flex"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Messages</h1>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/directory")}
            aria-label="Start a new message"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            isLoading={convsLoading}
            activeId={activeConversation?.id ?? null}
            currentUserId={user.id}
            onSelect={handleSelectConversation}
          />
        </div>
      </aside>

      {/* ── Message pane ── */}
      <main
        className={`
          flex flex-col flex-1 min-w-0 bg-background
          ${activeConversation ? "flex" : "hidden md:flex"}
        `}
      >
        {activeConversation && otherParticipant ? (
          <>
            {/* Conversation header */}
            <header className="flex items-center gap-3 border-b border-border px-4 py-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveConversation(null)}
                className="md:hidden rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar
                name={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                src={otherParticipant.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {otherParticipant.firstName} {otherParticipant.lastName}
                </p>
                {otherParticipant.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {otherParticipant.email}
                  </p>
                )}
              </div>
            </header>

            {/* Messages */}
            <MessageThread
              messages={messages}
              currentUserId={user.id}
              isLoading={msgsLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={!!hasNextPage}
              onLoadMore={() => void fetchNextPage()}
              otherParticipant={otherParticipant}
            />

            {/* Input */}
            <MessageInput
              onSend={handleSend}
              disabled={isSending}
              placeholder={`Message ${otherParticipant.firstName}…`}
            />
          </>
        ) : (
          /* Empty state on desktop */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose from the list or start a chat from the{" "}
                <button
                  onClick={() => router.push("/directory")}
                  className="text-primary hover:underline"
                >
                  Directory
                </button>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
