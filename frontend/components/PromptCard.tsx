'use client';

import { useState, useEffect } from 'react';

interface Prompt {
  id: number;
  prompt_time_utc: string;
  expires_time_utc: string;
  has_posted: boolean;
}

interface PromptCardProps {
  prompts: Prompt[];
  onPost: () => void;
}

export default function PromptCard({ prompts, onPost }: PromptCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (prompts.length === 0) return;

    const updateTimer = () => {
      const now = new Date();
      const activePrompt = prompts.find(
        (p) =>
          new Date(p.prompt_time_utc) <= now &&
          new Date(p.expires_time_utc) >= now &&
          !p.has_posted
      );

      if (activePrompt) {
        setIsActive(true);
        setPulse(true);
        const expires = new Date(activePrompt.expires_time_utc);
        const diff = expires.getTime() - now.getTime();

        if (diff > 0) {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeRemaining('Expired');
          setIsActive(false);
          setPulse(false);
        }
      } else {
        setIsActive(false);
        setPulse(false);
        const nextPrompt = prompts.find((p) => new Date(p.prompt_time_utc) > now && !p.has_posted);
        if (nextPrompt) {
          const nextTime = new Date(nextPrompt.prompt_time_utc);
          const diff = nextTime.getTime() - now.getTime();
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`Next: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeRemaining('No prompts today');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [prompts]);

  if (prompts.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">⏰</div>
          <h2 className="text-xl font-semibold">RealFit Time</h2>
        </div>
        <p className="text-gray-400">No prompts scheduled for today.</p>
      </div>
    );
  }

  const hasPosted = prompts.some((p) => p.has_posted);

  return (
    <div className={`bg-gradient-to-br ${isActive ? 'from-primary-900/30 to-primary-800/20' : 'from-gray-900/50 to-gray-800/30'} backdrop-blur-sm p-6 rounded-xl border ${isActive ? 'border-primary-500/50' : 'border-gray-800'} transition-all duration-300 ${pulse ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`text-3xl ${isActive ? 'animate-bounce' : ''}`}>⏰</div>
        <h2 className="text-xl font-semibold">RealFit Time</h2>
      </div>
      {hasPosted ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-2xl">✓</span>
            <span className="font-medium">You've posted today!</span>
          </div>
          <div className="text-sm text-gray-400">
            Great job staying consistent! 🎉
          </div>
        </div>
      ) : (
        <>
          <div className={`text-4xl font-bold mb-4 font-mono ${isActive ? 'text-primary-400 animate-pulse' : 'text-gray-400'}`}>
            {timeRemaining}
          </div>
          {isActive && (
            <button
              onClick={onPost}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg shadow-primary-500/50"
            >
              🎬 Post Your RealFit Moment
            </button>
          )}
          {!isActive && (
            <div className="text-sm text-gray-400 mt-4">
              Wait for your prompt time to post
            </div>
          )}
        </>
      )}
      <div className="mt-6 pt-4 border-t border-gray-800 text-sm text-gray-400">
        {prompts.length} prompt{prompts.length !== 1 ? 's' : ''} scheduled today
      </div>
    </div>
  );
}
