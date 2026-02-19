'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Match } from '@/types';

interface MapBoundsUpdaterProps {
  matches: Match[];
  selectedMatchId: string | null;
}

export default function MapBoundsUpdater({ matches, selectedMatchId }: MapBoundsUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    const coords = matches
      .filter(m => m.latitude != null && m.longitude != null)
      .map(m => [m.latitude!, m.longitude!] as [number, number]);
    
    if (coords.length === 0) return;
    
    // Fit bounds to show all markers
    if (coords.length > 1) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Single marker: center on it with reasonable zoom
      map.setView(coords[0], 15);
    }
  }, [matches, map]);
  
  // Pan to selected marker when selection changes
  useEffect(() => {
    if (!selectedMatchId) return;
    
    const selectedMatch = matches.find(m => m.id === selectedMatchId);
    if (selectedMatch?.latitude != null && selectedMatch?.longitude != null) {
      map.setView([selectedMatch.latitude, selectedMatch.longitude], 16, {
        animate: true,
      });
    }
  }, [selectedMatchId, matches, map]);
  
  return null;
}
