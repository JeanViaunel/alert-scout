"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  ArrowLeft,
  Clock,
  Search,
  MapPin,
  ExternalLink,
  X,
  Play,
  Pause,
  Trash2,
  Loader2,
  Home,
  ShoppingCart,
  ShoppingBag,
  Package,
  Globe,
  Monitor,
  Activity,
  Calendar,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import ListingsMap from "@/components/ListingsMap";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/AnimatedContainer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlertDetail {
  id: string;
  name: string;
  type: "property" | "product";
  sources: string[];
  criteria: Record<string, unknown>;
  isActive: boolean;
  checkFrequency: string;
  lastChecked?: string;
  lastMatchCount: number;
  createdAt: string;
  notifyMethods: string[];
}

interface Match {
  id: string;
  alertId: string;
  title: string;
  price: number;
  currency: string;
  location?: string;
  area?: number;
  imageUrl?: string;
  sourceUrl: string;
  source: string;
  isFavorite: boolean;
  createdAt: string;
  latitude?: number;
  longitude?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_META: Record<
  string,
  {
    label: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  "591": {
    label: "591 Rent",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    icon: Home,
  },
  momo: {
    label: "Momo",
    textColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    icon: ShoppingCart,
  },
  pchome: {
    label: "PChome",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    icon: Monitor,
  },
  amazon: {
    label: "Amazon",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    icon: Package,
  },
  shopee: {
    label: "Shopee",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    icon: ShoppingBag,
  },
  custom: {
    label: "Custom",
    textColor: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    icon: Globe,
  },
};

const FREQUENCY_LABELS: Record<string, string> = {
  "5min": "Every 5 minutes",
  "15min": "Every 15 minutes",
  "30min": "Every 30 minutes",
  "1hour": "Every hour",
  daily: "Daily",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(dateStr?: string) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function CriteriaTag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-white/10 rounded-lg text-xs font-medium text-slate-300">
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-200">{value}</span>
    </span>
  );
}

function buildCriteriaTags(
  criteria: Record<string, unknown>,
  platform: string
): Array<{ label: string; value: string }> {
  const tags: Array<{ label: string; value: string }> = [];

  if (platform === "591") {
    if (criteria.city) tags.push({ label: "City", value: String(criteria.city) });
    if (Array.isArray(criteria.districts) && criteria.districts.length)
      tags.push({ label: "Districts", value: criteria.districts.join(", ") });
    if (criteria.minPrice || criteria.maxPrice)
      tags.push({
        label: "Price",
        value: `${criteria.minPrice ?? 0}–${criteria.maxPrice ?? "∞"} TWD`,
      });
    if (criteria.minPing || criteria.maxPing)
      tags.push({
        label: "Area",
        value: `${criteria.minPing ?? 0}–${criteria.maxPing ?? "∞"} ping`,
      });
    if (criteria.rooms) tags.push({ label: "Rooms", value: String(criteria.rooms) });
  } else {
    if (criteria.searchQuery)
      tags.push({ label: "Search", value: String(criteria.searchQuery) });
    if (criteria.asin) tags.push({ label: "ASIN", value: String(criteria.asin) });
    if (criteria.category)
      tags.push({ label: "Category", value: String(criteria.category) });
    if (Array.isArray(criteria.brand) && criteria.brand.length)
      tags.push({ label: "Brand", value: criteria.brand.join(", ") });
    else if (criteria.brand)
      tags.push({ label: "Brand", value: String(criteria.brand) });
    if (criteria.minPrice || criteria.maxPrice) {
      const cur = String(criteria.currency || "TWD");
      tags.push({
        label: "Price",
        value: `${criteria.minPrice ?? 0}–${criteria.maxPrice ?? "∞"} ${cur}`,
      });
    }
    if (criteria.condition && criteria.condition !== "any")
      tags.push({ label: "Condition", value: String(criteria.condition) });
    if (criteria.shopName)
      tags.push({ label: "Shop", value: String(criteria.shopName) });
    if (criteria.primeOnly) tags.push({ label: "Prime", value: "Yes" });
    if (criteria.inStockOnly) tags.push({ label: "Stock", value: "In-stock only" });
  }

  if (Array.isArray(criteria.keywords) && criteria.keywords.length) {
    tags.push({ label: "Keywords", value: (criteria.keywords as string[]).join(", ") });
  }

  return tags;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [runState, setRunState] = useState<"idle" | "running" | "done">("idle");
  const [runMessage, setRunMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;

    try {
      const [alertRes, matchesRes] = await Promise.all([
        fetch(`/api/alerts/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/matches?alertId=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!alertRes.ok) {
        setError("Alert not found.");
        return;
      }

      const alertData = await alertRes.json();
      setAlert(alertData.alert);

      if (matchesRes.ok) {
        const matchData = await matchesRes.json();
        const loadedMatches = matchData.matches || [];
        setMatches(loadedMatches);
        // Set first match with coordinates as selected (if any)
        const firstWithCoords = loadedMatches.find(
          (m: Match) => m.latitude != null && m.longitude != null
        );
        if (firstWithCoords) {
          setSelectedMatchId(firstWithCoords.id);
        }
      }
    } catch {
      setError("Failed to load alert details.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!alert) return;
    setActionLoading(true);
    const token = localStorage.getItem("auth-token");
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !alert.isActive }),
      });
      if (res.ok)
        setAlert((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev));
    } catch {
      /* ignore */
    } finally {
      setActionLoading(false);
    }
  };

  const runNow = async () => {
    setRunState("running");
    setRunMessage("");
    const token = localStorage.getItem("auth-token");
    try {
      const res = await fetch(`/api/alerts/${id}/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRunMessage(data.message || (data.error ? `Error: ${data.error}` : ""));
      // Refresh data so stats + matches update
      await fetchData();
    } catch {
      setRunMessage("Run failed — check your connection.");
    } finally {
      setRunState("done");
    }
  };

  const deleteAlertAndRedirect = async () => {
    if (!confirm("Delete this alert? All matches will be lost.")) return;
    setActionLoading(true);
    const token = localStorage.getItem("auth-token");
    try {
      await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/alerts");
    } catch {
      /* ignore */
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Loading / Error
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="text-slate-400 text-sm">Loading alert details...</p>
        </div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/10 flex items-center justify-center mb-2">
          <Bell className="h-8 w-8 text-slate-500" />
        </div>
        <p className="text-slate-400">{error || "Alert not found."}</p>
        <Link
          href="/alerts"
          className="text-amber-400 hover:text-amber-300 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to alerts
        </Link>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const platform = alert.sources?.[0] || "custom";
  const platformMeta = PLATFORM_META[platform] || PLATFORM_META.custom;
  const PlatformIcon = platformMeta.icon;
  const criteriaTags = buildCriteriaTags(alert.criteria, platform);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ---- Page Header with Actions ---- */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <PageHeader
              title={alert.name}
              subtitle={`Created ${formatDate(alert.createdAt)}`}
              backHref="/alerts"
              backLabel="Back to alerts"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={runNow}
                disabled={runState === "running" || actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-500 text-slate-900 hover:bg-amber-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                title="Force run this alert now"
              >
                {runState === "running" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Running…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" /> Run Now
                  </>
                )}
              </button>
              <button
                onClick={toggleStatus}
                disabled={actionLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 border ${
                  alert.isActive
                    ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                }`}
              >
                {alert.isActive ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Resume
                  </>
                )}
              </button>
              <button
                onClick={deleteAlertAndRedirect}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-all duration-200 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </FadeIn>

        {/* ---- Platform & Status Badges ---- */}
        <FadeIn delay={0.05}>
          <div className="flex items-center gap-3 flex-wrap -mt-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${platformMeta.bgColor} ${platformMeta.textColor} ${platformMeta.borderColor}`}
            >
              <PlatformIcon className="h-3.5 w-3.5" />
              {platformMeta.label}
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                alert.isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
              }`}
            >
              {alert.isActive ? "Active" : "Paused"}
            </span>
          </div>
        </FadeIn>

        {/* ---- Stats grid ---- */}
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-4" staggerDelay={0.05}>
          {[
            {
              icon: Search,
              label: "Total Matches",
              value: String(alert.lastMatchCount || matches.length),
            },
            {
              icon: RefreshCw,
              label: "Last Checked",
              value: formatRelative(alert.lastChecked),
            },
            {
              icon: Clock,
              label: "Frequency",
              value: FREQUENCY_LABELS[alert.checkFrequency] || alert.checkFrequency,
            },
            {
              icon: Activity,
              label: "Status",
              value: alert.isActive ? "Monitoring" : "Paused",
            },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <Card className="p-5" glow>
                <div className="flex items-center gap-3 text-slate-500 mb-2">
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-white/10">
                    <stat.icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* ---- Run result banner ---- */}
        {runState === "done" && runMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-3 border ${
              runMessage.startsWith("Error") || runMessage.startsWith("Run failed")
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                runMessage.startsWith("Error") || runMessage.startsWith("Run failed")
                  ? "bg-rose-500/20"
                  : "bg-emerald-500/20"
              }`}
            >
              <RefreshCw className="h-4 w-4" />
            </div>
            {runMessage}
            <button
              onClick={() => {
                setRunState("idle");
                setRunMessage("");
              }}
              className="ml-auto p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* ---- Criteria summary ---- */}
        {criteriaTags.length > 0 && (
          <FadeIn delay={0.15}>
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Search className="h-4 w-4 text-amber-400" />
                </div>
                Search Criteria
              </h2>
              <div className="flex flex-wrap gap-2">
                {criteriaTags.map((tag) => (
                  <CriteriaTag key={tag.label} label={tag.label} value={tag.value} />
                ))}
              </div>
              {typeof alert.criteria.url === "string" && alert.criteria.url && (
                <a
                  href={alert.criteria.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" /> View source URL
                </a>
              )}
            </Card>
          </FadeIn>
        )}

        {/* ---- Map (property alerts only) ---- */}
        {alert.type === "property" &&
          matches.length > 0 &&
          matches.some((m) => m.latitude != null && m.longitude != null) && (
            <FadeIn delay={0.2}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-amber-400" />
                </div>
                Map View
              </h2>
              <Card className="p-1 overflow-hidden">
                <ListingsMap
                  matches={matches}
                  selectedMatchId={selectedMatchId}
                  onSelectMatch={(matchId) => {
                    setSelectedMatchId(matchId);
                    // Scroll to the selected card
                    const element = document.getElementById(`match-${matchId}`);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                />
              </Card>
            </FadeIn>
          )}

        {/* ---- Recent matches ---- */}
        <FadeIn delay={0.25}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Bell className="h-4 w-4 text-amber-400" />
              </div>
              Matches{" "}
              <span className="text-slate-500 font-normal text-base">({matches.length})</span>
            </h2>
            {matches.length > 0 && (
              <Link
                href="/matches"
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                View all →
              </Link>
            )}
          </div>

          {matches.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-800/50 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-slate-300 font-medium text-lg">No matches yet</p>
              <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                {alert.isActive
                  ? "The alert is running. Matches will appear here when found."
                  : "Resume the alert to start finding matches."}
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.slice(0, 12).map((match, i) => {
                const isSelected = match.id === selectedMatchId;
                return (
                  <motion.a
                    key={match.id}
                    id={`match-${match.id}`}
                    href={`/matches/${match.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className={`group block rounded-2xl border overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? "border-amber-500/50 ring-2 ring-amber-500/20"
                        : "border-white/10 hover:border-amber-500/30"
                    } bg-slate-800/30 hover:bg-slate-800/50`}
                    onClick={() => setSelectedMatchId(match.id)}
                  >
                    {/* Image */}
                    <div className="h-36 bg-slate-800/50 flex items-center justify-center overflow-hidden">
                      {match.imageUrl ? (
                        <img
                          src={match.imageUrl}
                          alt={match.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Home className="h-10 w-10 text-slate-600" />
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-sm font-semibold text-white line-clamp-2 mb-2">
                        {match.title}
                      </p>

                      {match.location && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />{" "}
                          {match.location}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-base font-bold text-amber-400">
                          {formatPrice(match.price, match.currency)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(match.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/10">
                        <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5 group-hover:gap-2 transition-all">
                          View details <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          )}
        </FadeIn>

        {/* ---- Check log ---- */}
        <FadeIn delay={0.35}>
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-400" />
              </div>
              Check History
            </h2>
            {alert.lastChecked ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-lg shadow-emerald-400/30" />
                  <span className="text-slate-300 font-medium">{formatDate(alert.lastChecked)}</span>
                  <span className="text-slate-500">
                    — {alert.lastMatchCount} match{alert.lastMatchCount !== 1 ? "es" : ""} found
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-7">
                  Full check history is coming soon. Only the most recent check is shown.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                No checks have run yet.
              </div>
            )}
          </Card>
        </FadeIn>

        {/* ---- Price Insights ---- */}
        {matches.length > 0 && (() => {
          const prices = matches.map((m) => m.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          const currency = matches[0].currency || "TWD";
          const cheapest = matches.find((m) => m.price === minPrice);
          const spread = maxPrice - minPrice;
          const spreadPct = minPrice > 0 ? Math.round((spread / minPrice) * 100) : 0;

          return (
            <FadeIn delay={0.4}>
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <BarChart2 className="h-4 w-4 text-amber-400" />
                  </div>
                  Price Insights
                  <span className="ml-auto text-xs text-slate-500 font-normal">
                    across {matches.length} listing{matches.length !== 1 ? "s" : ""}
                  </span>
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5 text-emerald-400" /> Lowest
                    </p>
                    <p className="text-lg font-bold text-emerald-400">
                      {formatPrice(minPrice, currency)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Average
                    </p>
                    <p className="text-lg font-bold text-amber-400">
                      {formatPrice(avgPrice, currency)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-rose-400" /> Highest
                    </p>
                    <p className="text-lg font-bold text-rose-400">
                      {formatPrice(maxPrice, currency)}
                    </p>
                  </div>
                </div>

                {spread > 0 && (
                  <p className="text-xs text-slate-500 mb-4">
                    Price spread: <span className="text-slate-300 font-medium">{formatPrice(spread, currency)}</span>
                    {" "}({spreadPct}% above cheapest)
                  </p>
                )}

                {cheapest && (
                  <a
                    href={`/matches/${cheapest.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <TrendingDown className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Best deal found</p>
                        <p className="text-sm text-white font-medium truncate">{cheapest.title}</p>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-bold text-sm shrink-0 ml-3 group-hover:text-emerald-300 transition-colors">
                      {formatPrice(minPrice, currency)} →
                    </span>
                  </a>
                )}
              </Card>
            </FadeIn>
          );
        })()}
      </main>
    </div>
  );
}
