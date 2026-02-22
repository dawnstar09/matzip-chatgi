"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    naver: any;
  }
}

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function NaverMap({ 
  center = { lat: 37.5665, lng: 126.9780 }, // 기본값: 서울 시청
  zoom = 15 
}: NaverMapProps) {
  console.log('Naver Map Client ID:', process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID);
  
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);

  const initMap = () => {
    if (!window.naver || !mapRef.current) return;

    const mapCenter = new window.naver.maps.LatLng(center.lat, center.lng);

    mapInstance.current = new window.naver.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom,
    });

    new window.naver.maps.Marker({
      position: mapCenter,
      map: mapInstance.current,
    });
  };

  useEffect(() => {
    if (window.naver?.maps) {
      initMap();
    }
  }, [center.lat, center.lng, zoom]);

  return (
    <>
      {/* 네이버 맵 SDK 로드 */}
      <Script
        strategy="afterInteractive"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
        onLoad={initMap}
      />

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "12px",
        }}
      />
    </>
  );
}