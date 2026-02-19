"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Heart, ArrowLeft, Loader2, ExternalLink, MapPin, Home, Clock, Bell } from 'lucide-react';
import Link from 'next/link';

interface Match {
  id: string;
  alertId: string;
  alertName: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  area?: number;
  imageUrl?: string;
  sourceUrl: string;
  source: string;
  isFavorite: boolean;
  createdAt: string;
}

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch('/api/matches', {
        headers: { 'Authorization': `Bearer ${token}` },
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

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    setMatches(prev => prev.map(m => 
      m.id === id ? { ...m, isFavorite: !isFavorite } : m
    ));
    // TODO: API call to update favorite status
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              filter === 'favorites'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Favorites
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredMatches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
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
                : 'Create an alert and we\'ll find matches for you'}
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48 bg-slate-200">
                  {match.imageUrl ? (
                    <img
                      src={match.imageUrl}
                      alt={match.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={() => toggleFavorite(match.id, match.isFavorite)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        match.isFavorite
                          ? 'fill-red-500 text-red-500'
                          : 'text-slate-400'
                      }`}
                    />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg">
                      {match.alertName}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                    {match.title}
                  </h3>

                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{match.location}</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-indigo-600">
                      {formatPrice(match.price, match.currency)}
                    </span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>

                  {match.area && (
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        {match.area} ping
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      {new Date(match.createdAt).toLocaleDateString()}
                    </div>
                    <a
                      href={match.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-500 text-sm"
                    >
                      View on {match.source}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
