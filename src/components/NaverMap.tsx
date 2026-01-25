/// <reference types="navermaps" />
'use client';

import { useEffect } from 'react';

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
  useEffect(() => {
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (window.naver && window.naver.maps) {
        clearInterval(checkInterval);
        
        const mapElement = document.getElementById('naverMap');
        if (mapElement) {
          const center = new window.naver.maps.LatLng(lat, lng);
          const map = new window.naver.maps.Map('naverMap', {
            center: center,
            zoom: zoom,
          });

          new window.naver.maps.Marker({
            position: center,
            map: map,
          });
          
          console.log('✅ Main page map created successfully!');
        }
      } else if (attempts > 50) {
        clearInterval(checkInterval);
        console.error('Naver Maps API not loaded');
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [lat, lng, zoom]);

  return <div id="naverMap" className={className} style={{ width: '100%', height: '100%', minHeight: '500px' }} />;
}

