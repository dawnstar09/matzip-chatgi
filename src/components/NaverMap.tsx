"use client";

import { useRef } from "react";
import Script from "next/script";

interface NaverMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

const NaverMap = ({ center, zoom = 10 }: NaverMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  // 지도 초기화 (HTML 코드와 동일한 로직)
  const initMap = () => {
    if (!window.naver || !mapRef.current) return;

    // 기본 위치: HTML 코드와 동일
    const defaultCenter = new window.naver.maps.LatLng(37.3595704, 127.105399);
    const mapCenter = center
      ? new window.naver.maps.LatLng(center.lat, center.lng)
      : defaultCenter;

    const mapOptions = {
      center: mapCenter,
      zoom: zoom,
    };

    new window.naver.maps.Map(mapRef.current, mapOptions);
  };

  return (
    <>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <div ref={mapRef} style={{ width: "100%", height: "400px" }} />
    </>
  );
};

export default NaverMap;