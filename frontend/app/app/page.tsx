'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import PromptCard from '@/components/PromptCard';
import Feed from '@/components/Feed';
import UploadWidget from '@/components/UploadWidget';
import StatsCard from '@/components/StatsCard';

interface Prompt {
  id: number;
  prompt_time_utc: string;
  expires_time_utc: string;
  has_posted: boolean;
}

interface UserStats {
  follower_count: number;
  following_count: number;
  post_count: number;
}

export default function AppPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [promptsRes, userRes] = await Promise.all([
        api.get('/prompts/today'),
        api.get('/me'),
      ]);
      setPrompts(promptsRes.data);
      setCurrentUser(userRes.data);
      
      // Get user stats
      const statsRes = await api.get(`/users/${userRes.data.id}`);
      setUserStats({
        follower_count: statsRes.data.follower_count || 0,
        following_count: statsRes.data.following_count || 0,
        post_count: statsRes.data.post_count || 0,
      });
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    router.push('/');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/app" className="flex items-center gap-2">
              <span className="text-2xl">💪</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                RealFit
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/app/demo"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
              >
                🎥 CV Demo
              </Link>
              <Link
                href="/app/profile"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm border border-gray-700 rounded-lg hover:bg-gray-800 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {currentUser?.display_name || 'User'}! 👋
          </h2>
          <p className="text-gray-400">Ready for your RealFit moment?</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <PromptCard prompts={prompts} onPost={() => setShowUpload(true)} />
            
            {userStats && (
              <StatsCard stats={userStats} />
            )}

            {showUpload && (
              <div className="animate-fadeIn">
                <UploadWidget onClose={() => setShowUpload(false)} />
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/app/demo"
                  className="block w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg font-medium transition text-center"
                >
                  🎬 Try CV Demo
                </Link>
                <button
                  onClick={() => setShowUpload(true)}
                  className="block w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
                >
                  📤 Upload Workout
                </button>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            <Feed />
          </div>
        </div>
      </div>
    </div>
  );
}
