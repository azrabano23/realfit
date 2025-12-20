'use client';

interface StatsCardProps {
  stats: {
    follower_count: number;
    following_count: number;
    post_count: number;
  };
}

export default function StatsCard({ stats }: StatsCardProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
      <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-400">{stats.post_count}</div>
          <div className="text-sm text-gray-400 mt-1">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-400">{stats.follower_count}</div>
          <div className="text-sm text-gray-400 mt-1">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-400">{stats.following_count}</div>
          <div className="text-sm text-gray-400 mt-1">Following</div>
        </div>
      </div>
    </div>
  );
}


