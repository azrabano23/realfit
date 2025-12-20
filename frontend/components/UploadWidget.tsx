'use client';

import { useState, useRef } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface UploadWidgetProps {
  onClose: () => void;
}

export default function UploadWidget({ onClose }: UploadWidgetProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [exerciseType, setExerciseType] = useState('unknown');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      // 1. Get presigned URL
      setProgress(10);
      const presignResponse = await api.post('/uploads/presign');
      const { presigned_url, object_key } = presignResponse.data;

      // 2. Upload video to S3/MinIO
      setProgress(30);
      const uploadResponse = await fetch(presigned_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'video/mp4',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setProgress(50);

      // 3. Create post
      const postResponse = await api.post('/posts', {
        post_type: 'REALFIT_MOMENT',
        caption: caption || null,
      });

      const postId = postResponse.data.id;
      setProgress(70);

      // 4. Attach video to post
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const duration = Math.floor(video.duration);
      await api.post(`/uploads/posts/${postId}/attach-video`, {
        object_key,
        duration_s: duration,
        fps: 30,
      });

      setProgress(85);

      // 5. Enqueue analysis
      await api.post(`/analysis/enqueue`, {
        post_id: parseInt(postId),
        exercise_type: exerciseType,
      });

      setProgress(100);

      // Navigate to post detail
      setTimeout(() => {
        router.push(`/app/posts/${postId}`);
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm p-6 rounded-xl border border-gray-800 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold">Upload Workout</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition text-2xl"
          disabled={uploading}
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-4 border border-red-800">
          {error}
        </div>
      )}

      {uploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Uploading...</span>
            <span className="text-white font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Video File</label>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 disabled:opacity-50"
            />
          </div>
          {file && (
            <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎥</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{file.name}</div>
                  <div className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Exercise Type</label>
          <select
            value={exerciseType}
            onChange={(e) => setExerciseType(e.target.value)}
            disabled={uploading}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500 disabled:opacity-50"
          >
            <option value="unknown">Unknown / General</option>
            <option value="squat">Squat</option>
            <option value="deadlift">Deadlift</option>
            <option value="bench">Bench Press</option>
            <option value="overhead_press">Overhead Press</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Caption (optional)</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            disabled={uploading}
            placeholder="Share your thoughts about this workout..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500 disabled:opacity-50 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Uploading & Analyzing...
              </span>
            ) : (
              '📤 Upload & Analyze'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
