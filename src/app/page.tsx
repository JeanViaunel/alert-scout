"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getAuthToken } from '@/lib/auth-token';
import { Bell, Plus, Search, Heart, Loader2 } from 'lucide-react';

interface DashboardStats {
  totalAlerts: number;
  activeAlerts: number;
  totalMatches: number;
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const [alertsRes, matchesRes] = await Promise.all([
        fetch('/api/alerts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/matches', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const alertsData = alertsRes.ok ? await alertsRes.json() : { alerts: [] };
      const matchesData = matchesRes.ok ? await matchesRes.json() : { matches: [] };

      const alerts: { isActive: boolean }[] = alertsData.alerts || [];
      setStats({
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter(a => a.isActive).length,
        totalMatches: matchesData.matches?.length || 0,
      });
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <Bell className="h-6 w-6 text-indigo-600" />
                <span className="text-xl font-bold text-slate-900">Alert Scout</span>
              </div>
              <nav className="flex items-center gap-4">
                <Link href="/alerts" className="text-slate-600 hover:text-slate-900 font-medium">Alerts</Link>
                <Link href="/matches" className="text-slate-600 hover:text-slate-900 font-medium">Matches</Link>
                <Link href="/profile" className="text-slate-600 hover:text-slate-900 font-medium">Profile</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name}!</h1>
            <p className="text-slate-600 mt-1">Here&apos;s what&apos;s happening with your alerts.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Active Alerts</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? '...' : (stats?.activeAlerts ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Search className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Alerts</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? '...' : (stats?.totalAlerts ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Matches</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? '...' : (stats?.totalMatches ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/alerts"
              className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-6 w-6 text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-900">My Alerts</h2>
              </div>
              <p className="text-slate-600 text-sm">Manage your active price and property alerts.</p>
            </Link>

            <Link
              href="/matches"
              className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <Search className="h-6 w-6 text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-900">Matches</h2>
              </div>
              <p className="text-slate-600 text-sm">Browse all listings that matched your alerts.</p>
            </Link>

            <Link
              href="/alerts/new"
              className="bg-indigo-600 rounded-xl p-6 shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Plus className="h-6 w-6 text-white" />
                <h2 className="text-lg font-semibold text-white">New Alert</h2>
              </div>
              <p className="text-indigo-200 text-sm">Set up a new alert to start tracking.</p>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Landing page for guests
  return (
    <div className="min-h-screen">
      <section className="py-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Never Miss a Great Deal
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Track rental properties and product prices automatically.
          Get instant notifications when new listings match your criteria.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Smart Monitoring"
            description="Automated scraping of major platforms including 591, Shopee, Amazon, and more."
          />
          <FeatureCard
            title="Instant Alerts"
            description="Get notified immediately when new matches are found. Email, WhatsApp, and in-app notifications."
          />
          <FeatureCard
            title="Map View"
            description="Visualize property locations on an interactive map with filtering capabilities."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-card rounded-lg border border-border">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
