'use client';

import { useEffect, useState } from 'react';

export default function MapSimpleTest() {
  const [debug, setDebug] = useState<string[]>([]);

  useEffect(() => {
    const logs: string[] = [];
    
    logs.push(`1. window exists: ${typeof window !== 'undefined'}`);
    logs.push(`2. window.naver exists: ${typeof window.naver !== 'undefined'}`);
    logs.push(`3. window.naver.maps exists: ${typeof window.naver?.maps !== 'undefined'}`);
    logs.push(`4. Client ID from env: ${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`);
    
    setDebug([...logs]);

    // Naver Maps API 로드 대기
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (window.naver && window.naver.maps) {
        clearInterval(checkInterval);
        logs.push(`5. ✅ Naver Maps API loaded after ${attempts * 100}ms`);
        setDebug([...logs]);
        
        try {
          const center = new window.naver.maps.LatLng(36.3504, 127.3845);
          const map = new window.naver.maps.Map('map', {
            center: center,
            zoom: 16
          });
          
          logs.push('6. ✅ Map created successfully!');
          setDebug([...logs]);
          console.log('Map created:', map);
        } catch (err) {
          logs.push(`6. ❌ Map creation error: ${err}`);
          setDebug([...logs]);
          console.error('Map error:', err);
        }
      } else if (attempts > 50) {
        clearInterval(checkInterval);
        logs.push('5. ❌ Timeout: Naver Maps API not loaded after 5 seconds');
        setDebug([...logs]);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  return (
    <div className="w-full h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Naver Map 단순 테스트</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">디버그 정보:</h2>
        {debug.map((log, i) => (
          <div key={i} className="text-sm font-mono">{log}</div>
        ))}
      </div>
      
      <div id="map" style={{ width: '100%', height: '600px', border: '2px solid red' }}></div>
    </div>
  );
}
