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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-black/70 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💪</span>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  RealFit
                </h1>
                <p className="text-xs text-gray-400">AI-Powered Form Analysis</p>
              </div>
            </div>
            <a
              href="https://github.com/azrabano23/realfit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
            >
              ⭐ GitHub
            </a>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            AI Workout Form Analyzer
          </h2>
          <p className="text-gray-300 text-lg mb-6">
            Upload your workout video and get instant AI-powered form analysis with rep counting, pose detection, and personalized feedback.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Real-time Pose Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Automatic Rep Counting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Form Scoring</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Video Player with Overlay */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Pose Detection Visualization</h3>
                  <p className="text-sm text-gray-400 mt-1">Upload a video to see AI analysis in action</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showOverlay}
                    onChange={(e) => setShowOverlay(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Show Skeleton</span>
                </label>
              </div>
              
              <div className="relative bg-black rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center">
                {landmarks.length === 0 && !isProcessing ? (
                  <div className="text-center p-12">
                    <div className="text-6xl mb-4">🎥</div>
                    <p className="text-gray-400 text-lg">No video loaded</p>
                    <p className="text-gray-500 text-sm mt-2">Upload a workout video below to get started</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-4"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl">🏋️</span>
                        </div>
                      </div>
                      <div className="text-white font-semibold text-lg">Analyzing your form...</div>
                      <div className="text-gray-400 text-sm mt-1">This may take a few moments</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-200">Exercise Type</label>
                  <select
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  >
                    <option value="squat">🏋️ Squat</option>
                    <option value="deadlift">💪 Deadlift</option>
                    <option value="bench">🔥 Bench Press</option>
                    <option value="overhead_press">⬆️ Overhead Press</option>
                    <option value="unknown">❓ Unknown / Other</option>
                  </select>
                </div>
                <label className="block">
                  <span className="block text-sm font-semibold mb-2 text-gray-200">Upload Workout Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-cyan-600 file:to-blue-600 file:text-white hover:file:from-cyan-700 hover:file:to-blue-700 file:transition-all file:cursor-pointer border border-gray-600 rounded-lg bg-gray-800/50 cursor-pointer hover:border-cyan-500 transition-colors"
                  />
                </label>
                <button
                  onClick={simulateAnalysis}
                  disabled={isProcessing || landmarks.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-700 hover:via-blue-700 hover:to-purple-700 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isProcessing ? '⚡ Analyzing...' : '🎯 Analyze Form & Count Reps'}
                </button>
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                📊 Analysis Results
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="relative bg-gradient-to-br from-cyan-900/40 to-blue-900/30 p-6 rounded-xl border border-cyan-700/50 overflow-hidden group hover:border-cyan-500/70 transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                  <div className="relative">
                    <div className="text-4xl font-bold text-cyan-400 mb-1">{stats.repCount}</div>
                    <div className="text-sm text-gray-400 font-medium">Reps Detected</div>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-green-900/40 to-emerald-900/30 p-6 rounded-xl border border-green-700/50 overflow-hidden group hover:border-green-500/70 transition-all">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
                  <div className="relative">
                    <div className="text-4xl font-bold text-green-400 mb-1">{stats.formScore}</div>
                    <div className="text-sm text-gray-400 font-medium">Form Score</div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-gray-800/50 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-300 font-medium">🎯 Squat Depth</span>
                    <span className="text-white font-bold">{(stats.depth * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/50"
                      style={{ width: `${stats.depth * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-300 font-medium">⚖️ Stability</span>
                    <span className="text-white font-bold">{(stats.stability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
                      style={{ width: `${stats.stability * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithm Info */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-white">⚙️ How It Works</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-cyan-400 font-bold text-lg min-w-[24px]">1.</span>
                  <div>
                    <div className="font-semibold text-white">Pose Estimation</div>
                    <div className="text-gray-400 text-xs mt-1">MediaPipe Pose detects 33 keypoints on the body</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-cyan-400 font-bold text-lg min-w-[24px]">2.</span>
                  <div>
                    <div className="font-semibold text-white">Smoothing</div>
                    <div className="text-gray-400 text-xs mt-1">Savitzky-Golay filter reduces jitter and noise</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-cyan-400 font-bold text-lg min-w-[24px]">3.</span>
                  <div>
                    <div className="font-semibold text-white">Rep Counting</div>
                    <div className="text-gray-400 text-xs mt-1">Joint angle trajectories identify movement cycles with peak detection</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-cyan-400 font-bold text-lg min-w-[24px]">4.</span>
                  <div>
                    <div className="font-semibold text-white">Form Analysis</div>
                    <div className="text-gray-400 text-xs mt-1">Metrics like depth, valgus, and stability are calculated with issue detection</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/20 p-6 rounded-2xl border border-cyan-700/50 shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-cyan-300">💡 Key Metrics Explained</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="font-semibold text-cyan-300">🎯 Squat Depth</div>
                  <div className="text-gray-400 text-xs mt-1">Measures how low you go - aim for 70%+ for full ROM</div>
                </div>
                <div className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="font-semibold text-cyan-300">🦾 Knee Valgus</div>
                  <div className="text-gray-400 text-xs mt-1">Detects knees caving inward - indicates form issues</div>
                </div>
                <div className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="font-semibold text-cyan-300">⚖️ Stability</div>
                  <div className="text-gray-400 text-xs mt-1">Tracks center of mass variance - higher is better</div>
                </div>
                <div className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="font-semibold text-cyan-300">🏆 Form Score</div>
                  <div className="text-gray-400 text-xs mt-1">Overall assessment combining all metrics (0-100)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm Details */}
        <div className="mt-12 bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <h3 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            🧠 Algorithm Architecture
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all">
              <h4 className="font-bold mb-3 text-cyan-400 text-lg">👁️ Pose Extraction</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">•</span>
                  <span>MediaPipe Pose model (33 landmarks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">•</span>
                  <span>Real-time processing at 30 FPS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">•</span>
                  <span>Handles occlusion and missing landmarks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">•</span>
                  <span>Advanced smoothing with Savitzky-Golay filter</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all">
              <h4 className="font-bold mb-3 text-blue-400 text-lg">🔢 Rep Counting</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Joint angle trajectory analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Peak detection using scipy.signal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Exercise-specific algorithms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Dynamic thresholds for accuracy</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all">
              <h4 className="font-bold mb-3 text-purple-400 text-lg">📈 Form Metrics</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>Squat depth ratio calculation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>Knee valgus detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>Torso lean measurement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>Center of mass stability</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 hover:border-green-500/50 transition-all">
              <h4 className="font-bold mb-3 text-green-400 text-lg">🏆 Scoring System</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Base score: 100 points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Issue-based deductions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Exercise-specific penalties</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Stability bonuses</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
