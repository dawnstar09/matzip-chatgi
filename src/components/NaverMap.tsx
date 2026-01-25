/// <reference types="navermaps" />
'use client';

import { useEffect, useRef } from 'react';

interface NaverMapProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  className?: string;
}

export default function NaverMap({
  lat = 37.5665,
  lng = 126.9780,
  zoom = 15,
  className = 'w-full h-[400px]',
}: NaverMapProps) {
  const mapDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapDiv.current || !window.naver) return;

    const location = new window.naver.maps.LatLng(lat, lng);
    
    const map = new window.naver.maps.Map(mapDiv.current, {
      center: location,
      zoom: zoom,
    });

    new window.naver.maps.Marker({
      position: location,
      map: map,
    });
  }, [lat, lng, zoom]);

  return <div ref={mapDiv} className={className} style={{ width: '100%', height: '100%' }} />;
}

