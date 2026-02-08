"use client";

import { GoogleMap, LoadScript } from '@react-google-maps/api';

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 37.3595704,
  lng: 127.105399
};

const NaverMap = ({ center, zoom = 10 }: NaverMapProps) => {
  const mapCenter = center || defaultCenter;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div style={containerStyle} className="flex items-center justify-center bg-gray-100">
        <p className="text-red-600">Google Maps API 키가 설정되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
      />
    </LoadScript>
  );
};

export default NaverMap;