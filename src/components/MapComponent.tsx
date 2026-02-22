"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import { formatDistance } from '@/lib/distance';

interface MarkerData {
  lat: number;
  lng: number;
  name: string;
  address: string;
  distance?: number; // 미터 단위
}

interface MapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MarkerData[]; // 여러 마커 표시
}

// Leaflet 아이콘 수정 (Next.js에서 아이콘이 안 보이는 문제 해결)
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// 빨간색 마커 아이콘 (음식점용)
const redIcon = new L.Icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 파란색 마커 아이콘 (현재 위치용)
const blueIcon = new L.Icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 지도 중심 업데이트 컴포넌트
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const MapComponent = ({ center, zoom = 15, markers = [] }: MapComponentProps) => {
  const defaultCenter = center || { lat: 37.5665, lng: 126.9780 }; // 서울 시청
  const position: [number, number] = [defaultCenter.lat, defaultCenter.lng];

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={position} zoom={zoom} />
      
      {/* 현재 위치 마커 (파란색) */}
      <Marker position={position} icon={blueIcon}>
        <Popup>
          📍 현재 위치
        </Popup>
      </Marker>
      
      {/* 여러 마커 표시 (빨간색) */}
      {markers.map((marker, index) => (
        <Marker 
          key={index} 
          position={[marker.lat, marker.lng]}
          icon={redIcon}
        >
          <Popup>
            <div>
              <strong className="text-base">{marker.name}</strong>
              {marker.distance !== undefined && (
                <div className="text-sm font-semibold text-blue-600 mt-1">
                  📍 {formatDistance(marker.distance)}
                </div>
              )}
              <div className="text-sm text-gray-600 mt-1">{marker.address}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
