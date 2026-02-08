'use client';

import { NaverMap, Container, NavermapsProvider } from 'react-naver-maps';

export default function MapSimplePage() {
  const naverMapClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!naverMapClientId) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="p-8 bg-red-100 text-red-700 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">오류: 네이버 지도 클라이언트 ID가 없습니다.</h1>
          <p>.env.local 파일에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <NavermapsProvider ncpClientId={naverMapClientId}>
      <div className="w-full h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">Naver Map 단순 렌더링 테스트</h1>
        <p className="mb-4">
          아래 빨간색 테두리 안에 지도가 나타나야 합니다.
        </p>
        <Container style={{ width: '100%', height: '600px', border: '2px solid red' }}>
          <NaverMap />
        </Container>
      </div>
    </NavermapsProvider>
  );
}
