"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

const NaverMap = ({ center, zoom = 15 }: NaverMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const initMap = () => {
    if (!mapRef.current || typeof window === 'undefined' || !window.Tmapv2) return;

    const defaultCenter = center || { lat: 37.3595704, lng: 127.105399 };

    try {
      mapInstance.current = new window.Tmapv2.Map(mapRef.current, {
        center: new window.Tmapv2.Point(defaultCenter.lng, defaultCenter.lat),
        width: "100%",
        height: "400px",
        zoom: zoom,
      });
    } catch (error) {
      console.error("TMAP 초기화 오류:", error);
    }
  };

  useEffect(() => {
    if (window.Tmapv2 && mapRef.current) {
      initMap();
    }
  }, [center, zoom]);

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
        onLoad={initMap}
      />
      <div ref={mapRef} style={{ width: "100%", height: "400px" }} />
    </>
  );
};

export default NaverMap;