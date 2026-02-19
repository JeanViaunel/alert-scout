"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAuthToken } from "@/lib/auth-token";
import {
  Heart,
  ArrowLeft,
  Loader2,
  ExternalLink,
  MapPin,
  Home,
  Clock,
  Bell,
  Map,
  Grid,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Match } from "@/types";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/AnimatedContainer";

// alertName is joined by the API but not in the base type
type MatchWithAlert = Match & { alertName?: string };

const ListingsMap = dynamic(() => import("@/components/ListingsMap"), {
  ssr: false,
});

const PROPERTY_SOURCES = ["591"];

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await fetch("/api/matches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (
    e: React.MouseEvent,
    id: string,
    isFavorite: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setMatches((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, isFavorite: !isFavorite } : m
      )
    );
    // TODO: persist via API
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: currency || "TWD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredMatches =
    filter === "favorites" ? matches.filter((m) => m.isFavorite) : matches;

  const propertyMatches = filteredMatches.filter(
    (m) =>
      PROPERTY_SOURCES.includes(m.source) &&
      m.latitude != null &&
      m.longitude != null
  );

  const hasPropertyMatches = propertyMatches.length > 0;

  const isMapView = viewMode === "map" && hasPropertyMatches;

  // When entering map view, auto-select the first property match (if any)
  useEffect(() => {
    if (isMapView && propertyMatches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(propertyMatches[0].id);
    }
  }, [isMapView, propertyMatches, selectedMatchId]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
      {/* Premium Header */}
      <Header />

      {/* Sub Header with Page Title & View Toggle */}
      <header className="sticky top-16 z-40 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-xl font-bold text-white">Matches</span>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full text-sm font-semibold">
                  {matches.length}
                </span>
              </div>
            </div>

            {/* View toggle — only when property matches with coords exist */}
            {hasPropertyMatches && (
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    viewMode === "map"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
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
      <div className="bg-[#0a0f1a] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 text-sm ${
              filter === "all"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter("favorites")}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 text-sm flex items-center gap-2 ${
              filter === "favorites"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Heart className="h-4 w-4" />
            Favorites
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            <p className="text-slate-500 text-sm">Loading matches...</p>
          </div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <FadeIn>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 flex items-center justify-center">
                <Home className="h-12 w-12 text-amber-500/50" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {filter === "favorites" ? "No favorites yet" : "No matches yet"}
              </h2>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                {filter === "favorites"
                  ? "Save your favorite listings to see them here"
                  : "Create an alert and we'll find matches for you"}
              </p>
              {filter !== "favorites" && (
                <Link
                  href="/alerts/new"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Bell className="h-4 w-4" />
                  Create Alert
                </Link>
              )}
            </div>
          </FadeIn>
        </div>
      ) : isMapView ? (
        /* ── Map + compact list split layout ── */
        <div
          className="flex flex-1 overflow-hidden"
          style={{ height: "calc(100vh - 9rem)" }}
        >
          {/* Scrollable card list (property matches only) */}
          <div className="w-80 lg:w-96 flex-shrink-0 overflow-y-auto bg-[#0a0f1a] border-r border-white/10 scrollbar-premium">
            <StaggerContainer className="divide-y divide-white/5">
              {propertyMatches.map((match) => (
                <StaggerItem key={match.id}>
                  <motion.button
                    type="button"
                    onClick={() => setSelectedMatchId(match.id)}
                    className={`flex w-full text-left gap-4 p-4 transition-all duration-300 cursor-pointer ${
                      selectedMatchId === match.id
                        ? "bg-amber-500/10 border-l-4 border-l-amber-500"
                        : "hover:bg-white/5 border-l-4 border-l-transparent"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                      {match.imageUrl ? (
                        <img
                          src={match.imageUrl}
                          alt={match.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-6 w-6 text-slate-500" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1.5">
                        {match.title}
                      </h3>
                      {match.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                          <MapPin className="h-3 w-3 flex-shrink-0 text-amber-500/70" />
                          <span className="line-clamp-1">{match.location}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-400">
                          {formatPrice(match.price, match.currency)}
                        </span>
                        <button
                          onClick={(e) =>
                            toggleFavorite(e, match.id, match.isFavorite)
                          }
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              match.isFavorite
                                ? "fill-rose-500 text-rose-500"
                                : "text-slate-500"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.button>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          {/* Map */}
          <div className="flex-1 overflow-hidden bg-[#0a0f1a]">
            <ListingsMap
              matches={propertyMatches as Match[]}
              selectedMatchId={selectedMatchId}
              onSelectMatch={setSelectedMatchId}
              className="h-full rounded-none border-0"
            />
          </div>
        </div>
      ) : (
        /* ── Grid view ── */
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <StaggerContainer
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            staggerDelay={0.08}
          >
            {filteredMatches.map((match) => {
              const isSelected = selectedMatchId === match.id;
              return (
                <StaggerItem key={match.id}>
                  <Card
                    as="button"
                    onClick={() => setSelectedMatchId(match.id)}
                    className={`group overflow-hidden bg-white/5 border ${
                      isSelected
                        ? "border-amber-500/60 ring-2 ring-amber-500/40"
                        : "border-white/10 hover:border-amber-500/30"
                    }`}
                    glow
                  >
                  {/* Image */}
                  <div className="relative h-52 bg-white/5 overflow-hidden">
                    {match.imageUrl ? (
                      <img
                        src={match.imageUrl}
                        alt={match.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-12 w-12 text-slate-600" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent opacity-60" />

                    <button
                      onClick={(e) =>
                        toggleFavorite(e, match.id, match.isFavorite)
                      }
                      className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-110"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          match.isFavorite
                            ? "fill-rose-500 text-rose-500"
                            : "text-white/80"
                        }`}
                      />
                    </button>

                    {match.alertName && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/90 text-[#0a0f1a] text-xs font-bold">
                          <Bell className="h-3 w-3" />
                          {match.alertName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
                      {match.title}
                    </h3>

                    {match.location && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-3">
                        <MapPin className="h-4 w-4 text-amber-500/70 flex-shrink-0" />
                        <span className="line-clamp-1">{match.location}</span>
                      </div>
                    )}

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-amber-400">
                        {formatPrice(match.price, match.currency)}
                      </span>
                      {PROPERTY_SOURCES.includes(match.source) && (
                        <span className="text-slate-500 text-sm">/month</span>
                      )}
                    </div>

                    {match.area && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-4">
                        <Home className="h-4 w-4 text-amber-500/70" />
                        {match.area} ping
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock className="h-4 w-4" />
                        {new Date(
                          match.createdAt as unknown as string
                        ).toLocaleDateString()}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium text-sm group-hover:text-amber-300 transition-colors">
                        {match.source}
                        <ExternalLink className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
              );
            })}
          </StaggerContainer>
        </main>
      )}
    </div>
  );
}
