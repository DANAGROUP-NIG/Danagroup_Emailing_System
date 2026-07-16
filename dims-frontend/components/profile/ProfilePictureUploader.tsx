"use client";

import { useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useUpdateAvatar } from '@/hooks/useProfile';
import { Avatar, getInitials } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Upload } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { User } from '@/types/user.types';
import { cn } from '@/lib/utils';

interface ProfilePictureUploaderProps {
  user: User;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

async function getCroppedImageFile(
  imageSrc: string,
  cropPixels: Area,
  sourceFile: File,
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image crop");
  }

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Could not create cropped image"));
    }, sourceFile.type || "image/png");
  });

  return new File([blob], sourceFile.name, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

export function ProfilePictureUploader({ user }: ProfilePictureUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateAvatar = useUpdateAvatar();

  const resetSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeCropModal = () => {
    setShowCropModal(false);
    resetSelection();
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setSelectedFile(file);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };



  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCropComplete = async () => {
    if (!selectedFile || !preview || !croppedAreaPixels) return;

    try {
      const croppedFile = await getCroppedImageFile(preview, croppedAreaPixels, selectedFile);
      await updateAvatar.mutateAsync(croppedFile);
      setShowCropModal(false);
      resetSelection();
    } catch (_error) {
      // Upload failure is surfaced via TanStack Query's error state on updateAvatar
    }
  };

  const initials = getInitials(user.firstName, user.lastName);
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <>
      <div className="flex flex-col items-center gap-5">
        {/* Large avatar preview with hover upload overlay */}
        <div className="relative group">
          <Avatar
            name={fullName}
            initials={initials}
            avatarUrl={user.avatarUrl}
            size="3xl"
            className="rounded-full ring-4 ring-border shadow-xl"
          />
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={updateAvatar.isPending}
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              updateAvatar.isPending && 'cursor-not-allowed opacity-60'
            )}
            title="Upload new picture"
            aria-label="Upload new picture"
          >
            <Upload className="h-8 w-8" />
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{fullName}</p>
          <p className="text-xs text-muted-foreground">JPG or PNG, max 5MB</p>
        </div>

        <div className="flex w-full max-w-xs flex-col items-center gap-3">
          {/* Hidden File Input */}
          <input
            id="profile-photo-input"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          <Button
            type="button"
            onClick={handleUploadClick}
            disabled={updateAvatar.isPending}
            variant="primary"
            size="sm"
            className="w-full"
          >
            <Upload className="h-4 w-4" />
            {updateAvatar.isPending ? 'Uploading...' : 'Upload new photo'}
          </Button>

          {/* Drag-Drop Zone */}
          <label
            htmlFor="profile-photo-input"
            className={cn(
              'w-full cursor-pointer rounded-lg border border-dashed border-border p-4 text-center transition-colors hover:border-primary hover:bg-primary-light/10',
              updateAvatar.isPending && 'pointer-events-none opacity-50'
            )}
          >
            <p className="text-xs text-muted-foreground">
              or drag and drop a photo here
            </p>
          </label>
        </div>
      </div>

      {/* Crop Modal */}
      <Modal
        open={showCropModal}
        onClose={closeCropModal}
        title="Crop Your Photo"
        size="lg"
      >
        <div className="space-y-4">
          {preview && (
            <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
              <Cropper
                image={preview}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={(_area: Area, areaPixels: Area) => setCroppedAreaPixels(areaPixels)}
                onZoomChange={setZoom}
              />
            </div>
          )}

          {/* Zoom Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Zoom</label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCropComplete}
              disabled={updateAvatar.isPending}
              variant="primary"
              className="flex-1"
            >
              {updateAvatar.isPending ? 'Uploading...' : 'Upload Photo'}
            </Button>
            <Button
              onClick={closeCropModal}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
