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
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Filter matches that have coordinates
  const matchesWithCoords = matches.filter(
    m => m.latitude != null && m.longitude != null && !isNaN(m.latitude) && !isNaN(m.longitude)
  );
  
  if (!isClient) {
    return (
      <div className={`w-full h-[500px] bg-slate-900 rounded-xl flex items-center justify-center ${className ?? ''}`}>
        <p className="text-slate-500">Loading map...</p>
      </div>
    );
  }

  if (matchesWithCoords.length === 0) {
    return (
      <div className={`w-full h-[500px] bg-slate-900 rounded-xl flex items-center justify-center border border-white/10 ${className ?? ''}`}>
        <div className="text-center">
          <p className="text-slate-400 font-medium">Map unavailable</p>
          <p className="text-slate-500 text-sm mt-1">No location data available for these listings</p>
        </div>
      </div>
    );
  }

  // Default center: Taiwan (roughly center of the island)
  const defaultCenter: [number, number] = [23.5, 121.0];

  return (
    <div className={`w-full h-[500px] rounded-xl overflow-hidden border border-white/10 ${className ?? ''}`}>
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
