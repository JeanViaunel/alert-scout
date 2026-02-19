"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAuthToken } from '@/lib/auth-token';
import { Heart, ArrowLeft, Loader2, ExternalLink, MapPin, Home, Clock, Bell, Map, Grid } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Match } from '@/types';

// alertName is joined by the API but not in the base type
type MatchWithAlert = Match & { alertName?: string };

const ListingsMap = dynamic(() => import('@/components/ListingsMap'), { ssr: false });

const PROPERTY_SOURCES = ['591'];

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await fetch('/api/matches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, id: string, isFavorite: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setMatches(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !isFavorite } : m));
    // TODO: persist via API
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency || 'TWD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredMatches = filter === 'favorites'
    ? matches.filter(m => m.isFavorite)
    : matches;

  const hasPropertyMatches = filteredMatches.some(
    m => PROPERTY_SOURCES.includes(m.source) && m.latitude != null && m.longitude != null
  );

  const isMapView = viewMode === 'map' && hasPropertyMatches;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
                <span className="text-xl font-bold text-slate-900">Matches</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm font-medium">
                  {matches.length}
                </span>
              </div>
            </div>

            {/* View toggle — only when property matches with coords exist */}
            {hasPropertyMatches && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'map'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Map className="h-4 w-4" />
                  Map
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors text-sm ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors text-sm ${
              filter === 'favorites' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Favorites
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {filter === 'favorites' ? 'No favorites yet' : 'No matches yet'}
            </h2>
            <p className="text-slate-600 mb-6">
              {filter === 'favorites'
                ? 'Save your favorite listings to see them here'
                : "Create an alert and we'll find matches for you"}
            </p>
            {filter !== 'favorites' && (
              <Link
                href="/alerts/new"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-500 transition-colors"
              >
                Create Alert
              </Link>
            )}
          </motion.div>
        </div>
      ) : isMapView ? (
        /* ── Map + compact list split layout ── */
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          {/* Scrollable card list */}
          <div className="w-80 lg:w-96 flex-shrink-0 overflow-y-auto bg-white border-r border-slate-200 divide-y divide-slate-100">
            {filteredMatches.map((match, index) => (
              <motion.a
                key={match.id}
                href={`/matches/${match.id}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedMatchId(match.id)}
                className={`flex gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                  selectedMatchId === match.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                }`}
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                  {match.imageUrl ? (
                    <img src={match.imageUrl} alt={match.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug mb-1">
                    {match.title}
                  </h3>
                  {match.location && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{match.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-600">
                      {formatPrice(match.price, match.currency)}
                    </span>
                    <button
                      onClick={e => toggleFavorite(e, match.id, match.isFavorite)}
                      className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                    >
                      <Heart className={`h-4 w-4 ${match.isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                    </button>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Map */}
          <div className="flex-1 overflow-hidden">
            <ListingsMap
              matches={filteredMatches as Match[]}
              selectedMatchId={selectedMatchId}
              onSelectMatch={setSelectedMatchId}
              className="h-full rounded-none border-0"
            />
          </div>
        </div>
      ) : (
        /* ── Grid view ── */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, index) => (
              <motion.a
                key={match.id}
                href={`/matches/${match.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-48 bg-slate-200">
                  {match.imageUrl ? (
                    <img src={match.imageUrl} alt={match.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={e => toggleFavorite(e, match.id, match.isFavorite)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <Heart className={`h-5 w-5 ${match.isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                  </button>
                  {match.alertName && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg">
                        {match.alertName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{match.title}</h3>

                  {match.location && (
                    <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{match.location}</span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-indigo-600">
                      {formatPrice(match.price, match.currency)}
                    </span>
                    {PROPERTY_SOURCES.includes(match.source) && (
                      <span className="text-slate-500 text-sm">/month</span>
                    )}
                  </div>

                  {match.area && (
                    <div className="flex items-center gap-1 text-sm text-slate-600 mb-4">
                      <Home className="h-4 w-4" />
                      {match.area} ping
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      {new Date(match.createdAt as unknown as string).toLocaleDateString()}
                    </div>
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-medium text-sm">
                      {match.source}
                      <ExternalLink className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
