"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

interface MapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
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

const MapComponent = ({ center, zoom = 15 }: MapComponentProps) => {
  const defaultCenter = center || { lat: 37.3595704, lng: 127.105399 };

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <MapContainer
      center={[defaultCenter.lat, defaultCenter.lng]}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ width: '100%', height: '400px', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[defaultCenter.lat, defaultCenter.lng]}>
        <Popup>
          현재 위치
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;
