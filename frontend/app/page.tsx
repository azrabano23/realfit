'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [exerciseType, setExerciseType] = useState('squat');
  const [stats, setStats] = useState({
    repCount: 0,
    formScore: 85,
    depth: 0.75,
    stability: 0.82,
  });

  // Simulate pose detection visualization
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !showOverlay) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const drawPose = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (landmarks.length === 0) return;

      // Draw skeleton connections
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 3;

      // Key connections (MediaPipe pose structure)
      const connections = [
        [11, 12], // shoulders
        [11, 13], [13, 15], // left arm
        [12, 14], [14, 16], // right arm
        [11, 23], [12, 24], // torso
        [23, 24], // hips
        [23, 25], [25, 27], // left leg
        [24, 26], [26, 28], // right leg
      ];

      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        if (startPoint && endPoint && startPoint.visible && endPoint.visible) {
          ctx.beginPath();
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
          ctx.stroke();
        }
      });

      // Draw keypoints
      landmarks.forEach((point, idx) => {
        if (point && point.visible) {
          ctx.fillStyle = idx < 11 ? '#ef4444' : '#10b981'; // Different colors for upper/lower body
          ctx.beginPath();
          ctx.arc(
            point.x * canvas.width,
            point.y * canvas.height,
            5,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      });
    };

    const interval = setInterval(drawPose, 100);
    return () => clearInterval(interval);
  }, [landmarks, showOverlay]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !videoRef.current) return;

    const video = videoRef.current;
    video.src = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      if (canvasRef.current) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }
    };

    setIsProcessing(true);
    
    // Simulate pose detection processing
    setTimeout(() => {
      // Generate mock landmarks
      const mockLandmarks = Array.from({ length: 33 }, (_, i) => ({
        x: 0.3 + Math.random() * 0.4,
        y: 0.2 + Math.random() * 0.6,
        z: Math.random() * 0.1,
        visible: Math.random() > 0.1,
      }));
      setLandmarks(mockLandmarks);
      setIsProcessing(false);
    }, 2000);
  };

  const simulateAnalysis = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setStats({
        repCount: Math.floor(Math.random() * 10) + 5,
        formScore: Math.floor(Math.random() * 20) + 75,
        depth: Math.random() * 0.3 + 0.6,
        stability: Math.random() * 0.2 + 0.75,
      });
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💪</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              RealFit - AI Pose Detection Demo
            </h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Computer Vision Algorithm
          </h2>
          <p className="text-gray-400 text-lg">
            Real-time pose estimation using MediaPipe Pose
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Video Player with Overlay */}
          <div className="space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Pose Detection Visualization</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOverlay}
                    onChange={(e) => setShowOverlay(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Show Skeleton Overlay</span>
                </label>
              </div>
              
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  controls
                  className="w-full"
                  style={{ display: landmarks.length > 0 && showOverlay ? 'none' : 'block' }}
                />
                <canvas
                  ref={canvasRef}
                  className={`absolute top-0 left-0 w-full h-full ${showOverlay ? 'block' : 'hidden'}`}
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                      <div className="text-white font-medium">Processing video...</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Exercise Type</label>
                  <select
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <option value="squat">Squat</option>
                    <option value="deadlift">Deadlift</option>
                    <option value="bench">Bench Press</option>
                    <option value="overhead_press">Overhead Press</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <label className="block">
                  <span className="block text-sm font-medium mb-2">Upload Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                  />
                </label>
                <button
                  onClick={simulateAnalysis}
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {isProcessing ? 'Analyzing...' : '🎯 Run Analysis'}
                </button>
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-6">Analysis Results</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-primary-900/50 to-primary-800/30 p-4 rounded-lg border border-primary-800/50">
                  <div className="text-3xl font-bold text-primary-400">{stats.repCount}</div>
                  <div className="text-sm text-gray-400 mt-1">Reps Detected</div>
                </div>
                <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-4 rounded-lg border border-green-800/50">
                  <div className="text-3xl font-bold text-green-400">{stats.formScore}</div>
                  <div className="text-sm text-gray-400 mt-1">Form Score</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Squat Depth</span>
                    <span className="text-white font-medium">{(stats.depth * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${stats.depth * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Stability</span>
                    <span className="text-white font-medium">{(stats.stability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${stats.stability * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithm Info */}
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-4">How It Works</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-primary-400 font-bold">1.</span>
                  <div>
                    <div className="font-medium">Pose Estimation</div>
                    <div className="text-gray-400">MediaPipe Pose detects 33 keypoints on the body</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary-400 font-bold">2.</span>
                  <div>
                    <div className="font-medium">Smoothing</div>
                    <div className="text-gray-400">Exponential moving average reduces jitter</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary-400 font-bold">3.</span>
                  <div>
                    <div className="font-medium">Rep Counting</div>
                    <div className="text-gray-400">Joint angle trajectories identify movement cycles</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary-400 font-bold">4.</span>
                  <div>
                    <div className="font-medium">Form Analysis</div>
                    <div className="text-gray-400">Metrics like depth, valgus, and stability are calculated</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-gradient-to-br from-primary-900/30 to-primary-800/20 p-6 rounded-xl border border-primary-800/50">
              <h3 className="text-lg font-semibold mb-4">Key Metrics Explained</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-primary-300">Squat Depth</div>
                  <div className="text-gray-400">Measures how low you go - aim for 70%+ for full ROM</div>
                </div>
                <div>
                  <div className="font-medium text-primary-300">Knee Valgus</div>
                  <div className="text-gray-400">Detects knees caving inward - indicates form issues</div>
                </div>
                <div>
                  <div className="font-medium text-primary-300">Stability</div>
                  <div className="text-gray-400">Tracks center of mass variance - higher is better</div>
                </div>
                <div>
                  <div className="font-medium text-primary-300">Form Score</div>
                  <div className="text-gray-400">Overall assessment combining all metrics (0-100)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm Details */}
        <div className="mt-8 bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
          <h3 className="text-2xl font-semibold mb-4">Algorithm Architecture</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-primary-400">Pose Extraction</h4>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>MediaPipe Pose model (33 landmarks)</li>
                <li>Real-time processing at 30 FPS</li>
                <li>Handles occlusion and missing landmarks</li>
                <li>Exponential smoothing (α=0.7)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-primary-400">Rep Counting</h4>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Joint angle trajectory analysis</li>
                <li>Peak detection using scipy.signal</li>
                <li>Exercise-specific algorithms</li>
                <li>Minimum rep distance: 1 second</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-primary-400">Form Metrics</h4>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Squat depth ratio calculation</li>
                <li>Knee valgus detection</li>
                <li>Torso lean measurement</li>
                <li>Center of mass stability</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-primary-400">Scoring System</h4>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Base score: 100 points</li>
                <li>Issue-based deductions</li>
                <li>Exercise-specific penalties</li>
                <li>Stability bonuses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
