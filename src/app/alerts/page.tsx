"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { getAuthToken } from '@/lib/auth-token';
import { Bell, Plus, ArrowLeft, Loader2, Play, Pause, Trash2, Clock, Search } from 'lucide-react';
import Link from 'next/link';

interface Alert {
  id: string;
  name: string;
  type: 'property' | 'product';
  sources: string[];
  isActive: boolean;
  checkFrequency: string;
  lastChecked?: string;
  lastMatchCount: number;
  createdAt: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  '591': '591 Rent',
  'momo': 'Momo',
  'pchome': 'PChome',
  'amazon': 'Amazon',
  'shopee': 'Shopee',
  'custom': 'Custom',
};

const PLATFORM_COLORS: Record<string, string> = {
  '591': 'bg-blue-100 text-blue-700',
  'momo': 'bg-red-100 text-red-700',
  'pchome': 'bg-orange-100 text-orange-700',
  'amazon': 'bg-yellow-100 text-yellow-700',
  'shopee': 'bg-orange-100 text-orange-600',
  'custom': 'bg-slate-100 text-slate-600',
};

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAlert = async (e: React.MouseEvent, id: string, isActive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    const token = getAuthToken();
    try {
      await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a));
    } catch {
      console.error('Failed to toggle alert');
    }
  };

  const deleteAlert = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this alert? This cannot be undone.')) return;
    const token = getAuthToken();
    try {
      await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {
      console.error('Failed to delete alert');
    }
  };

  const formatFrequency = (freq: string) => {
    const map: Record<string, string> = {
      '5min': 'Every 5 min',
      '15min': 'Every 15 min',
      '30min': 'Every 30 min',
      '1hour': 'Hourly',
      'daily': 'Daily',
    };
    return map[freq] || freq;
  };

  const formatRelative = (dateStr?: string) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-2">
                <Bell className="h-6 w-6 text-indigo-600" />
                <span className="text-xl font-bold text-slate-900">My Alerts</span>
              </div>
            </div>
            <Link
              href="/alerts/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Alert
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No alerts yet</h2>
            <p className="text-slate-600 mb-6">Create your first alert to start tracking prices and listings</p>
            <Link
              href="/alerts/new"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Alert
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/alerts/${alert.id}`}
                  className="block bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{alert.name}</h3>

                        {/* Platform badge */}
                        {alert.sources?.[0] && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLATFORM_COLORS[alert.sources[0]] || 'bg-slate-100 text-slate-600'}`}>
                            {PLATFORM_LABELS[alert.sources[0]] || alert.sources[0]}
                          </span>
                        )}

                        {/* Status badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {alert.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatFrequency(alert.checkFrequency)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Search className="h-4 w-4" />
                          {alert.lastMatchCount} match{alert.lastMatchCount !== 1 ? 'es' : ''}
                        </span>
                        {alert.lastChecked && (
                          <span className="text-slate-400">
                            Last checked {formatRelative(alert.lastChecked)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4 shrink-0">
                      <button
                        onClick={e => toggleAlert(e, alert.id, alert.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          alert.isActive
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={alert.isActive ? 'Pause' : 'Resume'}
                      >
                        {alert.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={e => deleteAlert(e, alert.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
