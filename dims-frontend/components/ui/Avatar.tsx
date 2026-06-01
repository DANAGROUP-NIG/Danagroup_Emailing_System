import React, { useState } from 'react';
import { User } from '@/types/user.types';
import { useProfileStore } from '../../store/profileStore';
import Image from 'next/image';
import { getInitials } from '../layout/TopBar';
import { Camera } from 'lucide-react';

export function ProfileAvatarSetting( {initialUser}: {initialUser: User} ) {
  const [user, setUser] = useState(initialUser);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { uploadProfilePicture } = useProfileStore();


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const selectedFile = fileList[0];

    // Client-side quick validation (Optional but recommended)
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG/JPEG).');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage('');

      // 1. Call our upload service
      // const newImageUrl = await uploadDisplayPicture(selectedFile);

      const result = await uploadProfilePicture(selectedFile);
      const newImageUrl = result.avatarUrl; // Assuming the API returns the new image URL in this field
      

      // 2. Update local state to show the new DP instantly
      setUser((prevUser) => ({
        ...prevUser,
        avatarUrl: newImageUrl, // Assuming the API returns the new image URL in this field
      }));
      
      alert('Profile picture updated!');
    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h3>Change Display Picture</h3>
      
      {/* Avatar Container */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
       { user?.avatarUrl 
        ? <Image alt={`${user.firstName}'s profile`} src={user.avatarUrl} width={80} height={80} className="rounded-full"/> 
        : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dana-blue-600 text-2xl font-semibold text-white">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
        }

        {isUploading && (
          <div style={{ position: 'absolute', top: '40%', left: '30%', fontWeight: 'bold' }}>
            Uploading...
          </div>
        )}
      </div>

      {/* Hidden File Input styled by a standard Label Button */}
      <div style={{ marginTop: '15px' }}>
        <Camera>
          <label 
            htmlFor="dp-upload" 
            style={{
              backgroundColor: '#0070f3',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'inline-block'
            }}
          >
            {isUploading ? 'Processing...' : 'Choose New Photo'}
          </label>
          
          <input
            id="dp-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ display: 'none' }} // Hide the ugly default input
          />
        </Camera>
      </div>

      {errorMessage && <p style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</p>}
    </div>
  );
}
