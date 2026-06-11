// components/profile/ProfilePictureUploader.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useProfileStore } from "@/store/profileStore";
import { getInitials } from "@/components/ui/Avatar";
import type { User } from "@/types/user.types";

interface ProfilePictureUploaderProps {
  initialUser: User;
}

export function ProfilePictureUploader({
  initialUser,
}: ProfilePictureUploaderProps) {
  const [user, setUser] = useState(initialUser);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { changeDP } = useProfileStore();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const selectedFile = fileList[0];

    if (!selectedFile.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG/JPEG).");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");

      const result = await changeDP(selectedFile);
      const newImageUrl = result?.avatarUrl;

      if (!newImageUrl) {
        throw new Error("Failed to retrieve image URL from upload response.");
      }

      setUser((prev) => ({ ...prev, avatarUrl: newImageUrl }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative inline-block group">
        <div
          className={cn(
            "relative h-20 w-20 overflow-hidden rounded-full transition-opacity",
            isUploading ? "opacity-50" : "opacity-100",
          )}
        >
          {user?.avatarUrl ? (
            <Image
              alt={`${user.firstName ?? "User"}'s profile`}
              src={user.avatarUrl}
              fill
              sizes="80px"
              className="rounded-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-dana-blue-600 text-2xl font-semibold text-white">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <label
          htmlFor="dp-upload"
          className={cn(
            "absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground shadow-dana-sm transition-colors hover:bg-accent",
            isUploading && "cursor-not-allowed opacity-60",
          )}
          title="Change profile picture"
        >
          <Camera className="h-4 w-4" />
          <input
            id="dp-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {errorMessage && (
        <p className="mt-2 rounded-md bg-danger-light px-3 py-1 text-sm font-medium text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// local cn helper to avoid import cycle on rare bundler paths
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
