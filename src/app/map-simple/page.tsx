'use client';

import { useEffect } from 'react';

export default function MapSimpleTest() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.naver && window.naver.maps) {
      const center = new window.naver.maps.LatLng(36.3504, 127.3845);
      
      const map = new window.naver.maps.Map('map', {
        center: center,
        zoom: 16
      });
      
      console.log('Map created:', map);
    }
  }, []);

  return (
    <div className="w-full h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Naver Map 단순 테스트</h1>
      <div id="map" style={{ width: '100%', height: '600px', border: '2px solid red' }}></div>
    </div>
  );
}
