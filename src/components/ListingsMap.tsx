'use client';

import { useEffect, useState } from 'react';
import type { Match } from '@/types';
import dynamic from 'next/dynamic';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Initialize default icon only on client side
let DefaultIcon: L.Icon | null = null;
let SelectedIcon: L.Icon | null = null;
let DroppedIcon: L.Icon | null = null;

if (typeof window !== 'undefined') {
  const iconUrl = typeof icon === "string" ? icon : icon.src;
  const iconRetinaUrl = typeof iconRetina === "string" ? iconRetina : iconRetina.src;
  const shadowUrl = typeof iconShadow === "string" ? iconShadow : iconShadow.src;

  DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],  
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });
  
  SelectedIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [35, 57], // Larger for selected
    iconAnchor: [17, 57],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
    className: 'selected-marker'
  });
  
  L.Marker.prototype.options.icon = DefaultIcon;
}

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);
const MarkerClusterGroup = dynamic(
  () => import('react-leaflet-cluster'),
  { ssr: false }
);
const MapBoundsUpdater = dynamic(
  () => import('./MapBoundsUpdater'),
  { ssr: false }
);

interface ListingsMapProps {
  matches: Match[];
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  className?: string;
}

export default function ListingsMap({ matches, selectedMatchId, onSelectMatch, className }: ListingsMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedRooms, setSelectedRooms] = useState<number | null>(null);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Apply filters
  const filteredMatches = matches.filter(m => {
    if (minPrice && m.price < parseInt(minPrice)) return false;
    if (maxPrice && m.price > parseInt(maxPrice)) return false;
    if (selectedRooms !== null && m.metadata?.rooms !== selectedRooms) {
      if (selectedRooms === 4) {
        if ((m.metadata?.rooms || 0) < 4) return false;
      } else {
        return false;
      }
    }
    return true;
  });

  // Filter matches that have coordinates
  const matchesWithCoords = filteredMatches.filter(
    m => m.latitude != null && m.longitude != null && !isNaN(m.latitude) && !isNaN(m.longitude)
  );
  
  if (!isClient) {
    return (
      <div className={`w-full h-[500px] bg-slate-900 rounded-xl flex items-center justify-center ${className ?? ''}`}>
        <p className="text-slate-500">Loading map...</p>
      </div>
    );
  }

  // Default center: Taiwan (roughly center of the island)
  const defaultCenter: [number, number] = [23.5, 121.0];

  return (
    <div className={`w-full h-[500px] rounded-xl overflow-hidden border border-white/10 relative ${className ?? ''}`}>
      {/* Floating Filter Panel */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl w-64">
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Quick Filters
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">Price Range</label>
            <div className="flex gap-2 items-center">
              <input 
                type="number" 
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-slate-800 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
              <span className="text-slate-600">-</span>
              <input 
                type="number" 
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-slate-800 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">Rooms</label>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => setSelectedRooms(selectedRooms === num ? null : num)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    selectedRooms === num 
                    ? 'bg-amber-500 text-slate-900' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {num}{num === 4 ? '+' : ''}
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">{matchesWithCoords.length} results</span>
            <button 
              onClick={() => { setMinPrice(''); setMaxPrice(''); setSelectedRooms(null); }}
              className="text-[10px] text-amber-500 hover:text-amber-400 font-bold"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={8}
        style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapBoundsUpdater matches={matchesWithCoords} selectedMatchId={selectedMatchId} />
        
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
        >
          {matchesWithCoords.map(match => {
            const isSelected = match.id === selectedMatchId;
            const markerProps: { icon?: L.Icon } = {};
            if (isSelected && SelectedIcon) {
              markerProps.icon = SelectedIcon;
            }
            
            return (
              <Marker
                key={match.id}
                position={[match.latitude!, match.longitude!]}
                {...markerProps}
                eventHandlers={{
                  click: () => {
                    onSelectMatch(match.id);
                  },
                }}
              >
                <Popup className="premium-popup">
                  <div className="p-1">
                    <div className="flex items-center justify-between mb-1 gap-4">
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{match.title}</h3>
                      {match.isPriceDropped && (
                        <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">Price Dropped</span>
                      )}
                    </div>
                    {match.location && (
                      <p className="text-[11px] text-slate-600 mb-2 line-clamp-1">{match.location}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-indigo-600">
                        NT${match.price.toLocaleString()}
                      </p>
                      {match.area && (
                        <span className="text-[10px] text-slate-500">{match.area} ping</span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
      
      <style jsx global>{`
        .leaflet-container {
          background: #0a0f1a !important;
        }
        .premium-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 4px;
        }
        .selected-marker {
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
        }
        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
          background-color: rgba(251, 191, 36, 0.6) !important;
        }
        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
          background-color: rgba(251, 191, 36, 0.9) !important;
          color: white !important;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
