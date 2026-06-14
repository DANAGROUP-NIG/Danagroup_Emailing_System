'use client';

import { useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
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

export function ProfilePictureUploader({ user }: ProfilePictureUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateAvatar = useUpdateAvatar();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCropComplete = async () => {
    if (!selectedFile) return;

    try {
      await updateAvatar.mutateAsync(selectedFile);
      setSelectedFile(null);
      setPreview(null);
      setShowCropModal(false);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  const initials = getInitials(user.firstName, user.lastName);
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <>
      {/* Avatar Display */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar
            name={fullName}
            initials={initials}
            avatarUrl={user.avatarUrl}
            size="xl"
            className="ring-4 ring-primary-light"
          />
          <button
            onClick={handleUploadClick}
            disabled={updateAvatar.isPending}
            className={cn(
              'absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow-dana',
              updateAvatar.isPending && 'opacity-50 cursor-not-allowed'
            )}
            title="Upload new picture"
          >
            <Upload className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Profile Picture</p>
          <p className="text-xs text-muted-foreground">JPG or PNG, max 5MB</p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* Drag-Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors hover:border-primary hover:bg-primary-light/10 cursor-pointer"
        onClick={handleUploadClick}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">
          Drag and drop your photo here
        </p>
        <p className="text-xs text-muted-foreground">or click to browse</p>
      </div>

      {/* Crop Modal */}
      <Modal
        open={showCropModal}
        onClose={() => {
          setShowCropModal(false);
          setSelectedFile(null);
          setPreview(null);
        }}
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
                onCropAreaChange={setCroppedAreaPixels}
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
              onClick={() => {
                setShowCropModal(false);
                setSelectedFile(null);
                setPreview(null);
              }}
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
