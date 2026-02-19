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

if (typeof window !== 'undefined') {
  DefaultIcon = L.icon({
    iconUrl: icon.src || icon,
    iconRetinaUrl: iconRetina.src || iconRetina,
    shadowUrl: iconShadow.src || iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });
  
  SelectedIcon = L.icon({
    iconUrl: icon.src || icon,
    iconRetinaUrl: iconRetina.src || iconRetina,
    shadowUrl: iconShadow.src || iconShadow,
    iconSize: [35, 57], // Larger for selected
    iconAnchor: [17, 57],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
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
      <div className={`w-full h-[500px] bg-slate-100 rounded-xl flex items-center justify-center ${className ?? ''}`}>
        <p className="text-slate-500">Loading map...</p>
      </div>
    );
  }

  if (matchesWithCoords.length === 0) {
    return (
      <div className={`w-full h-[500px] bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 ${className ?? ''}`}>
        <div className="text-center">
          <p className="text-slate-600 font-medium">Map unavailable</p>
          <p className="text-slate-400 text-sm mt-1">No location data available for these listings</p>
        </div>
      </div>
    );
  }

  // Default center: Taiwan (roughly center of the island)
  const defaultCenter: [number, number] = [23.5, 121.0];

  return (
    <div className={`w-full h-[500px] rounded-xl overflow-hidden border border-slate-200 ${className ?? ''}`}>
      <MapContainer
        center={defaultCenter}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater matches={matchesWithCoords} selectedMatchId={selectedMatchId} />
        
        {matchesWithCoords.map(match => {
          const isSelected = match.id === selectedMatchId;
          // Only pass icon prop if we have a custom selected icon, otherwise use default from prototype
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
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{match.title}</h3>
                  {match.location && (
                    <p className="text-xs text-slate-600 mb-1">{match.location}</p>
                  )}
                  <p className="text-sm font-bold text-indigo-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: match.currency || 'TWD',
                      maximumFractionDigits: 0,
                    }).format(match.price)}
                  </p>
                  <a
                    href={`/matches/${match.id}`}
                    className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                  >
                    View details →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
