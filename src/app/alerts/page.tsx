"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { PageHeader } from '@/components/PageHeader';
import { Card, EmptyState } from '@/components/Card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/AnimatedContainer';
import { 
  Plus, 
  ArrowLeft, 
  Loader2, 
  Play, 
  Pause, 
  Trash2, 
  Clock, 
  Search,
  Bell,
  MoreVertical,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
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
  '591': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'momo': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'pchome': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'amazon': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'shopee': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'custom': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
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
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
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
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
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
    const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
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
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="My Alerts"
          subtitle="Manage your price and property tracking alerts"
          backHref="/"
          backLabel="Dashboard"
        >
          <Link
            href="/alerts/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            <Plus className="h-5 w-5" />
            New Alert
          </Link>
        </PageHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-slate-400 text-sm">Loading alerts...</p>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No alerts yet"
            description="Create your first alert to start tracking prices and listings"
            action={{ label: "Create Alert", href: "/alerts/new" }}
          />
        ) : (
          <StaggerContainer className="grid gap-4" staggerDelay={0.05}>
            {alerts.map((alert) => (
              <StaggerItem key={alert.id}>
                <Link href={`/alerts/${alert.id}`}>
                  <Card className="group" hover>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Header row */}
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {alert.name}
                            </h3>
                            
                            {/* Platform badge */}
                            {alert.sources?.[0] && (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${PLATFORM_COLORS[alert.sources[0]] || PLATFORM_COLORS.custom}`}>
                                {PLATFORM_LABELS[alert.sources[0]] || alert.sources[0]}
                              </span>
                            )}

                            {/* Status badge */}
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              alert.isActive 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              {alert.isActive ? 'Active' : 'Paused'}
                            </span>
                          </div>

                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {formatFrequency(alert.checkFrequency)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Search className="h-4 w-4" />
                              {alert.lastMatchCount} match{alert.lastMatchCount !== 1 ? 'es' : ''}
                            </span>
                            {alert.lastChecked && (
                              <span className="text-slate-500">
                                Last checked {formatRelative(alert.lastChecked)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                          <button
                            onClick={e => toggleAlert(e, alert.id, alert.isActive)}
                            className={`p-2.5 rounded-xl transition-colors ${
                              alert.isActive
                                ? 'text-amber-400 hover:bg-amber-500/10'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={alert.isActive ? 'Pause' : 'Resume'}
                          >
                            {alert.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={e => deleteAlert(e, alert.id)}
                            className="p-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </main>
    </div>
  );
}
