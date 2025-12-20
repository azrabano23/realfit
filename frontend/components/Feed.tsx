'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Post {
  id: number;
  user_id: number;
  post_type: string;
  caption: string | null;
  created_at: string;
  user: {
    id: number;
    display_name: string;
    email: string;
  };
  reaction_count: number;
  user_reaction: string | null;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
    // Refresh feed every 30 seconds
    const interval = setInterval(loadFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFeed = async () => {
    try {
      const response = await api.get('/posts/feed');
      setPosts(response.data.posts);
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId: number) => {
    try {
      await api.post(`/posts/${postId}/react`, { type: 'LIKE' });
      loadFeed();
    } catch (err) {
      console.error('Failed to react', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">Feed</h2>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading feed...</div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">Feed</h2>
        <div className="text-center py-12 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-400 text-lg">No posts yet</p>
          <p className="text-gray-500 text-sm mt-2">Be the first to share your RealFit moment!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Feed</h2>
        <button
          onClick={loadFeed}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          🔄 Refresh
        </button>
      </div>
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                {post.user.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <Link
                  href={`/app/posts/${post.id}`}
                  className="font-semibold hover:text-primary-400 transition"
                >
                  {post.user.display_name}
                </Link>
                {post.post_type === 'REALFIT_MOMENT' && (
                  <span className="ml-2 px-2 py-1 bg-gradient-to-r from-primary-900 to-primary-800 text-primary-300 text-xs rounded-full font-medium">
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
            <p className="mb-4 text-gray-300 leading-relaxed">{post.caption}</p>
          )}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
            <button
              onClick={() => handleReaction(post.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition transform hover:scale-105 ${
                post.user_reaction
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{post.user_reaction ? '❤️' : '🤍'}</span>
              <span className="font-medium">{post.reaction_count}</span>
            </button>
            <Link
              href={`/app/posts/${post.id}`}
              className="px-4 py-2 text-primary-400 hover:text-primary-300 font-medium transition"
            >
              View Details →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
