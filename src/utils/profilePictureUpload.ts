/**
 * Profile Picture Upload Utility
 * Handles avatar/profile image upload to Firebase Storage
 */

import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface ProfilePictureUploadOptions {
  userId: string;
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
}

export const PROFILE_PICTURE_DEFAULTS = {
  MAX_SIZE_MB: 5,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  STORAGE_PATH: (userId: string) => `profile-pictures/${userId}`,
};

/**
 * Validates the uploaded file
 */
export function validateProfilePicture(
  file: File,
  options: ProfilePictureUploadOptions
): { valid: boolean; error?: string } {
  const maxSize = (options.maxSizeMB || PROFILE_PICTURE_DEFAULTS.MAX_SIZE_MB) * 1024 * 1024;
  const allowedTypes = options.allowedMimeTypes || PROFILE_PICTURE_DEFAULTS.ALLOWED_MIME_TYPES;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${options.maxSizeMB || PROFILE_PICTURE_DEFAULTS.MAX_SIZE_MB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Uploads profile picture to Firebase Storage
 * Returns download URL
 */
export async function uploadProfilePicture(
  file: File,
  options: ProfilePictureUploadOptions
): Promise<{ url: string; path: string }> {
  // Validate file
  const validation = validateProfilePicture(file, options);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  try {
    // Create storage reference
    const storagePath = PROFILE_PICTURE_DEFAULTS.STORAGE_PATH(options.userId);
    const fileRef = ref(storage, `${storagePath}/avatar`);

    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        userId: options.userId,
      },
    };

    await uploadBytes(fileRef, file, metadata);

    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);

    return {
      url: downloadURL,
      path: storagePath,
    };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Failed to upload profile picture. Please try again.');
  }
}

/**
 * Deletes existing profile picture from Firebase Storage
 */
export async function deleteProfilePicture(userId: string): Promise<void> {
  try {
    const storagePath = PROFILE_PICTURE_DEFAULTS.STORAGE_PATH(userId);
    const fileRef = ref(storage, `${storagePath}/avatar`);
    await deleteObject(fileRef);
  } catch (error: any) {
    // File might not exist, which is okay
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting profile picture:', error);
      throw error;
    }
  }
}

/**
 * Generates avatar URL fallback (gravatar or initials-based)
 */
export function generateAvatarFallback(
  name: string,
  role: string
): { bgColor: string; initials: string } {
  // Extract initials
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Color based on role
  const roleColors: Record<string, string> = {
    ADMIN: 'bg-gradient-to-br from-red-400 to-red-600',
    CLINIC_MANAGER: 'bg-gradient-to-br from-purple-400 to-purple-600',
    CLINICIAN: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    PATIENT: 'bg-gradient-to-br from-blue-400 to-blue-600',
  };

  return {
    initials,
    bgColor: roleColors[role] || 'bg-gradient-to-br from-gray-400 to-gray-600',
  };
}
