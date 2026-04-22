/**
 * ProfilePictureUploadSection Component
 * 
 * Handles profile picture display, upload, and removal
 * with drag-and-drop support and image preview
 */

import React, { useRef, useState } from 'react';
import { Upload, X, Loader, Camera } from 'lucide-react';
import { clsx } from 'clsx';
import { uploadProfilePicture, deleteProfilePicture, generateAvatarFallback } from '../utils/profilePictureUpload';
import type { UserRole } from '../types';

interface ProfilePictureUploadSectionProps {
  userId: string;
  currentPhotoURL?: string;
  userName: string;
  userRole: UserRole;
  onPhotoUpdate: (photoURL: string) => Promise<void>;
  editable?: boolean;
}

interface UploadState {
  loading: boolean;
  error: string | null;
  dragActive: boolean;
  preview: string | null;
}

export const ProfilePictureUploadSection: React.FC<ProfilePictureUploadSectionProps> = ({
  userId,
  currentPhotoURL,
  userName,
  userRole,
  onPhotoUpdate,
  editable = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<UploadState>({
    loading: false,
    error: null,
    dragActive: false,
    preview: currentPhotoURL || null,
  });

  const { initials, bgColor } = generateAvatarFallback(userName, userRole);

  const handleUpload = async (file: File) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // If there's an existing photo, delete it first
      if (currentPhotoURL) {
        await deleteProfilePicture(userId);
      }

      // Upload new photo
      const { url } = await uploadProfilePicture(file, { userId });

      // Update preview and call callback
      setState((prev) => ({ ...prev, preview: url }));
      await onPhotoUpdate(url);

      // Success feedback
      setTimeout(() => {
        setState((prev) => ({ ...prev, loading: false }));
      }, 1000);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));

      // Clear error after 3 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, error: null }));
      }, 3000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setState((prev) => ({ ...prev, dragActive: true }));
    } else if (e.type === 'dragleave') {
      setState((prev) => ({ ...prev, dragActive: false }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setState((prev) => ({ ...prev, dragActive: false }));

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleRemove = async () => {
    if (!currentPhotoURL && !state.preview) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      await deleteProfilePicture(userId);
      setState((prev) => ({ ...prev, preview: null }));
      await onPhotoUpdate('');
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to remove photo',
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {state.preview ? (
            <img
              src={state.preview}
              alt={userName}
              className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div
              className={clsx(
                'h-24 w-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg',
                bgColor
              )}
            >
              {initials}
            </div>
          )}

          {editable && state.loading && (
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
              <Loader className="h-6 w-6 text-white animate-spin" />
            </div>
          )}

          {editable && !state.loading && (state.preview || currentPhotoURL) && (
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
              title="Remove photo"
              aria-label="Remove profile photo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Profile Photo
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {editable
              ? 'JPG, PNG, WebP or GIF. Max 5MB.'
              : 'Profile photo (not editable in current view)'}
          </p>

          {editable && (
            <div
              ref={dragRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={clsx(
                'border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all',
                state.dragActive
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
              )}
              onClick={() => !state.loading && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload profile photo"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !state.loading) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                disabled={state.loading}
                className="hidden"
                aria-hidden
              />

              <div className="flex items-center gap-2">
                {state.loading ? (
                  <>
                    <Loader className="h-5 w-5 text-emerald-600 animate-spin" />
                    <span className="text-sm font-medium text-emerald-600">
                      Uploading...
                    </span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Click or drag to upload
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-700 dark:text-red-200">{state.error}</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUploadSection;
