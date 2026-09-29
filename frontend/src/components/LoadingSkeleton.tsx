import React from 'react';

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse border border-slate-800">
      <div className="h-48 bg-slate-800/60" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-slate-800/80 rounded" />
          <div className="h-4 w-16 bg-slate-800/80 rounded" />
        </div>
        <div className="h-6 w-3/4 bg-slate-800 rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-800/50 rounded" />
          <div className="h-3 w-5/6 bg-slate-800/50 rounded" />
        </div>
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="h-4 w-24 bg-slate-800/60 rounded" />
          <div className="h-4 w-16 bg-slate-800/60 rounded" />
        </div>
      </div>
    </div>
  );
};

export const PostDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-8">
      <div className="h-6 w-24 bg-slate-800 rounded" />
      <div className="h-10 w-4/5 bg-slate-800 rounded" />
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-800" />
        <div className="space-y-2">
          <div className="h-4 w-28 bg-slate-800 rounded" />
          <div className="h-3 w-20 bg-slate-800/70 rounded" />
        </div>
      </div>
      <div className="h-80 w-full rounded-2xl bg-slate-800" />
      <div className="space-y-4 pt-4">
        <div className="h-4 w-full bg-slate-800/60 rounded" />
        <div className="h-4 w-full bg-slate-800/60 rounded" />
        <div className="h-4 w-3/4 bg-slate-800/60 rounded" />
      </div>
    </div>
  );
};
