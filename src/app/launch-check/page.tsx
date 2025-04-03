'use client';

import { useEffect, useState } from 'react';
import { checkLaunchReadiness } from '@/utils/launchReadiness';
import dynamic from 'next/dynamic';

// Dynamically import icons with proper typing
const AlertCircle = dynamic(() => import('lucide-react').then(mod => mod.AlertCircle), { ssr: false });
const CheckCircle = dynamic(() => import('lucide-react').then(mod => mod.CheckCircle), { ssr: false });
const Clock = dynamic(() => import('lucide-react').then(mod => mod.Clock), { ssr: false });
const XCircle = dynamic(() => import('lucide-react').then(mod => mod.XCircle), { ssr: false });

interface ReadinessData {
  features: Array<{
    name: string;
    status: 'ready' | 'in-progress' | 'not-started' | 'error';
    details?: string;
  }>;
  systemHealth: {
    cpu: number;
    memory: number;
    responseTime: number;
  };
  isReadyToLaunch: boolean;
  criticalIssues: string[];
}

export default function LaunchCheck() {
  const [readinessData, setReadinessData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const data = await checkLaunchReadiness();
        setReadinessData(data);
      } catch (error) {
        console.error('Failed to check launch readiness:', error);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, []);

  if (loading || !readinessData) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    const iconProps = { className: "w-5 h-5" };
    switch (status) {
      case 'ready':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle {...iconProps} className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle {...iconProps} className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthStatus = (value: number) => {
    if (value < 50) return 'text-green-500';
    if (value < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Launch Readiness Check</h1>
          <div className={`px-4 py-2 rounded-full ${readinessData.isReadyToLaunch ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {readinessData.isReadyToLaunch ? 'Ready to Launch! 🚀' : 'Not Ready Yet ⚠️'}
          </div>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="text-sm text-zinc-400 mb-2">CPU Usage</h3>
            <p className={`text-2xl font-bold ${getHealthStatus(readinessData.systemHealth.cpu)}`}>
              {readinessData.systemHealth.cpu}%
            </p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="text-sm text-zinc-400 mb-2">Memory Usage</h3>
            <p className={`text-2xl font-bold ${getHealthStatus(readinessData.systemHealth.memory)}`}>
              {readinessData.systemHealth.memory}%
            </p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="text-sm text-zinc-400 mb-2">Response Time</h3>
            <p className={`text-2xl font-bold ${getHealthStatus(readinessData.systemHealth.responseTime / 2)}`}>
              {readinessData.systemHealth.responseTime}ms
            </p>
          </div>
        </div>

        {/* Critical Issues */}
        {readinessData.criticalIssues.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-red-400">Critical Issues</h2>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <ul className="space-y-2">
                {readinessData.criticalIssues.map((issue: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Feature Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Core Features */}
          <div className="bg-zinc-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Core Features</h2>
            <div className="space-y-4">
              {readinessData.features
                .filter((f) => !f.name.startsWith('UI:') && !f.name.startsWith('Database:'))
                .map((feature, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(feature.status)}
                      <span>{feature.name}</span>
                    </div>
                    <span className="text-sm text-zinc-400">{feature.details}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* UI Components */}
          <div className="bg-zinc-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">UI Components</h2>
            <div className="space-y-4">
              {readinessData.features
                .filter((f) => f.name.startsWith('UI:'))
                .map((feature, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(feature.status)}
                      <span>{feature.name.replace('UI: ', '')}</span>
                    </div>
                    <span className="text-sm text-zinc-400">{feature.details}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-zinc-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Database Status</h2>
            <div className="space-y-4">
              {readinessData.features
                .filter((f) => f.name.startsWith('Database:'))
                .map((feature, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(feature.status)}
                      <span>{feature.name.replace('Database: ', '')}</span>
                    </div>
                    <span className="text-sm text-zinc-400">{feature.details}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Launch Checklist */}
          <div className="bg-zinc-800/50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Launch Checklist</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(readinessData.isReadyToLaunch ? 'ready' : 'error')}
                  <span>All Systems Go</span>
                </div>
                <span className="text-sm text-zinc-400">
                  {readinessData.isReadyToLaunch ? 'Ready to launch' : 'Issues need attention'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(readinessData.systemHealth.responseTime < 200 ? 'ready' : 'error')}
                  <span>Performance Check</span>
                </div>
                <span className="text-sm text-zinc-400">
                  {readinessData.systemHealth.responseTime}ms response time
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(readinessData.criticalIssues.length === 0 ? 'ready' : 'error')}
                  <span>No Critical Issues</span>
                </div>
                <span className="text-sm text-zinc-400">
                  {readinessData.criticalIssues.length} issues found
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 