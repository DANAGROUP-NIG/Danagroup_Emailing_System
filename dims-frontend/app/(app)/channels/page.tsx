"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Hash, Lock, Users, Globe, LogOut } from "lucide-react";
import {
  useMyChannels,
  usePublicChannels,
  useChannelMessages,
  useMarkChannelRead,
  useJoinChannel,
  useLeaveChannel,
  useChannelsSocket,
} from "@/hooks/useChannels";
import { useAuthStore } from "@/store/authStore";
import { channelsApi } from "@/lib/api/channels";
import ChannelList from "@/components/channels/ChannelList";
import CreateChannelModal from "@/components/channels/CreateChannelModal";
import MessageThread from "@/components/chat/MessageThread";
import MessageInput from "@/components/chat/MessageInput";
import { Avatar } from "@/components/ui/Avatar";
import type { Channel, ChannelMessage } from "@/types/channel.types";
import type { ChatParticipant, ChatMessage } from "@/types/chat.types";

function toThreadMessage(m: ChannelMessage): ChatMessage {
  return {
    id: m.id,
    conversationId: m.channelId,
    senderId: m.senderId,
    body: m.body,
    isRead: true,
    createdAt: m.createdAt,
    sender: m.sender ?? null,
  };
}

export default function ChannelsPage() {
  const user = useAuthStore((s) => s.user);

  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { data: myChannels = [], isLoading: myLoading } = useMyChannels();
  const { data: publicChannels = [], isLoading: publicLoading } = usePublicChannels();
  const markRead = useMarkChannelRead();
  const joinChannel = useJoinChannel();
  const leaveChannel = useLeaveChannel();
  const { sendViaSocket, markReadViaSocket } = useChannelsSocket(activeChannel?.id ?? null);

  const {
    data: messagesData,
    isLoading: msgsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useChannelMessages(activeChannel?.id ?? null);

  const messages = (messagesData?.pages.flat() ?? []).map(toThreadMessage);

  // Mark read when entering channel
  useEffect(() => {
    if (!activeChannel?.id) return;
    markReadViaSocket(activeChannel.id);
    markRead.mutate(activeChannel.id);
  }, [activeChannel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectChannel = useCallback((ch: Channel) => {
    setActiveChannel(ch);
    setShowBrowse(false);
  }, []);

  const handleSend = useCallback(
    async (body: string) => {
      if (!activeChannel || !user) return;
      const sent = sendViaSocket(activeChannel.id, body);
      if (!sent) {
        setIsSending(true);
        try {
          await channelsApi.sendMessage(activeChannel.id, body);
        } finally {
          setIsSending(false);
        }
      }
    },
    [activeChannel, user, sendViaSocket],
  );

  const handleJoin = (id: string) => {
    joinChannel.mutate(id, {
      onSuccess: () => {
        const ch = publicChannels.find((c) => c.id === id);
        if (ch) setActiveChannel(ch);
        setShowBrowse(false);
      },
    });
  };

  if (!user) return null;

  const isMember = activeChannel
    ? myChannels.some((ch) => ch.id === activeChannel.id)
    : false;

  const otherParticipant: ChatParticipant = {
    id: "channel",
    firstName: activeChannel?.name ?? "",
    lastName: "",
    avatarUrl: null,
  };

  return (
    <div className="flex h-[calc(100vh-73px)] overflow-hidden">
      {/* ── Channel sidebar ── */}
      <aside
        className={`
          flex flex-col border-r border-border bg-background
          w-full md:w-72 flex-shrink-0
          ${activeChannel ? "hidden md:flex" : "flex"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Channels</h1>
          </div>
          <button
            onClick={() => setShowBrowse(!showBrowse)}
            title="Browse public channels"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Globe className="h-4 w-4" />
          </button>
        </div>

        {showBrowse ? (
          /* Browse public channels */
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-3">
              Public Channels
            </p>
            {publicLoading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>
            ) : (
              publicChannels.map((ch) => {
                const joined = myChannels.some((m) => m.id === ch.id);
                return (
                  <div key={ch.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Hash className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{ch.name}</p>
                        {ch.description && (
                          <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
                        )}
                      </div>
                    </div>
                    {joined ? (
                      <button
                        onClick={() => handleSelectChannel(ch)}
                        className="flex-shrink-0 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                      >
                        Open
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(ch.id)}
                        disabled={joinChannel.isPending}
                        className="flex-shrink-0 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
                      >
                        Join
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <ChannelList
              channels={myChannels}
              isLoading={myLoading}
              activeId={activeChannel?.id ?? null}
              onSelect={handleSelectChannel}
              onCreateNew={() => setShowCreateModal(true)}
            />
          </div>
        )}
      </aside>

      {/* ── Message pane ── */}
      <main
        className={`flex flex-col flex-1 min-w-0 bg-background ${activeChannel ? "flex" : "hidden md:flex"}`}
      >
        {activeChannel ? (
          <>
            {/* Channel header */}
            <header className="flex items-center gap-3 border-b border-border px-4 py-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveChannel(null)}
                className="md:hidden rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {activeChannel.type === "private"
                  ? <Lock className="h-4 w-4 text-primary" />
                  : <Hash className="h-4 w-4 text-primary" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{activeChannel.name}</p>
                {activeChannel.description && (
                  <p className="text-xs text-muted-foreground truncate">{activeChannel.description}</p>
                )}
              </div>
              {isMember && (
                <button
                  onClick={() => {
                    if (confirm(`Leave #${activeChannel.name}?`)) {
                      leaveChannel.mutate(activeChannel.id, { onSuccess: () => setActiveChannel(null) });
                    }
                  }}
                  title="Leave channel"
                  className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-danger hover:bg-danger-light transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
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

            {/* Input — only if member */}
            {isMember ? (
              <MessageInput
                onSend={handleSend}
                disabled={isSending}
                placeholder={`Message #${activeChannel.name}…`}
              />
            ) : (
              <div className="flex items-center justify-center gap-3 border-t border-border px-4 py-4 bg-muted/30">
                <p className="text-sm text-muted-foreground">You are not a member of this channel.</p>
                <button
                  onClick={() => handleJoin(activeChannel.id)}
                  disabled={joinChannel.isPending}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  Join channel
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Hash className="h-8 w-8 text-muted-foreground" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Select a channel</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose from the list or{" "}
                <button onClick={() => setShowCreateModal(true)} className="text-primary hover:underline">
                  create a new one
                </button>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Create modal */}
      {showCreateModal && <CreateChannelModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
