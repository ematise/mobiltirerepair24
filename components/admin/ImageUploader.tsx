'use client';

import { useState, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  businessSlug?: string;
}

export default function ImageUploader({ photos, onPhotosChange, businessSlug }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);
    setUploadError('');

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed');
        setUploading(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        setUploading(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (businessSlug) {
          formData.append('businessSlug', businessSlug);
        }

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
        setUploading(false);
        return;
      }
    }

    // Add all uploaded URLs at once
    if (uploadedUrls.length > 0) {
      onPhotosChange([...photos, ...uploadedUrls]);
    }

    setUploading(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleRemovePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
          id="photo-upload"
        />
        <label
          htmlFor="photo-upload"
          className="block cursor-pointer"
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-2"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-8-8v8m0 0l-3-3m3 3l3-3m-11 11a4 4 0 11-8 0 4 4 0 018 0z"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-gray-700 font-medium">
            {uploading ? 'Uploading...' : 'Drag photos here or click to select'}
          </p>
          <p className="text-gray-500 text-sm mt-1">PNG, JPG, WebP up to 5MB</p>
        </label>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {uploadError}
        </div>
      )}

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Uploaded Photos ({photos.length})</h4>
          <div className="grid grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">{photo.split('/').pop()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
