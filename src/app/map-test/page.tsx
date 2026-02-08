'use client';

import { useState } from 'react';
import NaverMap from '@/components/NaverMap';
import { geocodeAddress } from '@/lib/geocoding';

export default function MapTestPage() {
  const [location, setLocation] = useState({
    lat: 37.5665,
    lng: 126.9780,
  });
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const locations = [
    { name: '서울 시청', lat: 37.5665, lng: 126.9780 },
    { name: '강남역', lat: 37.4979, lng: 127.0276 },
    { name: '홍대입구', lat: 37.5572, lng: 126.9236 },
  ];

  const handleAddressSearch = async () => {
    if (!address.trim()) {
      setResult('주소를 입력하세요');
      return;
    }

    setLoading(true);
    setResult('검색 중...');

    const geocoded = await geocodeAddress(address);
    
    if (geocoded) {
      setLocation({ lat: geocoded.lat, lng: geocoded.lng });
      setResult(`도로명: ${geocoded.roadAddress}\n지번: ${geocoded.jibunAddress}`);
    } else {
      setResult('주소를 찾을 수 없습니다');
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Naver Map 테스트</h1>
      
      {/* 주소 검색 */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">주소로 검색</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
            placeholder="예: 서울시 강남구 테헤란로 152"
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddressSearch}
            disabled={loading}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
        {result && (
          <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{result}</p>
        )}
      </div>

      {/* 빠른 이동 버튼 */}
      <div className="mb-4 space-x-2">
        {locations.map((loc) => (
          <button
            key={loc.name}
            onClick={() => setLocation({ lat: loc.lat, lng: loc.lng })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loc.name}
          </button>
        ))}
      </div>

      <NaverMap 
        center={{ lat: location.lat, lng: location.lng }}
        zoom={15}
      />
    </div>
  );
}
