"use client";

import { useRef, useState } from "react";
import Script from "next/script";

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

const NaverMap = ({ center, zoom = 15 }: NaverMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const initMap = () => {
    if (!mapRef.current || typeof window === 'undefined' || !window.Tmapv2) {
      console.log("TMAP not ready");
      return;
    }

    const defaultCenter = center || { lat: 37.3595704, lng: 127.105399 };

    try {
      console.log("Initializing TMAP...");
      
      mapInstance.current = new window.Tmapv2.Map(mapRef.current, {
        center: new window.Tmapv2.LatLng(defaultCenter.lat, defaultCenter.lng),
        width: "100%",
        height: "400px",
        zoom: zoom,
      });
      
      console.log("TMAP initialized successfully");
      setIsLoaded(true);
    } catch (error) {
      console.error("TMAP 초기화 오류:", error);
    }
  };

  const apiKey = process.env.NEXT_PUBLIC_TMAP_API_KEY;

  if (!apiKey) {
    return (
      <div style={{ width: '100%', height: '400px' }} className="flex items-center justify-center bg-gray-100">
        <p className="text-red-600">TMAP API 키가 설정되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${apiKey}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("TMAP script loaded");
          setTimeout(initMap, 100);
        }}
        onError={(e) => {
          console.error("TMAP script load error:", e);
        }}
      />
      <div ref={mapRef} style={{ width: "100%", height: "400px", backgroundColor: '#f0f0f0' }}>
        {!isLoaded && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">지도를 불러오는 중...</p>
          </div>
        )}
      </div>
    </>
  );
};

export default NaverMap;