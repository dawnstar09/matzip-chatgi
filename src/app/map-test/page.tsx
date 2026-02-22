'use client';

import NaverMap from '@/components/NaverMap';

export default function MyPage() {
  return (
    <div className="h-screen">
      <NaverMap 
        center={{ lat: 37.5665, lng: 126.9780 }}  // 서울 시청
        zoom={15}  // 줌 레벨 (1-21)
      />
    </div>
  );
}