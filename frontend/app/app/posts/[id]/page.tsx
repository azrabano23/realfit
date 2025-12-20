'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Cookies from 'js-cookie';

interface Analysis {
  id: number;
  post_id: number;
  status: string;
  exercise_type: string | null;
  results_json: {
    rep_count: number | null;
    form_score: number;
    key_metrics: Record<string, any>;
    issues: Array<{
      severity: string;
      message: string;
      timestamp_s: number | null;
    }>;
  } | null;
  model_version: string | null;
}

interface Media {
  id: number;
  object_key: string;
  content_type: string;
}

interface Post {
  id: number;
  user_id: number;
  post_type: string;
  caption: string | null;
  created_at: string;
  user: {
    display_name: string;
  };
  media: Media[];
  analysis: Analysis | null;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadPost();
    
    // Poll for analysis updates if processing
    const interval = setInterval(() => {
      if (post?.analysis?.status === 'PROCESSING' || post?.analysis?.status === 'PENDING') {
        loadPost();
        setPolling(true);
      } else {
        setPolling(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [postId, router, post?.analysis?.status]);

  const loadPost = async () => {
    try {
      const response = await api.get(`/posts/${postId}`);
      setPost(response.data);

      if (response.data.media && response.data.media.length > 0) {
        // In production, get signed URL from backend
        setVideoUrl(null);
      }
    } catch (err) {
      console.error('Failed to load post', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <div className="text-xl text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <div className="text-xl">Post not found</div>
        </div>
      </div>
    );
  }

  const analysis = post.analysis;
  const results = analysis?.results_json;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/app" className="flex items-center gap-2">
              <span className="text-2xl">💪</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                RealFit
              </h1>
            </Link>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm border border-gray-700 rounded-lg hover:bg-gray-800 transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Post Header */}
          <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                  {post.user.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{post.user.display_name}</h2>
                  {post.post_type === 'REALFIT_MOMENT' && (
                    <span className="px-2 py-1 bg-gradient-to-r from-primary-900 to-primary-800 text-primary-300 text-xs rounded-full font-medium">
                      ⚡ RealFit Moment
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-400">
                {new Date(post.created_at).toLocaleString()}
              </span>
            </div>
            {post.caption && (
              <p className="text-gray-300 leading-relaxed">{post.caption}</p>
            )}
          </div>

          {/* Video Section */}
          {post.media && post.media.length > 0 && (
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 mb-6">
              <h3 className="text-xl font-semibold mb-4">Workout Video</h3>
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎥</div>
                    <p className="text-gray-400">Video: {post.media[0].object_key}</p>
                    <p className="text-sm text-gray-500 mt-2">Video playback will be available after backend setup</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis Section */}
          {analysis && (
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold">AI Analysis</h3>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    analysis.status === 'COMPLETE'
                      ? 'bg-green-900/50 text-green-300 border border-green-800'
                      : analysis.status === 'PROCESSING'
                      ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-800 animate-pulse'
                      : analysis.status === 'FAILED'
                      ? 'bg-red-900/50 text-red-300 border border-red-800'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}
                >
                  {analysis.status}
                  {polling && ' (updating...)'}
                </span>
              </div>

              {analysis.status === 'COMPLETE' && results && (
                <div className="space-y-6">
                  {/* Score Cards */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-primary-900/50 to-primary-800/30 p-6 rounded-xl border border-primary-800/50">
                      <div className="text-sm text-gray-400 mb-2">Form Score</div>
                      <div className="text-5xl font-bold text-primary-400 mb-2">
                        {results.form_score}
                        <span className="text-2xl text-gray-500">/100</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${results.form_score}%` }}
                        />
                      </div>
                    </div>
                    {results.rep_count !== null && (
                      <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 rounded-xl border border-green-800/50">
                        <div className="text-sm text-gray-400 mb-2">Reps Completed</div>
                        <div className="text-5xl font-bold text-green-400">
                          {results.rep_count}
                        </div>
                        <div className="text-sm text-gray-400 mt-2">repetitions detected</div>
                      </div>
                    )}
                  </div>

                  {/* Key Metrics */}
                  {results.key_metrics && Object.keys(results.key_metrics).length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Key Metrics</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(results.key_metrics).map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-gray-800/50 p-4 rounded-lg border border-gray-700"
                          >
                            <div className="text-sm text-gray-400 mb-1">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-xl font-bold text-white">
                              {typeof value === 'number' ? value.toFixed(2) : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {results.issues && results.issues.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Issues Detected</h4>
                      <div className="space-y-3">
                        {results.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${
                              issue.severity === 'high'
                                ? 'bg-red-900/30 border-red-800 text-red-200'
                                : issue.severity === 'med'
                                ? 'bg-yellow-900/30 border-yellow-800 text-yellow-200'
                                : 'bg-gray-800/50 border-gray-700 text-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl">
                                {issue.severity === 'high' ? '🔴' : issue.severity === 'med' ? '🟡' : '🔵'}
                              </span>
                              <div>
                                <div className="font-semibold mb-1">
                                  {issue.severity.toUpperCase()} Priority
                                </div>
                                <div>{issue.message}</div>
                                {issue.timestamp_s && (
                                  <div className="text-xs mt-2 opacity-75">
                                    At {issue.timestamp_s.toFixed(1)}s
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Coach Summary */}
                  <div className="bg-gradient-to-br from-primary-900/30 to-primary-800/20 p-6 rounded-xl border border-primary-800/50">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">🤖</span>
                      <h4 className="text-xl font-semibold">AI Coach Summary</h4>
                    </div>
                    <p className="text-gray-200 leading-relaxed">
                      {results.rep_count !== null
                        ? `You completed ${results.rep_count} rep${results.rep_count !== 1 ? 's' : ''} with a form score of ${results.form_score}/100. `
                        : `Your form score is ${results.form_score}/100. `}
                      {results.issues && results.issues.length > 0
                        ? `Focus on: ${results.issues.map((i) => i.message.toLowerCase()).join(', ')}. Keep practicing and you'll see improvement!`
                        : 'Excellent form! Your technique looks solid. Keep up the great work!'}
                    </p>
                  </div>
                </div>
              )}

              {analysis.status === 'PROCESSING' && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
                  <div className="text-xl font-medium mb-2">Analyzing your workout...</div>
                  <div className="text-gray-400">
                    Our AI is processing your video and detecting form metrics
                  </div>
                </div>
              )}

              {analysis.status === 'PENDING' && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⏳</div>
                  <div className="text-xl font-medium mb-2">Analysis queued</div>
                  <div className="text-gray-400">
                    Your video is in the queue and will be processed shortly
                  </div>
                </div>
              )}

              {analysis.status === 'FAILED' && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">❌</div>
                  <div className="text-xl font-medium mb-2">Analysis failed</div>
                  <div className="text-gray-400">
                    There was an error processing your video. Please try uploading again.
                  </div>
                </div>
              )}
            </div>
          )}

          {!analysis && (
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 text-center">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-xl font-medium mb-2">No analysis yet</div>
              <div className="text-gray-400">
                Upload a video and run analysis to see AI-powered form feedback
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
