"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

// Leaflet은 브라우저에서만 작동하므로 dynamic import 사용
const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '400px', backgroundColor: '#f0f0f0', borderRadius: '8px' }} className="flex items-center justify-center">
        <p className="text-gray-500">지도를 불러오는 중...</p>
      </div>
    )
  }
);

const NaverMap = ({ center, zoom = 15 }: NaverMapProps) => {
  return <MapComponent center={center} zoom={zoom} />;
};

export default NaverMap;