'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Match } from '@/types';
import { Loader2, Maximize2, Minimize2, Navigation } from 'lucide-react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ListingsMap3DProps {
  matches: Match[];
  selectedMatchId: string | null;
  className?: string;
}

export default function ListingsMap3D({ matches, selectedMatchId, className }: ListingsMap3DProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const lat = selectedMatch?.latitude || 23.5;
    const lng = selectedMatch?.longitude || 121.0;

    // Using a reliable dark theme style that supports 3D buildings
    // MapTiler's basic dark style or similar
    const styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [lng, lat],
      zoom: 16,
      pitch: 60, // Tilted for 3D effect
      bearing: -17.6
    });

    map.current.on('load', () => {
      setIsLoaded(true);
      if (!map.current) return;

      // Add 3D buildings layer if not present in the style
      // Most Carto styles don't have 3D buildings by default, 
      // but we can add them if the source has 'render-height'
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      // Adding 3D buildings layer from OSM data if available in source
      // Note: This depends on the tile source providing building heights
      if (map.current.getSource('openmaptiles')) {
        map.current.addLayer(
          {
            'id': '3d-buildings',
            'source': 'openmaptiles',
            'source-layer': 'building',
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
              'fill-extrusion-color': '#334155',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'render_height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'render_min_height']
              ],
              'fill-extrusion-opacity': 0.8
            }
          },
          labelLayerId
        );
      }

      // Add markers for matches
      matches.forEach(m => {
        if (m.latitude && m.longitude) {
          const el = document.createElement('div');
          el.className = 'marker-3d';
          
          const isSelected = m.id === selectedMatchId;
          
          el.style.width = isSelected ? '32px' : '24px';
          el.style.height = isSelected ? '32px' : '24px';
          el.style.backgroundColor = isSelected ? '#f59e0b' : '#334155';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid white';
          el.style.boxShadow = isSelected ? '0 0 15px rgba(245, 158, 11, 0.6)' : 'none';
          el.style.cursor = 'pointer';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.transition = 'all 0.3s ease';

          if (isSelected) {
            el.innerHTML = '<div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>';
          }

          new maplibregl.Marker(el)
            .setLngLat([m.longitude, m.latitude])
            .setPopup(
              new maplibregl.Popup({ offset: 25 })
                .setHTML(`
                  <div class="p-2 text-slate-900">
                    <h3 class="font-bold text-sm">${m.title}</h3>
                    <p class="text-xs font-bold text-amber-600 mt-1">NT$${m.price.toLocaleString()}</p>
                  </div>
                `)
            )
            .addTo(map.current!);
        }
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [matches, selectedMatchId, selectedMatch]);

  // Update center when selectedMatch changes
  useEffect(() => {
    if (map.current && selectedMatch?.latitude && selectedMatch?.longitude) {
      map.current.flyTo({
        center: [selectedMatch.longitude, selectedMatch.latitude],
        zoom: 17,
        pitch: 65,
        bearing: -20,
        essential: true,
        duration: 2000
      });
    }
  }, [selectedMatchId]);

  const resetCamera = () => {
    if (map.current && selectedMatch?.latitude && selectedMatch?.longitude) {
      map.current.flyTo({
        center: [selectedMatch.longitude, selectedMatch.latitude],
        zoom: 17,
        pitch: 65,
        bearing: -20,
        duration: 1000
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Give time for the container to resize before telling the map to resize
    setTimeout(() => {
      map.current?.resize();
    }, 100);
  };
  
  const containerClassName = cn(
    "relative rounded-xl overflow-hidden border border-white/10 group bg-slate-900",
    isFullscreen ? "fixed inset-0 z-[100] m-4" : className || "h-80"
  );

  return (
    <div className={containerClassName}>
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-slate-900/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-slate-400 text-sm font-medium">Initializing 3D Environment...</p>
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* 3D Map Controls */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-10">
        <button 
          onClick={resetCamera}
          className="p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white hover:bg-amber-500 hover:text-slate-900 transition-all shadow-lg"
          title="Reset Camera"
        >
          <Navigation className="h-4 w-4" />
        </button>
        <button 
          onClick={toggleFullscreen}
          className="p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white hover:bg-amber-500 hover:text-slate-900 transition-all shadow-lg"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Floating Info */}
      <div className="absolute top-4 left-4 z-10 p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 max-w-[200px]">
        <p className="text-[10px] uppercase tracking-wider text-amber-500 font-bold mb-1">3D Visualization</p>
        <p className="text-white text-xs font-medium leading-tight">
          Right-click to rotate, scroll to zoom, drag to pan.
        </p>
      </div>

      <style jsx global>{`
        .maplibregl-popup-content {
          border-radius: 12px !important;
          padding: 8px !important;
          background: white !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
        }
        .maplibregl-popup-tip {
          border-top-color: white !important;
        }
        .marker-3d:hover {
          transform: scale(1.2);
          z-index: 20;
        }
      `}</style>
    </div>
  );
}
