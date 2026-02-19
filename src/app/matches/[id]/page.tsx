"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Home,
  Clock,
  Heart,
  Loader2,
  Maximize2,
  Package,
  ShoppingCart,
  ShoppingBag,
  Monitor,
  Globe,
  Bed,
  Square,
  Building2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getAuthToken } from "@/lib/auth-token";
import type { Match } from "@/types";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { FadeIn, SlideIn } from "@/components/AnimatedContainer";

type MatchDetail = Match & { alertName?: string; alertType?: string };

const ListingsMap = dynamic(() => import("@/components/ListingsMap"), {
  ssr: false,
});

const PROPERTY_SOURCES = ["591"];

const SOURCE_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "591": { label: "591 Rent", icon: Home },
  momo: { label: "Momo", icon: ShoppingCart },
  pchome: { label: "PChome", icon: Monitor },
  amazon: { label: "Amazon", icon: Package },
  shopee: { label: "Shopee", icon: ShoppingBag },
  custom: { label: "Custom", icon: Globe },
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: currency || "TWD",
    maximumFractionDigits: 0,
  }).format(price);
}

function extractRoomsFromTitle(title: string): number | undefined {
  const roomMatch = title.match(/(\d+)房/);
  return roomMatch ? parseInt(roomMatch[1], 10) : undefined;
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    const token = getAuthToken();
    if (!token) return;

    fetch(`/api/matches/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        setMatch(data.match);
        setIsFavorite(data.match.isFavorite);
      })
      .catch(() => setError("Match not found."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            <p className="text-slate-500 text-sm">Loading match details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Home className="h-10 w-10 text-slate-500" />
          </div>
          <p className="text-slate-400">{error || "Match not found."}</p>
          <Link
            href="/matches"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10 hover:text-amber-300 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4" /> Back to matches
          </Link>
        </div>
      </div>
    );
  }

  const sourceMeta = SOURCE_META[match.source] ?? SOURCE_META.custom;
  const SourceIcon = sourceMeta.icon;
  const isProperty = PROPERTY_SOURCES.includes(match.source);
  const hasCoords = match.latitude != null && match.longitude != null;

  const metadata = match.metadata || {};
  const rooms = metadata.rooms ?? extractRoomsFromTitle(match.title);
  const areaText = metadata.areaText;
  const layoutStr = metadata.layoutStr;
  const kindName = metadata.kind_name;
  const photoList = Array.isArray(metadata.photoList) ? metadata.photoList : [];
  const allImages =
    photoList.length > 0 ? photoList : match.imageUrl ? [match.imageUrl] : [];

  const pricePerPing =
    match.area && match.area > 0 ? Math.round(match.price / match.area) : null;

  const specs = [
    rooms && { icon: Bed, label: `${rooms}房` },
    match.area && {
      icon: Square,
      label: areaText || `${match.area}坪`,
    },
    layoutStr && { icon: Home, label: layoutStr },
    kindName && { icon: Building2, label: kindName },
  ].filter(Boolean) as Array<{ icon: typeof Bed; label: string }>;

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
      {/* Premium Header */}
      <Header />

      {/* Sub Header */}
      <header className="sticky top-16 z-40 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/matches"
              className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Matches</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleFavorite}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all duration-300"
                title={isFavorite ? "Remove" : "Save"}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    isFavorite
                      ? "fill-rose-500 text-rose-500"
                      : "text-slate-400"
                  }`}
                />
              </button>
              <a
                href={match.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                View on {sourceMeta.label}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero: full-bleed image or placeholder */}
          <FadeIn>
            <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[500px] rounded-2xl overflow-hidden bg-white/5 border border-white/10">
              {allImages.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImageIndex}
                      src={allImages[selectedImageIndex]}
                      alt={match.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </AnimatePresence>

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/40 to-transparent"
                    aria-hidden
                  />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                    {match.alertName && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-[#0a0f1a] text-sm font-bold shadow-lg shadow-amber-500/25">
                        <Sparkles className="h-4 w-4" /> {match.alertName}
                      </span>
                    )}
                    {allImages.length > 1 && (
                      <span className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm text-white text-sm font-medium border border-white/10">
                        {selectedImageIndex + 1} / {allImages.length}
                      </span>
                    )}
                  </div>

                  {/* Expand button (single image) */}
                  {allImages.length === 1 && (
                    <a
                      href={allImages[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-all duration-300 border border-white/10"
                      aria-label="View full size"
                    >
                      <Maximize2 className="h-5 w-5 text-white" />
                    </a>
                  )}

                  {/* Nav arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((p) =>
                            p === 0 ? allImages.length - 1 : p - 1
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center transition-all duration-300 border border-white/10"
                        aria-label="Previous"
                      >
                        <ChevronLeft className="h-5 w-5 text-white" />
                      </button>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((p) =>
                            p === allImages.length - 1 ? 0 : p + 1
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center transition-all duration-300 border border-white/10"
                        aria-label="Next"
                      >
                        <ChevronRight className="h-5 w-5 text-white" />
                      </button>
                    </>
                  )}

                  {/* Title + price overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white drop-shadow-lg max-w-4xl">
                      {match.title}
                    </h1>
                    <div className="mt-4 flex items-baseline gap-4 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-bold text-amber-400">
                        {formatPrice(match.price, match.currency)}
                      </span>
                      {isProperty && (
                        <span className="text-slate-400 text-lg">/month</span>
                      )}
                      {pricePerPing && (
                        <span className="text-slate-500 text-base">
                          {formatPrice(pricePerPing, match.currency)}/坪
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <SourceIcon className="h-24 w-24 text-slate-700" />
                </div>
              )}
            </section>
          </FadeIn>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <SlideIn from="bottom" delay={0.1}>
              <div className="flex gap-3 py-5 overflow-x-auto scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      idx === selectedImageIndex
                        ? "border-amber-500 ring-2 ring-amber-500/30"
                        : "border-transparent hover:border-white/20 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </SlideIn>
          )}

          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Spec chips */}
              {isProperty && specs.length > 0 && (
                <FadeIn delay={0.15}>
                  <Card className="p-6 bg-white/5 border-white/10">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-500" />
                      Property Details
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {specs.map(({ icon: Icon, label }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:border-amber-500/30 transition-colors duration-300"
                        >
                          <Icon className="h-4 w-4 text-amber-500" />
                          {label}
                        </span>
                      ))}
                    </div>
                  </Card>
                </FadeIn>
              )}

              {/* Info card */}
              <FadeIn delay={0.2}>
                <Card className="overflow-hidden bg-white/5 border-white/10">
                  <div className="divide-y divide-white/5">
                    {match.location && (
                      <div className="flex items-center gap-4 p-5">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Location
                          </p>
                          <p className="text-slate-200 font-medium mt-1">
                            {match.location}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 p-5">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Found
                        </p>
                        <p className="text-slate-200 font-medium mt-1">
                          {new Date(
                            match.createdAt as unknown as string
                          ).toLocaleString("zh-TW", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-5">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <SourceIcon className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Source
                        </p>
                        <a
                          href={match.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-amber-400 font-medium mt-1 hover:text-amber-300 transition-colors"
                        >
                          {sourceMeta.label}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              </FadeIn>

              {/* Map */}
              {isProperty && hasCoords && (
                <FadeIn delay={0.25}>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      Location
                    </h2>
                    <Card className="overflow-hidden bg-white/5 border-white/10 p-0">
                      <ListingsMap
                        matches={[match] as Match[]}
                        selectedMatchId={match.id}
                        onSelectMatch={() => {}}
                        className="h-80 rounded-xl overflow-hidden"
                      />
                    </Card>
                  </div>
                </FadeIn>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <FadeIn delay={0.2}>
                <Card className="p-6 bg-white/5 border-white/10">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <a
                      href={match.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Original
                    </a>
                    <button
                      onClick={toggleFavorite}
                      className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isFavorite
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                          : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isFavorite ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                      {isFavorite ? "Saved" : "Save to Favorites"}
                    </button>
                  </div>
                </Card>
              </FadeIn>

              {/* Price Breakdown */}
              {pricePerPing && (
                <FadeIn delay={0.25}>
                  <Card className="p-6 bg-white/5 border-white/10">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      Price Analysis
                    </h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Price</span>
                        <span className="text-xl font-bold text-white">
                          {formatPrice(match.price, match.currency)}
                        </span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Area</span>
                        <span className="text-slate-200 font-medium">
                          {match.area} ping
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Price per Ping</span>
                        <span className="text-amber-400 font-semibold">
                          {formatPrice(pricePerPing, match.currency)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </FadeIn>
              )}

              {/* Alert Info */}
              {match.alertName && (
                <FadeIn delay={0.3}>
                  <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                      </div>
                      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        Matched From
                      </h2>
                    </div>
                    <p className="text-white font-semibold text-lg">
                      {match.alertName}
                    </p>
                    {match.alertType && (
                      <p className="text-slate-400 text-sm mt-1">
                        Type: {match.alertType}
                      </p>
                    )}
                  </Card>
                </FadeIn>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
