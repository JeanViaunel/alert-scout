"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell, ArrowLeft, Clock, Search, MapPin, ExternalLink, X,
  Play, Pause, Trash2, Loader2, Home, ShoppingCart, ShoppingBag,
  Package, Globe, Monitor, Activity, Calendar, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import ListingsMap from '@/components/ListingsMap';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlertDetail {
  id: string;
  name: string;
  type: 'property' | 'product';
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

const PLATFORM_META: Record<string, {
  label: string;
  textColor: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  '591':    { label: '591 Rent',   textColor: 'text-blue-700',   bgColor: 'bg-blue-100',   icon: Home },
  'momo':   { label: 'Momo',       textColor: 'text-red-700',    bgColor: 'bg-red-100',    icon: ShoppingCart },
  'pchome': { label: 'PChome',     textColor: 'text-orange-700', bgColor: 'bg-orange-100', icon: Monitor },
  'amazon': { label: 'Amazon',     textColor: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Package },
  'shopee': { label: 'Shopee',     textColor: 'text-orange-600', bgColor: 'bg-orange-100', icon: ShoppingBag },
  'custom': { label: 'Custom',     textColor: 'text-slate-600',  bgColor: 'bg-slate-100',  icon: Globe },
};

const FREQUENCY_LABELS: Record<string, string> = {
  '5min': 'Every 5 minutes',
  '15min': 'Every 15 minutes',
  '30min': 'Every 30 minutes',
  '1hour': 'Every hour',
  'daily': 'Daily',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(dateStr?: string) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
}

function CriteriaTag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
      <span className="text-slate-400">{label}:</span> {value}
    </span>
  );
}

function buildCriteriaTags(criteria: Record<string, unknown>, platform: string): Array<{ label: string; value: string }> {
  const tags: Array<{ label: string; value: string }> = [];

  if (platform === '591') {
    if (criteria.city) tags.push({ label: 'City', value: String(criteria.city) });
    if (Array.isArray(criteria.districts) && criteria.districts.length) tags.push({ label: 'Districts', value: criteria.districts.join(', ') });
    if (criteria.minPrice || criteria.maxPrice) tags.push({ label: 'Price', value: `${criteria.minPrice ?? 0}–${criteria.maxPrice ?? '∞'} TWD` });
    if (criteria.minPing || criteria.maxPing) tags.push({ label: 'Area', value: `${criteria.minPing ?? 0}–${criteria.maxPing ?? '∞'} ping` });
    if (criteria.rooms) tags.push({ label: 'Rooms', value: String(criteria.rooms) });
  } else {
    if (criteria.searchQuery) tags.push({ label: 'Search', value: String(criteria.searchQuery) });
    if (criteria.asin) tags.push({ label: 'ASIN', value: String(criteria.asin) });
    if (criteria.category) tags.push({ label: 'Category', value: String(criteria.category) });
    if (Array.isArray(criteria.brand) && criteria.brand.length) tags.push({ label: 'Brand', value: criteria.brand.join(', ') });
    else if (criteria.brand) tags.push({ label: 'Brand', value: String(criteria.brand) });
    if (criteria.minPrice || criteria.maxPrice) {
      const cur = String(criteria.currency || 'TWD');
      tags.push({ label: 'Price', value: `${criteria.minPrice ?? 0}–${criteria.maxPrice ?? '∞'} ${cur}` });
    }
    if (criteria.condition && criteria.condition !== 'any') tags.push({ label: 'Condition', value: String(criteria.condition) });
    if (criteria.shopName) tags.push({ label: 'Shop', value: String(criteria.shopName) });
    if (criteria.primeOnly) tags.push({ label: 'Prime', value: 'Yes' });
    if (criteria.inStockOnly) tags.push({ label: 'Stock', value: 'In-stock only' });
  }

  if (Array.isArray(criteria.keywords) && criteria.keywords.length) {
    tags.push({ label: 'Keywords', value: (criteria.keywords as string[]).join(', ') });
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
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle');
  const [runMessage, setRunMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;

    try {
      const [alertRes, matchesRes] = await Promise.all([
        fetch(`/api/alerts/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/matches?alertId=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!alertRes.ok) {
        setError('Alert not found.');
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
      setError('Failed to load alert details.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!alert) return;
    setActionLoading(true);
    const token = localStorage.getItem('auth-token');
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !alert.isActive }),
      });
      if (res.ok) setAlert(prev => prev ? { ...prev, isActive: !prev.isActive } : prev);
    } catch { /* ignore */ } finally {
      setActionLoading(false);
    }
  };

  const runNow = async () => {
    setRunState('running');
    setRunMessage('');
    const token = localStorage.getItem('auth-token');
    try {
      const res = await fetch(`/api/alerts/${id}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRunMessage(data.message || (data.error ? `Error: ${data.error}` : ''));
      // Refresh data so stats + matches update
      await fetchData();
    } catch {
      setRunMessage('Run failed — check your connection.');
    } finally {
      setRunState('done');
    }
  };

  const deleteAlertAndRedirect = async () => {
    if (!confirm('Delete this alert? All matches will be lost.')) return;
    setActionLoading(true);
    const token = localStorage.getItem('auth-token');
    try {
      await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/alerts');
    } catch { /* ignore */ } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Loading / Error
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">{error || 'Alert not found.'}</p>
        <Link href="/alerts" className="text-indigo-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to alerts
        </Link>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const platform = alert.sources?.[0] || 'custom';
  const platformMeta = PLATFORM_META[platform] || PLATFORM_META.custom;
  const PlatformIcon = platformMeta.icon;
  const criteriaTags = buildCriteriaTags(alert.criteria, platform);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/alerts" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-2">
                <Bell className="h-6 w-6 text-indigo-600" />
                <span className="text-xl font-bold text-slate-900">Alert Scout</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={runNow}
                disabled={runState === 'running' || actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Force run this alert now"
              >
                {runState === 'running'
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>
                  : <><RefreshCw className="h-4 w-4" /> Run Now</>
                }
              </button>
              <button
                onClick={toggleStatus}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  alert.isActive
                    ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                    : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                {alert.isActive ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Resume</>}
              </button>
              <button
                onClick={deleteAlertAndRedirect}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ---- Title & platform ---- */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${platformMeta.bgColor} ${platformMeta.textColor}`}>
              <PlatformIcon className="h-3.5 w-3.5" />
              {platformMeta.label}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              alert.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {alert.isActive ? 'Active' : 'Paused'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{alert.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Created {formatDate(alert.createdAt)}</p>
        </motion.div>

        {/* ---- Stats grid ---- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { icon: Search, label: 'Total Matches', value: String(alert.lastMatchCount || matches.length) },
            { icon: RefreshCw, label: 'Last Checked', value: formatRelative(alert.lastChecked) },
            { icon: Clock, label: 'Frequency', value: FREQUENCY_LABELS[alert.checkFrequency] || alert.checkFrequency },
            { icon: Activity, label: 'Status', value: alert.isActive ? 'Monitoring' : 'Paused' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <stat.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* ---- Run result banner ---- */}
        {runState === 'done' && runMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
              runMessage.startsWith('Error') || runMessage.startsWith('Run failed')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            {runMessage}
            <button
              onClick={() => { setRunState('idle'); setRunMessage(''); }}
              className="ml-auto opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* ---- Criteria summary ---- */}
        {criteriaTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 border border-slate-200"
          >
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Search Criteria</h2>
            <div className="flex flex-wrap gap-2">
              {criteriaTags.map(tag => (
                <CriteriaTag key={tag.label} label={tag.label} value={tag.value} />
              ))}
            </div>
            {typeof alert.criteria.url === 'string' && alert.criteria.url && (
              <a
                href={alert.criteria.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-xs text-indigo-600 hover:text-indigo-800"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View source URL
              </a>
            )}
          </motion.div>
        )}

        {/* ---- Map (property alerts only) ---- */}
        {alert.type === 'property' && matches.length > 0 && matches.some(m => m.latitude != null && m.longitude != null) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Map View
            </h2>
            <ListingsMap
              matches={matches}
              selectedMatchId={selectedMatchId}
              onSelectMatch={(matchId) => {
                setSelectedMatchId(matchId);
                // Scroll to the selected card
                const element = document.getElementById(`match-${matchId}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            />
          </motion.div>
        )}

        {/* ---- Recent matches ---- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Matches <span className="text-slate-400 font-normal text-base">({matches.length})</span>
            </h2>
            {matches.length > 0 && (
              <Link href="/matches" className="text-sm text-indigo-600 hover:text-indigo-800">
                View all →
              </Link>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No matches yet</p>
              <p className="text-slate-400 text-sm mt-1">
                {alert.isActive
                  ? 'The alert is running. Matches will appear here when found.'
                  : 'Resume the alert to start finding matches.'}
              </p>
            </div>
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
                    transition={{ delay: 0.25 + i * 0.04 }}
                    className={`block bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all group cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-indigo-200'
                    }`}
                    onClick={() => setSelectedMatchId(match.id)}
                  >
                    {/* Image */}
                    <div className="h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
                      {match.imageUrl ? (
                        <img src={match.imageUrl} alt={match.title} className="w-full h-full object-cover" />
                      ) : (
                        <Home className="h-10 w-10 text-slate-300" />
                      )}
                    </div>

                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1">{match.title}</p>

                      {match.location && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-1.5">
                          <MapPin className="h-3 w-3 shrink-0" /> {match.location}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-base font-bold text-indigo-600">
                          {formatPrice(match.price, match.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(match.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                          View details <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </motion.a>
              );
            })}
            </div>
          )}
        </motion.div>

        {/* ---- Check log ---- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-5 border border-slate-200"
        >
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" /> Check History
          </h2>
          {alert.lastChecked ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-700 font-medium">{formatDate(alert.lastChecked)}</span>
                <span className="text-slate-500">— {alert.lastMatchCount} match{alert.lastMatchCount !== 1 ? 'es' : ''} found</span>
              </div>
              <p className="text-xs text-slate-400 ml-5">
                Full check history is coming soon. Only the most recent check is shown.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No checks have run yet.</p>
          )}
        </motion.div>

      </main>
    </div>
  );
}
