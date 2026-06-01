import React, { useState } from 'react';
import { User } from '@/types/user.types';
import { useProfileStore } from '../../store/profileStore';
import Image from 'next/image';
import { getInitials } from '../layout/TopBar';
import { Camera, Loader2 } from 'lucide-react'; // Added Loader2 for a better loading state

export function ProfileAvatarSetting({ initialUser }: { initialUser: User }) {
  const [user, setUser] = useState(initialUser);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { changeDP } = useProfileStore();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const selectedFile = fileList[0];

    if (!selectedFile.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG/JPEG).');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage('');

      const result = await changeDP(selectedFile);
      
      console.log('Upload result:', result);
      
      // Adapt key based on your store's precise API response structure
      const newImageUrl = result?.avatarUrl; 

      if (!newImageUrl) {
        throw new Error('Failed to retrieve image URL from upload response.');
      }

      setUser((prevUser) => ({
        ...prevUser,
        avatarUrl: newImageUrl,
      }));
      
    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Avatar Wrapper Container */}
      <div className="relative inline-block group">
        
        {/* Profile Image State */}
        <div className={`relative h-20 w-20 overflow-hidden rounded-full ${isUploading ? 'opacity-50' : 'opacity-100'}`}>
          {user?.avatarUrl ? (
            <Image 
              alt={`${user.firstName || 'User'}'s profile`} 
              src={user.avatarUrl} 
              fill // Use fill for flexible, clean wrapper sizing
              sizes="80px"
              className="rounded-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-dana-blue-600 text-2xl font-semibold text-white">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Floating Upload Trigger Button */}
        <label 
          htmlFor="dp-upload" 
          className={`absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-700 shadow-md transition-colors hover:bg-gray-300 ${
            isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
          title="Change profile picture"
        >
          <Camera className="h-4 w-4" />
          <input
            id="dp-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden" // Native clean Tailwind hiding class
          />
        </label>
      </div>

      {/* Dynamic Error Indicator */}
      {errorMessage && (
        <p className="mt-2 text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-md">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
