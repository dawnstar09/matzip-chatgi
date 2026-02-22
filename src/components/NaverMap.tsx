"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface MarkerData {
  lat: number;
  lng: number;
  name: string;
  address: string;
  distance?: number;
}

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MarkerData[];
}

// Leaflet은 브라우저에서만 작동하므로 dynamic import 사용
const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', minHeight: '400px', backgroundColor: '#f0f0f0' }} className="flex items-center justify-center">
        <p className="text-gray-500">지도를 불러오는 중...</p>
      </div>
    )
  }
);

const NaverMap = ({ center, zoom = 15, markers = [] }: NaverMapProps) => {
  return <MapComponent center={center} zoom={zoom} markers={markers} />;
};

export default NaverMap;