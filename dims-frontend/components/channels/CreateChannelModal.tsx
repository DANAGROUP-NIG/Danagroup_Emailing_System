"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Hash, Lock, X } from "lucide-react";
import { useCreateChannel } from "@/hooks/useChannels";
import { cn } from "@/lib/utils";
import type { ChannelType } from "@/types/channel.types";

const schema = z.object({
  name: z
    .string()
    .min(1, "Required")
    .max(100)
    .regex(/^[a-z0-9-_]+$/, "Lowercase letters, numbers, hyphens and underscores only"),
  description: z.string().max(500).optional(),
  type: z.enum(["public", "private"]),
});

type FormValues = z.infer<typeof schema>;

interface CreateChannelModalProps {
  onClose: () => void;
}

export default function CreateChannelModal({ onClose }: CreateChannelModalProps) {
  const createChannel = useCreateChannel();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "public", name: "", description: "" },
  });

  const type = watch("type");

  const onSubmit = (values: FormValues) => {
    createChannel.mutate(
      { name: values.name, description: values.description || undefined, type: values.type as ChannelType },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Create a channel</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Type picker */}
          <div className="grid grid-cols-2 gap-3">
            {(["public", "private"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("type", t)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors",
                  type === t ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                )}
              >
                {t === "public"
                  ? <Hash className={cn("h-5 w-5", type === t ? "text-primary" : "text-muted-foreground")} />
                  : <Lock className={cn("h-5 w-5", type === t ? "text-primary" : "text-muted-foreground")} />
                }
                <span className={cn("text-sm font-semibold capitalize", type === t ? "text-primary" : "text-foreground")}>{t}</span>
                <span className="text-xs text-muted-foreground">
                  {t === "public" ? "Anyone can join" : "Invite-only"}
                </span>
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Channel name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {type === "private" ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              </span>
              <input
                {...register("name")}
                placeholder="e.g. general"
                className={cn(
                  "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                  errors.name ? "border-danger" : "",
                )}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              {...register("description")}
              placeholder="What is this channel about?"
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createChannel.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {createChannel.isPending ? "Creating…" : "Create channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
