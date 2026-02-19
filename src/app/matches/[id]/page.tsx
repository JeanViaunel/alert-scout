"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ExternalLink, MapPin, Home, Clock,
  Bell, Heart, Loader2, Package, ShoppingCart,
  ShoppingBag, Monitor, Globe, Maximize2,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getAuthToken } from '@/lib/auth-token';
import type { Match } from '@/types';

type MatchDetail = Match & { alertName?: string; alertType?: string };

const ListingsMap = dynamic(() => import('@/components/ListingsMap'), { ssr: false });

const PROPERTY_SOURCES = ['591'];

const SOURCE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  '591':    { label: '591 Rent',  icon: Home },
  'momo':   { label: 'Momo',     icon: ShoppingCart },
  'pchome': { label: 'PChome',   icon: Monitor },
  'amazon': { label: 'Amazon',   icon: Package },
  'shopee': { label: 'Shopee',   icon: ShoppingBag },
  'custom': { label: 'Custom',   icon: Globe },
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currency || 'TWD',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const token = getAuthToken();
    if (!token) return;

    fetch(`/api/matches/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setMatch(data.match);
        setIsFavorite(data.match.isFavorite);
      })
      .catch(() => setError('Match not found.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const toggleFavorite = async () => {
    setIsFavorite(prev => !prev);
    // TODO: persist via API
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">{error || 'Match not found.'}</p>
        <Link href="/matches" className="text-indigo-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to matches
        </Link>
      </div>
    );
  }

  const sourceMeta = SOURCE_META[match.source] ?? SOURCE_META.custom;
  const SourceIcon = sourceMeta.icon;
  const isProperty = PROPERTY_SOURCES.includes(match.source);
  const hasCoords = match.latitude != null && match.longitude != null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/matches" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-1.5">
                <SourceIcon className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-slate-900">{sourceMeta.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
              </button>
              <a
                href={match.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                View on {sourceMeta.label}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-200 rounded-2xl overflow-hidden"
          style={{ height: imageExpanded ? '480px' : '280px', transition: 'height 0.3s ease' }}
        >
          {match.imageUrl ? (
            <img
              src={match.imageUrl}
              alt={match.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <SourceIcon className="h-16 w-16 text-slate-300" />
            </div>
          )}
          {match.imageUrl && (
            <button
              onClick={() => setImageExpanded(v => !v)}
              className="absolute bottom-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-lg transition-colors"
              title={imageExpanded ? 'Collapse' : 'Expand'}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
          {match.alertName && (
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg">
                <Bell className="h-3 w-3" /> {match.alertName}
              </span>
            </div>
          )}
        </motion.div>

        {/* Title + price */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{match.title}</h1>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-600">
              {formatPrice(match.price, match.currency)}
            </span>
            {isProperty && <span className="text-slate-500">/month</span>}
          </div>
        </motion.div>

        {/* Key details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100"
        >
          {match.location && (
            <div className="flex items-center gap-3 px-5 py-4">
              <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Location</p>
                <p className="text-slate-900 font-medium">{match.location}</p>
              </div>
            </div>
          )}
          {match.area && (
            <div className="flex items-center gap-3 px-5 py-4">
              <Home className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Area</p>
                <p className="text-slate-900 font-medium">{match.area} ping</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 px-5 py-4">
            <Clock className="h-5 w-5 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Found</p>
              <p className="text-slate-900 font-medium">
                {new Date(match.createdAt as unknown as string).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <SourceIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Source</p>
              <a
                href={match.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-medium hover:underline flex items-center gap-1"
              >
                {sourceMeta.label} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Map — property listings with coordinates only */}
        {isProperty && hasCoords && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              Location on map
            </h2>
            <ListingsMap
              matches={[match] as Match[]}
              selectedMatchId={match.id}
              onSelectMatch={() => {}}
              className="h-80"
            />
          </motion.div>
        )}

      </main>
    </div>
  );
}
