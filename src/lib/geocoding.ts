interface GeocodingResult {
  lat: number;
  lng: number;
  roadAddress: string;
  jibunAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    
    if (!response.ok) {
      // 지오코딩 실패 시 조용히 null 반환 (주소가 잘못되었거나 찾을 수 없는 경우)
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // 네트워크 에러 등의 경우에만 로그 출력
    console.warn('Geocoding network error:', error);
    return null;
  }
}
