"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Card, StatCard } from '@/components/Card';
import { FadeIn, StaggerContainer, StaggerItem, SlideIn } from '@/components/AnimatedContainer';
import { 
  Bell, 
  Plus, 
  Search, 
  Heart, 
  Loader2,
  ArrowRight,
  Sparkles,
  Zap,
  MapPin,
  Shield,
  TrendingDown,
  Clock,
  CheckCircle2,
  BarChart3,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalAlerts: number;
  activeAlerts: number;
  totalMatches: number;
}

// ============================================
// LANDING PAGE COMPONENTS
// ============================================

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  delay: number;
}) {
  return (
    <SlideIn from="bottom" delay={delay}>
      <Card className="p-8 h-full" glow>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </Card>
    </SlideIn>
  );
}

function PlatformBadge({ name, delay }: { name: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-slate-300"
    >
      {name}
    </motion.div>
  );
}

function LandingPage() {
  const platforms = ["591 Rent", "Shopee", "Amazon", "PChome", "Momo", "Custom URLs"];

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 animated-gradient opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.12),transparent_50%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[128px]" />

        <Header transparent />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <FadeIn delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-400">Smart Monitoring for Smart Shoppers</span>
              </div>
            </FadeIn>

            {/* Headline */}
            <FadeIn delay={0.2}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
                Never Miss a{" "}
                <span className="text-gradient-gold">Great Deal</span>
              </h1>
            </FadeIn>

            {/* Subtitle */}
            <FadeIn delay={0.3}>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Track rental properties and product prices automatically across multiple platforms. 
                Get instant notifications when prices drop or new listings match your criteria.
              </p>
            </FadeIn>

            {/* CTA Buttons */}
            <FadeIn delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-lg shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:-translate-y-0.5"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link>
              </div>
            </FadeIn>

            {/* Supported Platforms */}
            <FadeIn delay={0.5}>
              <div className="space-y-4">
                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Supported Platforms</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {platforms.map((platform, i) => (
                    <PlatformBadge key={platform} name={platform} delay={0.6 + i * 0.1} />
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Powerful tools to help you find the best deals and properties without the hassle.
              </p>
            </FadeIn>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Smart Monitoring"
              description="Automated scraping of major platforms including 591, Shopee, Amazon, and more. Set it and forget it."
              delay={0.1}
            />
            <FeatureCard
              icon={Bell}
              title="Instant Alerts"
              description="Get notified immediately when new matches are found. Never miss out on a great opportunity again."
              delay={0.2}
            />
            <FeatureCard
              icon={MapPin}
              title="Interactive Maps"
              description="Visualize property locations on an interactive map with advanced filtering and search capabilities."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Three Simple Steps</h2>
            </FadeIn>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Search, title: "Create Alert", desc: "Set your search criteria for properties or products" },
              { step: "02", icon: Clock, title: "We Monitor", desc: "Our system checks for new listings automatically" },
              { step: "03", icon: CheckCircle2, title: "Get Notified", desc: "Receive instant alerts when matches are found" },
            ].map((item, i) => (
              <SlideIn key={item.step} from="bottom" delay={0.1 * (i + 1)}>
                <div className="relative text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-500">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10K+", label: "Active Alerts" },
              { value: "500K+", label: "Matches Found" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Monitoring" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={0.1 * (i + 1)}>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-gradient-gold mb-2">{stat.value}</div>
                  <div className="text-slate-400 text-sm uppercase tracking-wider">{stat.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12 text-center relative overflow-visible" glow>
            {/* Decorative elements */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/25">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            
            <div className="pt-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Start Saving?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Join thousands of smart shoppers who never miss a great deal. 
                Set up your first alert in under 2 minutes.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-semibold text-lg hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:-translate-y-0.5"
              >
                Create Free Account
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-semibold">Alert Scout</span>
            </div>
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Alert Scout. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// DASHBOARD COMPONENTS
// ============================================

function Recommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;

    fetch("/api/recommendations?limit=6", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setRecommendations(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          ✨ Recommended For You
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[280px] h-[340px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          ✨ Recommended For You
        </h2>
        <Link href="/matches" className="text-sm text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1 transition-colors">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.match.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[280px] snap-start"
          >
            <Link href={`/matches/${rec.match.id}`}>
              <Card className="h-full overflow-hidden group" hover glow>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={rec.match.imageUrl || "/file.svg"} 
                    alt={rec.match.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                    {rec.match.source}
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold">
                    {Math.round(rec.score * 100)}% Match
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold line-clamp-1 mb-1 group-hover:text-amber-400 transition-colors">
                    {rec.match.title}
                  </h3>
                  <p className="text-slate-400 text-xs flex items-center gap-1 mb-3">
                    <MapPin className="h-3 w-3" /> {rec.match.location}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-amber-500 font-bold">
                      {new Intl.NumberFormat("zh-TW", {
                        style: "currency",
                        currency: rec.match.currency || "TWD",
                        maximumFractionDigits: 0,
                      }).format(rec.match.price)}
                    </span>
                    <span className="text-slate-500 text-[10px] uppercase font-medium">
                      {rec.match.area} ping
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ user }: { user: { name: string } }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
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

  const quickActions = [
    {
      icon: Bell,
      title: "My Alerts",
      description: "Manage your active price and property alerts",
      href: "/alerts",
      color: "primary" as const,
    },
    {
      icon: Search,
      title: "Matches",
      description: "Browse all listings that matched your alerts",
      href: "/matches",
      color: "success" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              Welcome back, <span className="text-gradient-gold">{user.name}</span>!
            </h1>
            <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening with your alerts.</p>
          </div>
        </FadeIn>

        {/* Stats Grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8" staggerDelay={0.1}>
          <StaggerItem>
            <StatCard
              icon={Bell}
              label="Active Alerts"
              value={statsLoading ? '...' : (stats?.activeAlerts ?? 0)}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={BarChart3}
              label="Total Alerts"
              value={statsLoading ? '...' : (stats?.totalAlerts ?? 0)}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={Heart}
              label="Total Matches"
              value={statsLoading ? '...' : (stats?.totalMatches ?? 0)}
              color="warning"
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Recommendations Section */}
        <FadeIn delay={0.4}>
          <Recommendations />
        </FadeIn>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, i) => {
            const colorClasses =
              action.color === "primary"
                ? { bg: "bg-primary/10", icon: "text-primary" }
                : action.color === "success"
                ? { bg: "bg-emerald-500/10", icon: "text-emerald-500" }
                : { bg: "bg-amber-500/10", icon: "text-amber-500" };

            return (
              <SlideIn key={action.href} from="bottom" delay={0.3 + i * 0.1}>
                <Link href={action.href}>
                  <Card className="p-6 h-full group" glow>
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses.bg}`}
                      >
                        <action.icon className={`h-6 w-6 ${colorClasses.icon}`} />
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-slate-400">{action.description}</p>
                  </Card>
                </Link>
              </SlideIn>
            );
          })}

          {/* Create Alert CTA */}
          <SlideIn from="bottom" delay={0.5}>
            <Link href="/alerts/new">
              <Card className="p-6 h-full bg-gradient-to-br from-amber-500 to-amber-600 border-amber-500/50 group" hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">New Alert</h3>
                <p className="text-sm text-white/80">Set up a new alert to start tracking</p>
              </Card>
            </Link>
          </SlideIn>
        </div>
      </main>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} />;
  }

  return <LandingPage />;
}
