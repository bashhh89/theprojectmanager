'use client';

import { useEffect, useState } from 'react';
import { useContent } from '@/hooks/useContent';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Clock, ThumbsUp, Share2, Eye } from 'lucide-react';

interface ContentAnalyticsProps {
  contentId: string;
}

interface AnalyticsData {
  views: number;
  uniqueVisitors: number;
  averageTimeOnPage: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  traffic: {
    direct: number;
    social: number;
    search: number;
    referral: number;
  };
  topReferrers: Array<{
    source: string;
    count: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
}

export function ContentAnalytics({ contentId }: ContentAnalyticsProps) {
  const { getContent } = useContent();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [contentId, timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const content = await getContent(contentId);
      // In a real app, this would come from an analytics API
      // For now, we'll use mock data
      setAnalytics({
        views: 1234,
        uniqueVisitors: 890,
        averageTimeOnPage: 3.5,
        engagement: {
          likes: 45,
          shares: 23,
          comments: 12
        },
        traffic: {
          direct: 500,
          social: 300,
          search: 300,
          referral: 134
        },
        topReferrers: [
          { source: 'Google', count: 150 },
          { source: 'Twitter', count: 100 },
          { source: 'LinkedIn', count: 50 }
        ],
        topKeywords: [
          { keyword: 'content marketing', count: 45 },
          { keyword: 'digital strategy', count: 30 },
          { keyword: 'brand awareness', count: 25 }
        ]
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Views</p>
              <p className="text-2xl font-bold">{analytics.views}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Unique Visitors</p>
              <p className="text-2xl font-bold">{analytics.uniqueVisitors}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Avg. Time on Page</p>
              <p className="text-2xl font-bold">{analytics.averageTimeOnPage}m</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <ThumbsUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Engagement Rate</p>
              <p className="text-2xl font-bold">
                {((analytics.engagement.likes + analytics.engagement.shares) / analytics.views * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Traffic Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-zinc-400">Direct</p>
            <p className="text-2xl font-bold">{analytics.traffic.direct}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Social</p>
            <p className="text-2xl font-bold">{analytics.traffic.social}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Search</p>
            <p className="text-2xl font-bold">{analytics.traffic.search}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Referral</p>
            <p className="text-2xl font-bold">{analytics.traffic.referral}</p>
          </div>
        </div>
      </Card>

      {/* Engagement Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Engagement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-zinc-400">Likes</p>
            <p className="text-2xl font-bold">{analytics.engagement.likes}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Shares</p>
            <p className="text-2xl font-bold">{analytics.engagement.shares}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Comments</p>
            <p className="text-2xl font-bold">{analytics.engagement.comments}</p>
          </div>
        </div>
      </Card>

      {/* Top Referrers */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Top Referrers</h3>
        <div className="space-y-4">
          {analytics.topReferrers.map((referrer) => (
            <div key={referrer.source} className="flex items-center justify-between">
              <span>{referrer.source}</span>
              <span className="font-medium">{referrer.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Keywords */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Top Keywords</h3>
        <div className="space-y-4">
          {analytics.topKeywords.map((keyword) => (
            <div key={keyword.keyword} className="flex items-center justify-between">
              <span>{keyword.keyword}</span>
              <span className="font-medium">{keyword.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 