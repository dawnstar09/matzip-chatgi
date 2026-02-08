'use client';

import NaverMap from '@/components/NaverMap';

export default function MapSimplePage() {
  return (
    <div className="w-full h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Naver Map 단순 렌더링 테스트</h1>
      <p className="mb-4">
        아래에 지도가 나타나야 합니다.
      </p>
      <NaverMap center={{ lat: 37.3595704, lng: 127.105399 }} zoom={10} />
    </div>
  );
}
